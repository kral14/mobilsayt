use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: i32,
    pub user_id: i32,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: Option<NaiveDateTime>,
    pub read: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
}
