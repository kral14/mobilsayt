use axum::{
    extract::{State, Path},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;

use crate::models::Warehouse;

pub async fn get_all_warehouses(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Warehouse>(
        "SELECT * FROM warehouse ORDER BY id ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(warehouses) => (StatusCode::OK, Json(warehouses)),
        Err(e) => {
            tracing::error!("❌ Get warehouses error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

pub async fn update_warehouse(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<Warehouse>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Warehouse>(
        "UPDATE warehouse SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(&payload.quantity)
    .bind(id)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(warehouse) => (StatusCode::OK, Json(warehouse)),
        Err(e) => {
            tracing::error!("❌ Update warehouse error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(Warehouse {
                id: 0,
                product_id: None,
                quantity: None,
                updated_at: None,
            }))
        }
    }
}
