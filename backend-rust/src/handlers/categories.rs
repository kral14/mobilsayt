use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;

use crate::models::Category;

pub async fn get_all_categories(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories ORDER BY name ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(categories) => (StatusCode::OK, Json(categories)),
        Err(e) => {
            tracing::error!("❌ Get categories error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}
