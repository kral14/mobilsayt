use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize}; // Consolidated imports
use sqlx::PgPool;
use tracing;
use crate::models::{
    SaleInvoice, SaleInvoiceWithItems, SaleInvoiceItem, PurchaseInvoice
};

#[derive(Debug, Deserialize)]
pub struct OrderQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub order: Option<String>,
}

#[derive(Serialize)]
pub struct PaginationMeta {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
}

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

pub async fn get_all_orders(
    State(pool): State<PgPool>,
    Query(params): Query<OrderQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    // Base WHERE clause
    let mut where_clause = String::from("1=1");

    if let Some(search) = &params.search {
        if !search.is_empty() {
            where_clause.push_str(&format!(
                " AND invoice_number ILIKE '%{}%'",
                search
            ));
        }
    }

    // Sorting Logic
    let sort_column = match params.sort_by.as_deref() {
        Some("invoice_number") => "i.invoice_number",
        Some("invoice_date") => "i.invoice_date",
        Some("total_amount") => "i.total_amount",
        Some("customers") => "c.name", // Handle customer name sort if mapped from frontend 'customers'
        Some("customer_name") => "c.name",
        Some("created_at") => "i.created_at",
        _ => "i.created_at", // Default
    };

    let sort_order = match params.order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC", // Default
    };

    let order_clause = format!("{} {}", sort_column, sort_order);

    // Get Total Count
    let count_query = format!("SELECT COUNT(*) FROM sale_invoices WHERE {}", where_clause);
    let total_result: Result<i64, _> = sqlx::query_scalar(&count_query)
        .fetch_one(&pool)
        .await;

    let total = total_result.unwrap_or(0);

    // Get Data with Customer Info
    let query = format!(
        r#"
        SELECT 
            i.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.address as customer_address
        FROM sale_invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE {} 
        ORDER BY {} 
        LIMIT {} OFFSET {}
        "#,
        where_clause, order_clause, limit, offset
    );

    // We need a temporary struct to hold the flat result
    #[derive(sqlx::FromRow)]
    struct InvoiceWithCustomer {
        #[sqlx(flatten)]
        invoice: SaleInvoice,
        customer_name: Option<String>,
        customer_phone: Option<String>,
        customer_address: Option<String>,
    }

    let result = sqlx::query_as::<_, InvoiceWithCustomer>(&query)
        .fetch_all(&pool)
        .await;

    match result {
        Ok(rows) => {
            let invoices_with_items: Vec<SaleInvoiceWithItems> = rows.into_iter().map(|row| {
                let mut invoice = row.invoice;
                // Manually populate the nested customers struct
                if let Some(name) = row.customer_name {
                    invoice.customers = Some(crate::models::invoice::CustomerPartial {
                        name: Some(name),
                        phone: row.customer_phone,
                        address: row.customer_address,
                    });
                }

                SaleInvoiceWithItems {
                    invoice,
                    items: None,
                }
            }).collect();
            
            let response = PaginatedResponse {
                data: invoices_with_items,
                pagination: PaginationMeta {
                    page,
                    limit,
                    total,
                },
            };
            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            tracing::error!("❌ Get orders error: {}", e);
             let response = PaginatedResponse {
                data: vec![],
                pagination: PaginationMeta {
                    page,
                    limit,
                    total: 0,
                },
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(response))
        }
    }
}

pub async fn get_order_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    // We need a temporary struct to hold the flat result for the single invoice too
    #[derive(sqlx::FromRow)]
    struct InvoiceWithCustomer {
        #[sqlx(flatten)]
        invoice: SaleInvoice,
        customer_name: Option<String>,
        customer_phone: Option<String>,
        customer_address: Option<String>,
    }

    let result = sqlx::query_as::<_, InvoiceWithCustomer>(
        r#"
        SELECT 
            i.*, 
            c.name as customer_name,
            c.phone as customer_phone,
            c.address as customer_address
        FROM sale_invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = $1
        "#
    )
    .bind(id)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(row) => {
            let mut invoice = row.invoice;
            if let Some(name) = row.customer_name {
                invoice.customers = Some(crate::models::invoice::CustomerPartial {
                    name: Some(name),
                    phone: row.customer_phone,
                    address: row.customer_address,
                });
            }

            // Fetch invoice items with product details
            let items_result = sqlx::query_as::<_, SaleInvoiceItem>(
                "SELECT 
                    i.*, 
                    p.name as product_name, 
                    p.code as product_code, 
                    p.barcode as product_barcode, 
                    p.unit as product_unit
                 FROM sale_invoice_items i 
                 LEFT JOIN products p ON i.product_id = p.id
                 WHERE i.invoice_id = $1 
                 ORDER BY i.id"
            )
            .bind(id)
            .fetch_all(&pool)
            .await;

            let items = match items_result {
                Ok(items) => Some(items),
                Err(e) => {
                    tracing::error!("❌ Failed to fetch invoice items: {}", e);
                    Some(vec![]) // Return empty list on error to avoid null in JSON
                }
            };

            (StatusCode::OK, Json(SaleInvoiceWithItems {
                invoice,
                items,
            }))
        }
        Err(_) => {
            (StatusCode::NOT_FOUND, Json(SaleInvoiceWithItems {
                invoice: SaleInvoice {
                    id: 0,
                    invoice_number: String::new(),
                    customer_id: None,
                    total_amount: None,
                    invoice_date: None,
                    notes: None,
                    created_at: None,
                    payment_date: None,
                    is_active: None,
                     customers: None,
                },
                items: None,
            }))
        }
    }
}

