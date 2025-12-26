use axum::{
    extract::{State, Path},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;

use crate::models::Notification;

pub async fn get_notifications(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(notifications) => (StatusCode::OK, Json(notifications)),
        Err(e) => {
            tracing::error!("❌ Get notifications error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

#[derive(serde::Deserialize)]
pub struct CreateNotificationRequest {
    pub user_id: i32,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
}

pub async fn create_notification(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateNotificationRequest>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Notification>(
        "INSERT INTO notifications (user_id, type, title, message, timestamp, read)
         VALUES ($1, $2, $3, $4, NOW(), false)
         RETURNING *"
    )
    .bind(payload.user_id)
    .bind(&payload.notification_type)
    .bind(&payload.title)
    .bind(&payload.message)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(notification) => (StatusCode::CREATED, Json(notification)),
        Err(e) => {
            tracing::error!("❌ Create notification error: {}", e);
            // Return error status properly
            (StatusCode::INTERNAL_SERVER_ERROR, Json(Notification {
                id: 0,
                user_id: 0,
                notification_type: String::new(),
                title: String::new(),
                message: String::new(),
                timestamp: Some(chrono::Utc::now().naive_utc()),
                read: Some(false),
                created_at: None,
            }))
        }
    }
}

pub async fn mark_as_read(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let result = sqlx::query("UPDATE notifications SET read = true WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Marked as read" }))),
        Err(e) => {
            tracing::error!("❌ Mark notification error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "message": "Error" })))
        }
    }
}
