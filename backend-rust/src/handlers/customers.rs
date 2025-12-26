use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::models::{Customer, CustomerWithFolder, CustomerFolder};

#[derive(Debug, Deserialize)]
pub struct CustomerQuery {
    #[serde(rename = "type")]
    pub customer_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub message: String,
}

pub async fn get_all_customers(
    State(pool): State<PgPool>,
    Query(params): Query<CustomerQuery>,
) -> impl IntoResponse {
    let mut query = String::from(
        "SELECT c.*, 
         f.id as folder_id_join, f.name as folder_name, f.parent_id as folder_parent_id
         FROM customers c
         LEFT JOIN customer_folders f ON c.folder_id = f.id
         WHERE 1=1"
    );

    if let Some(customer_type) = &params.customer_type {
        query.push_str(&format!(" AND c.type = '{}'", customer_type));
    }

    query.push_str(" ORDER BY c.name ASC");

    #[derive(sqlx::FromRow)]
    struct CustomerRow {
        id: i32,
        name: String,
        phone: Option<String>,
        email: Option<String>,
        address: Option<String>,
        created_at: Option<chrono::NaiveDateTime>,
        updated_at: Option<chrono::NaiveDateTime>,
        balance: Option<rust_decimal::Decimal>,
        folder_id: Option<i32>,
        code: Option<String>,
        is_active: Option<bool>,
        #[sqlx(rename = "type")]
        customer_type: Option<String>,
        permanent_discount: Option<rust_decimal::Decimal>,
        folder_id_join: Option<i32>,
        folder_name: Option<String>,
        folder_parent_id: Option<i32>,
    }

    let rows_result: Result<Vec<CustomerRow>, sqlx::Error> = sqlx::query_as(&query)
        .fetch_all(&pool)
        .await;

    match rows_result {
        Ok(rows) => {
            let customers: Vec<CustomerWithFolder> = rows.into_iter().map(|row| {
                let customer = Customer {
                    id: row.id,
                    name: row.name,
                    phone: row.phone,
                    email: row.email,
                    address: row.address,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    balance: row.balance,
                    folder_id: row.folder_id,
                    code: row.code,
                    is_active: row.is_active,
                    customer_type: row.customer_type,
                    permanent_discount: row.permanent_discount,
                };

                let folder = if row.folder_id_join.is_some() {
                    Some(CustomerFolder {
                        id: row.folder_id_join.unwrap(),
                        name: row.folder_name.unwrap_or_default(),
                        parent_id: row.folder_parent_id,
                        created_at: None,
                        updated_at: None,
                    })
                } else {
                    None
                };

                CustomerWithFolder { customer, folder }
            }).collect();

            (StatusCode::OK, Json(customers))
        }
        Err(e) => {
            tracing::error!("❌ Database error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

pub async fn create_customer(
    State(pool): State<PgPool>,
    Json(payload): Json<Customer>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Customer>(
        "INSERT INTO customers (name, phone, email, address, balance, folder_id, code, is_active, type, permanent_discount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.phone)
    .bind(&payload.email)
    .bind(&payload.address)
    .bind(&payload.balance)
    .bind(&payload.folder_id)
    .bind(&payload.code)
    .bind(payload.is_active.unwrap_or(true))
    .bind(payload.customer_type.as_deref().unwrap_or("BUYER"))
    .bind(&payload.permanent_discount)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(customer) => (StatusCode::CREATED, Json(customer)),
        Err(e) => {
            tracing::error!("❌ Create customer error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(Customer {
                id: 0,
                name: String::new(),
                phone: None,
                email: None,
                address: None,
                created_at: None,
                updated_at: None,
                balance: None,
                folder_id: None,
                code: None,
                is_active: None,
                customer_type: None,
                permanent_discount: None,
            }))
        }
    }
}

pub async fn delete_customer(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let result = sqlx::query("DELETE FROM customers WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Müştəri silindi" }))),
        Err(e) => {
            tracing::error!("❌ Delete customer error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "message": "Xəta baş verdi" })))
        }
    }
}