pub async fn get_all_purchase_invoices(
    State(pool): State<PgPool>,
    Query(params): Query<OrderQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);
    let offset = (page - 1) * limit;

    let mut query = String::from(
        "SELECT * FROM purchase_invoices WHERE 1=1"
    );

    if let Some(search) = &params.search {
        if !search.is_empty() {
            query.push_str(&format!(
                " AND invoice_number ILIKE '%{}%'",
                search
            ));
        }
    }

    query.push_str(&format!(
        " ORDER BY created_at DESC LIMIT {} OFFSET {}",
        limit, offset
    ));

    let result = sqlx::query_as::<_, PurchaseInvoice>(&query)
        .fetch_all(&pool)
        .await;

    match result {
        Ok(invoices) => (StatusCode::OK, Json(invoices)),
        Err(e) => {
            tracing::error!("❌ Get purchase invoices error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

// Request Structs
#[derive(Debug, Deserialize)]
pub struct CreateOrderItem {
    pub product_id: i32,
    pub quantity: rust_decimal::Decimal,
    pub unit_price: rust_decimal::Decimal,
    pub total_price: rust_decimal::Decimal,
    pub discount_auto: Option<rust_decimal::Decimal>,
    pub discount_manual: Option<rust_decimal::Decimal>,
    pub vat_rate: Option<rust_decimal::Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub customer_id: Option<i32>,
    pub invoice_date: Option<chrono::DateTime<chrono::Utc>>,
    pub payment_date: Option<chrono::DateTime<chrono::Utc>>,
    pub notes: Option<String>,
    pub items: Vec<CreateOrderItem>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderRequest {
    pub customer_id: Option<i32>,
    pub invoice_date: Option<chrono::DateTime<chrono::Utc>>,
    pub payment_date: Option<chrono::DateTime<chrono::Utc>>,
    pub notes: Option<String>,
    pub items: Option<Vec<CreateOrderItem>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusRequest {
    pub is_active: bool,
}

pub async fn create_order(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateOrderRequest>,
) -> impl IntoResponse {
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("❌ Failed to begin transaction: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": "Database error"})));
        }
    };

    // Generate Sequential Invoice Number
    let last_invoice_number: Option<String> = sqlx::query_scalar(
        "SELECT invoice_number FROM sale_invoices ORDER BY id DESC LIMIT 1"
    )
    .fetch_optional(&mut *tx)
    .await
    .unwrap_or(None);

    let next_number = match last_invoice_number {
        Some(last_code) => {
            // Expected format: SQ00000711
            let numeric_part = last_code.trim_start_matches("SQ");
            if let Ok(num) = numeric_part.parse::<i64>() {
                num + 1
            } else {
                // Fallback if parsing fails (maybe old format)
                1
            }
        },
        None => 1,
    };
    
    let invoice_number = format!("SQ{:08}", next_number);
    let total_amount: rust_decimal::Decimal = payload.items.iter().map(|i| i.total_price).sum();

    // Use sqlx::query_scalar (function) instead of macro to avoid compile-time prepared statement issues
    let invoice_id: Result<i32, _> = sqlx::query_scalar(
        r#"
        INSERT INTO sale_invoices (invoice_number, customer_id, total_amount, invoice_date, payment_date, notes, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#
    )
    .bind(invoice_number)
    .bind(payload.customer_id)
    .bind(total_amount)
    .bind(payload.invoice_date.map(|d| d.naive_utc()))
    .bind(payload.payment_date.map(|d| d.naive_utc()))
    .bind(payload.notes)
    .bind(false) // Default to inactive/draft
    .fetch_one(&mut *tx)
    .await;

    let invoice_id = match invoice_id {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("❌ Failed to create invoice: {}", e);
            let _ = tx.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": "Failed to create invoice"})));
        }
    };

    for item in payload.items {
        // Use sqlx::query (function) for items as well
        let _ = sqlx::query(
            r#"
            INSERT INTO sale_invoice_items (invoice_id, product_id, quantity, unit_price, total_price, discount_auto, discount_manual)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#
        )
        .bind(invoice_id)
        .bind(item.product_id)
        .bind(item.quantity)
        .bind(item.unit_price)
        .bind(item.total_price)
        .bind(item.discount_auto)
        .bind(item.discount_manual)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("❌ Failed to create invoice item: {}", e);
        });
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("❌ Failed to commit transaction: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": "Failed to commit transaction"})));
    }

    // Fetch created invoice to return
    let result = sqlx::query_as::<_, SaleInvoice>("SELECT * FROM sale_invoices WHERE id = $1")
        .bind(invoice_id)
        .fetch_one(&pool)
        .await;

    match result {
        Ok(invoice) => (StatusCode::CREATED, Json(serde_json::json!(invoice))),
        Err(_) => (StatusCode::OK, Json(serde_json::json!({"id": invoice_id, "message": "Created but failed to fetch"}))),
    }
}

