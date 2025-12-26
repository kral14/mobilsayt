use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

use crate::models::{Product, Warehouse, Category, ProductWithRelations};

#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub search: Option<String>,
    pub category_id: Option<i32>,
    pub ids: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub error: Option<String>,
}

#[derive(sqlx::FromRow)]
struct ProductRow {
    // Product fields
    id: i32,
    name: String,
    barcode: Option<String>,
    description: Option<String>,
    unit: Option<String>,
    purchase_price: Option<Decimal>,
    sale_price: Option<Decimal>,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
    code: Option<String>,
    article: Option<String>,
    category_id: Option<i32>,
    #[sqlx(rename = "type")]
    product_type: Option<String>,
    brand: Option<String>,
    model: Option<String>,
    color: Option<String>,
    size: Option<String>,
    weight: Option<Decimal>,
    country: Option<String>,
    manufacturer: Option<String>,
    warranty_period: Option<i32>,
    min_stock: Option<Decimal>,
    max_stock: Option<Decimal>,
    tax_rate: Option<Decimal>,
    is_active: Option<bool>,
    production_date: Option<NaiveDateTime>,
    expiry_date: Option<NaiveDateTime>,
    // Warehouse fields (from JOIN)
    warehouse_id: Option<i32>,
    warehouse_product_id: Option<i32>,
    warehouse_quantity: Option<Decimal>,
    warehouse_updated_at: Option<NaiveDateTime>,
    // Category fields (from JOIN)
    category_id_join: Option<i32>,
    category_name: Option<String>,
    category_parent_id: Option<i32>,
    category_created_at: Option<NaiveDateTime>,
    category_updated_at: Option<NaiveDateTime>,
}

