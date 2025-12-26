use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::NaiveDateTime;
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub barcode: Option<String>,
    pub description: Option<String>,
    pub unit: Option<String>,
    pub purchase_price: Option<Decimal>,
    pub sale_price: Option<Decimal>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub code: Option<String>,
    pub article: Option<String>,
    pub category_id: Option<i32>,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub product_type: Option<String>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub color: Option<String>,
    pub size: Option<String>,
    pub weight: Option<Decimal>,
    pub country: Option<String>,
    pub manufacturer: Option<String>,
    pub warranty_period: Option<i32>,
    pub min_stock: Option<Decimal>,
    pub max_stock: Option<Decimal>,
    pub tax_rate: Option<Decimal>,
    pub is_active: Option<bool>,
    pub production_date: Option<NaiveDateTime>,
    pub expiry_date: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Warehouse {
    pub id: i32,
    pub product_id: Option<i32>,
    pub quantity: Option<Decimal>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: i32,
    pub name: String,
    pub parent_id: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

// Frontend üçün cavab strukturu
#[derive(Debug, Serialize)]
pub struct ProductWithRelations {
    #[serde(flatten)]
    pub product: Product,
    pub warehouse: Option<Vec<Warehouse>>,
    pub category: Option<Category>,
}
