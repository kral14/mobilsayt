use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::{PgPool, Row};

pub async fn list_tables(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let rows = sqlx::query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        .fetch_all(&pool)
        .await;

    match rows {
        Ok(rows) => {
            let tables: Vec<String> = rows.iter().map(|row| row.get("table_name")).collect();
            (StatusCode::OK, Json(tables))
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![format!("Error: {}", e)])),
    }
}