pub async fn update_order(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOrderRequest>,
) -> impl IntoResponse {
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": e.to_string()}))),
    };

    // Update Invoice Fields
    let _ = sqlx::query(
        r#"
        UPDATE sale_invoices 
        SET customer_id = COALESCE($1, customer_id),
            invoice_date = COALESCE($2, invoice_date),
            payment_date = COALESCE($3, payment_date),
            notes = COALESCE($4, notes)
        WHERE id = $5
        "#
    )
    .bind(payload.customer_id)
    .bind(payload.invoice_date.map(|d| d.naive_utc()))
    .bind(payload.payment_date.map(|d| d.naive_utc()))
    .bind(payload.notes)
    .bind(id)
    .execute(&mut *tx)
    .await;

    // If items provided, replace them
    if let Some(items) = payload.items {
        // Delete old items
        let _ = sqlx::query("DELETE FROM sale_invoice_items WHERE invoice_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await;
        
        // Calculate new total
        let total_amount: rust_decimal::Decimal = items.iter().map(|i| i.total_price).sum();
        
        // Update total amount
        let _ = sqlx::query("UPDATE sale_invoices SET total_amount = $1 WHERE id = $2")
            .bind(total_amount)
            .bind(id)
            .execute(&mut *tx)
            .await;

        for item in items {
             let _ = sqlx::query(
                r#"
                INSERT INTO sale_invoice_items (invoice_id, product_id, quantity, unit_price, total_price, discount_auto, discount_manual)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                "#
            )
            .bind(id)
            .bind(item.product_id)
            .bind(item.quantity)
            .bind(item.unit_price)
            .bind(item.total_price)
            .bind(item.discount_auto)
            .bind(item.discount_manual)
            .execute(&mut *tx)
            .await;
        }
    }

    if let Err(e) = tx.commit().await {
         return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": e.to_string()})));
    }

     let result = sqlx::query_as::<_, SaleInvoice>("SELECT * FROM sale_invoices WHERE id = $1")
        .bind(id)
        .fetch_one(&pool)
        .await;

    match result {
         Ok(invoice) => (StatusCode::OK, Json(serde_json::json!(invoice))),
         Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": "Failed to fetch updated invoice"})))
    }
}

pub async fn delete_order(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    // Rely on CASCADE delete for items if configured, otherwise we should delete items first manually
    // Safety: Delete items first manually to be sure
    let _ = sqlx::query("DELETE FROM sale_invoice_items WHERE invoice_id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    let result = sqlx::query("DELETE FROM sale_invoices WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"message": "Deleted successfully"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": e.to_string()})))
    }
}

pub async fn update_order_status(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateStatusRequest>,
) -> impl IntoResponse {
     let result = sqlx::query(
        "UPDATE sale_invoices SET is_active = $1 WHERE id = $2"
    )
    .bind(payload.is_active)
    .bind(id)
    .execute(&pool)
    .await;
    
    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"message": "Status updated"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": e.to_string()})))
    }
}
