use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProductDiscount {
    pub id: i32,
    pub product_id: i32,
    pub percentage: Decimal,
    pub start_date: NaiveDateTime,
    pub end_date: NaiveDateTime,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DiscountDocument {
    pub id: i32,
    pub document_number: String,
    pub document_date: NaiveDateTime,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
    pub r#type: String, // type is a reserved keyword
    pub entity_id: Option<i32>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DiscountDocumentItem {
    pub id: i32,
    pub document_id: i32,
    pub product_id: Option<i32>,
    pub discount_percent: Decimal,
    pub description: Option<String>,
}
