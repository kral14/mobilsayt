use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ActivityLog {
    pub id: Option<i32>, // Optional because it's auto-increment on insert
    #[serde(default)] // Allow missing if not needed
    pub log_id: Option<String>, // Frontend sends this
    pub user_id: Option<i32>,
    pub timestamp: Option<DateTime<Utc>>, // Frontend sends 'timestamp'
    pub level: Option<String>,
    pub category: Option<String>,
    pub action: String,
    pub details: Option<String>,
    pub metadata: Option<serde_json::Value>,
    #[serde(default)]
    pub created_at: Option<DateTime<Utc>>,
}