pub async fn get_all_products(
    State(pool): State<PgPool>,
    Query(params): Query<ProductQuery>,
) -> impl IntoResponse {
    // Pagination defaults
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    // Use QueryBuilder for parameterized queries
    let mut builder: sqlx::QueryBuilder<'_, sqlx::Postgres> = sqlx::QueryBuilder::new(
        "SELECT 
            p.*,
            w.id as warehouse_id, w.product_id as warehouse_product_id, w.quantity as warehouse_quantity, w.updated_at as warehouse_updated_at,
            c.id as category_id_join, c.name as category_name, c.parent_id as category_parent_id, c.created_at as category_created_at, c.updated_at as category_updated_at
        FROM products p
        LEFT JOIN warehouse w ON p.id = w.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1"
    );

    // Search filter
    if let Some(search) = &params.search {
        if !search.is_empty() {
            builder.push(" AND (p.name ILIKE ");
            builder.push_bind(format!("%{}%", search));
            builder.push(" OR p.code ILIKE ");
            builder.push_bind(format!("%{}%", search));
            builder.push(" OR p.barcode ILIKE ");
            builder.push_bind(format!("%{}%", search));
            builder.push(")");
        }
    }

    // Category filter
    if let Some(category_id) = params.category_id {
        builder.push(" AND p.category_id = ");
        builder.push_bind(category_id);
    }

    // IDs filter
    if let Some(ids) = &params.ids {
        let ids_vec: Vec<i32> = ids.split(',')
            .filter_map(|s| s.parse().ok())
            .collect();
        if !ids_vec.is_empty() {
            builder.push(" AND p.id IN (");
            let mut first = true;
            for id in ids_vec {
                if !first { builder.push(", "); }
                builder.push_bind(id);
                first = false;
            }
            builder.push(")");
        }
    }

    // Sıralama və pagination
    builder.push(" ORDER BY p.created_at DESC LIMIT ");
    builder.push_bind(limit);
    builder.push(" OFFSET ");
    builder.push_bind(offset);

    let query = builder.build_query_as::<ProductRow>();
    let rows_result = query.fetch_all(&pool).await;

    match rows_result {
        Ok(rows) => {
            tracing::info!("✅ Found {} rows", rows.len());
            
            // Group by product ID and aggregate warehouse data
            let mut products_map: std::collections::HashMap<i32, ProductWithRelations> = std::collections::HashMap::new();
            
            for row in rows {
                let product_id = row.id;
                
                if !products_map.contains_key(&product_id) {
                    let product = Product {
                        id: row.id,
                        name: row.name.clone(),
                        barcode: row.barcode.clone(),
                        description: row.description.clone(),
                        unit: row.unit.clone(),
                        purchase_price: row.purchase_price,
                        sale_price: row.sale_price,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        code: row.code.clone(),
                        article: row.article.clone(),
                        category_id: row.category_id,
                        product_type: row.product_type.clone(),
                        brand: row.brand.clone(),
                        model: row.model.clone(),
                        color: row.color.clone(),
                        size: row.size.clone(),
                        weight: row.weight,
                        country: row.country.clone(),
                        manufacturer: row.manufacturer.clone(),
                        warranty_period: row.warranty_period,
                        min_stock: row.min_stock,
                        max_stock: row.max_stock,
                        tax_rate: row.tax_rate,
                        is_active: row.is_active,
                        production_date: row.production_date,
                        expiry_date: row.expiry_date,
                    };

                    let category = if let Some(cat_id) = row.category_id_join {
                        Some(Category {
                            id: cat_id,
                            name: row.category_name.clone().unwrap_or_default(),
                            parent_id: row.category_parent_id,
                            created_at: row.category_created_at,
                            updated_at: row.category_updated_at,
                        })
                    } else {
                        None
                    };

                    products_map.insert(product_id, ProductWithRelations {
                        product,
                        warehouse: Some(Vec::new()),
                        category,
                    });
                }

                // Add warehouse if exists
                if let Some(warehouse_id) = row.warehouse_id {
                    if let Some(product_with_relations) = products_map.get_mut(&product_id) {
                        if let Some(ref mut warehouses) = product_with_relations.warehouse {
                            warehouses.push(Warehouse {
                                id: warehouse_id,
                                product_id: row.warehouse_product_id,
                                quantity: row.warehouse_quantity,
                                updated_at: row.warehouse_updated_at,
                            });
                        }
                    }
                }
            }

            let products_with_relations: Vec<ProductWithRelations> = products_map.into_values().collect();
            tracing::info!("✅ Returning {} products", products_with_relations.len());

            (StatusCode::OK, Json(products_with_relations))
        }
        Err(e) => {
            tracing::error!("❌ Database error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

use crate::models::discount::ProductDiscount;

pub async fn get_product_discounts(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, ProductDiscount>(
        "SELECT * FROM product_discounts WHERE product_id = $1"
    )
    .bind(id)
    .fetch_all(&pool)
    .await;

    match result {
        Ok(discounts) => (StatusCode::OK, Json(discounts)),
        Err(e) => {
            tracing::error!("Failed to fetch discounts: {}", e);
            // Return empty list on error to prevent frontend 404/500
            (StatusCode::OK, Json(Vec::<ProductDiscount>::new()))
        }
    }
}
pub async fn get_product_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let query = "
        SELECT 
            p.*,
            w.id as warehouse_id, w.product_id as warehouse_product_id, w.quantity as warehouse_quantity, w.updated_at as warehouse_updated_at,
            c.id as category_id_join, c.name as category_name, c.parent_id as category_parent_id, c.created_at as category_created_at, c.updated_at as category_updated_at
        FROM products p
        LEFT JOIN warehouse w ON p.id = w.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
    ";

    let rows_result: Result<Vec<ProductRow>, sqlx::Error> = sqlx::query_as(&query)
        .bind(id)
        .fetch_all(&pool)
        .await;

    match rows_result {
        Ok(rows) => {
            if rows.is_empty() {
                return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "Product not found"}))).into_response();
            }

            // Aggregate (though for ID=1 likely only 1 product, but warehouse/cat joins might duplicate if multiple warehouses? No, left join on warehouse w/ product_id is 1:1 usually or 1:N. Assuming 1:N warehouse, we need to aggregate)
            // Actually usually 1 warehouse per product in this schema? We handled it as array in get_all.
            
            let first_row = &rows[0];
            let product = Product {
                 id: first_row.id,
                 name: first_row.name.clone(),
                 barcode: first_row.barcode.clone(),
                 description: first_row.description.clone(),
                 unit: first_row.unit.clone(),
                 purchase_price: first_row.purchase_price,
                 sale_price: first_row.sale_price,
                 created_at: first_row.created_at,
                 updated_at: first_row.updated_at,
                 code: first_row.code.clone(),
                 article: first_row.article.clone(),
                 category_id: first_row.category_id,
                 product_type: first_row.product_type.clone(),
                 brand: first_row.brand.clone(),
                 model: first_row.model.clone(),
                 color: first_row.color.clone(),
                 size: first_row.size.clone(),
                 weight: first_row.weight,
                 country: first_row.country.clone(),
                 manufacturer: first_row.manufacturer.clone(),
                 warranty_period: first_row.warranty_period,
                 min_stock: first_row.min_stock,
                 max_stock: first_row.max_stock,
                 tax_rate: first_row.tax_rate,
                 is_active: first_row.is_active,
                 production_date: first_row.production_date,
                 expiry_date: first_row.expiry_date,
            };

            let category = if first_row.category_id_join.is_some() {
                Some(Category {
                    id: first_row.category_id_join.unwrap(),
                    name: first_row.category_name.clone().unwrap_or_default(),
                    parent_id: first_row.category_parent_id,
                    created_at: first_row.category_created_at,
                    updated_at: first_row.category_updated_at,
                })
            } else {
                None
            };
            
            let mut warehouses = Vec::new();
            for row in &rows {
                if let Some(wid) = row.warehouse_id {
                    warehouses.push(Warehouse {
                        id: wid,
                        product_id: row.warehouse_product_id,
                        quantity: row.warehouse_quantity,
                        updated_at: row.warehouse_updated_at,
                    });
                }
            }

            let result = ProductWithRelations {
                product,
                warehouse: Some(warehouses),
                category,
            };

            (StatusCode::OK, Json(result)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to fetch product: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
        }
    }
}
