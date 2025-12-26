use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use chrono::Utc;

use crate::models::ActivityLog;

pub async fn create_logs(
    State(pool): State<PgPool>,
    Json(payload): Json<serde_json::Value>, // Receive raw JSON first to handle structure flexibility
) -> impl IntoResponse {
    // Extract logs array from payload object { logs: [...] }
    let logs: Vec<ActivityLog> = match serde_json::from_value(payload.get("logs").unwrap_or(&serde_json::json!([])).clone()) {
        Ok(l) => l,
        Err(e) => {
            tracing::error!("Failed to deserialize logs: {}", e);
            return (StatusCode::UNPROCESSABLE_ENTITY, Json(serde_json::json!({ "error": e.to_string() }))).into_response();
        }
    };

    let mut inserted_count = 0;

    for log in logs {
        // Generate a log_id if missing (or handle as needed)
        let log_id = log.log_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        
        let result = sqlx::query(
            "INSERT INTO activity_logs (log_id, user_id, timestamp, level, category, action, details, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())"
        )
        .bind(log_id)
        .bind(log.user_id)
        .bind(log.timestamp.unwrap_or_else(Utc::now))
        .bind(log.level.unwrap_or_else(|| "INFO".to_string()))
        .bind(log.category.unwrap_or_else(|| "GENERAL".to_string()))
        .bind(&log.action)
        .bind(&log.details)
        .bind(&log.metadata)
        .execute(&pool)
        .await;

        if let Err(e) = result {
            tracing::error!("Failed to insert log: {}", e);
        } else {
            inserted_count += 1;
        }
    }

    (StatusCode::CREATED, Json(serde_json::json!({
        "message": format!("{} logs created", inserted_count),
        "count": inserted_count
    }))).into_response()
}
