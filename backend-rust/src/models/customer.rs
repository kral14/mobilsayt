use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: i32,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub balance: Option<Decimal>,
    pub folder_id: Option<i32>,
    pub code: Option<String>,
    pub is_active: Option<bool>,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub customer_type: Option<String>,
    pub permanent_discount: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerWithFolder {
    #[serde(flatten)]
    pub customer: Customer,
    pub folder: Option<CustomerFolder>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CustomerFolder {
    pub id: i32,
    pub name: String,
    pub parent_id: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}
