use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{NaiveDateTime, DateTime, Utc};
use rust_decimal::Decimal;
use crate::models::customer::Customer;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SaleInvoice {
    pub id: i32,
    pub invoice_number: String,
    pub customer_id: Option<i32>,
    pub total_amount: Option<Decimal>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub invoice_date: Option<NaiveDateTime>,
    pub notes: Option<String>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub created_at: Option<NaiveDateTime>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub payment_date: Option<NaiveDateTime>,
    pub is_active: Option<bool>,
    // Joined fields
    #[serde(skip_serializing_if = "Option::is_none")]
    #[sqlx(skip)]
    pub customers: Option<CustomerPartial>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CustomerPartial {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleInvoiceWithItems {
    #[serde(flatten)]
    pub invoice: SaleInvoice,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "sale_invoice_items")]
    pub items: Option<Vec<SaleInvoiceItem>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SaleInvoiceItem {
    pub id: i32,
    pub invoice_id: Option<i32>,
    pub product_id: Option<i32>,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub total_price: Decimal,
    pub discount_auto: Option<Decimal>,
    pub discount_manual: Option<Decimal>,
    // Transient fields from JOIN
    #[serde(default)]
    pub product_name: Option<String>,
    #[serde(default)]
    pub product_code: Option<String>,
    #[serde(default)]
    pub product_barcode: Option<String>,
    #[serde(default)]
    pub product_unit: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PurchaseInvoice {
    pub id: i32,
    pub invoice_number: String,
    pub customer_id: Option<i32>,
    pub total_amount: Option<Decimal>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub invoice_date: Option<NaiveDateTime>,
    pub notes: Option<String>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub created_at: Option<NaiveDateTime>,
    #[serde(serialize_with = "serialize_naive_as_utc")]
    pub payment_date: Option<NaiveDateTime>,
    pub is_active: Option<bool>,
}

// Helper function to serialize NaiveDateTime as UTC ISO string ('Z' suffix)
fn serialize_naive_as_utc<S>(
    date: &Option<NaiveDateTime>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match date {
        Some(d) => {
            // Treat the naive date as if it is in UTC
            let utc_date = DateTime::<Utc>::from_naive_utc_and_offset(*d, Utc);
            // Serialize using standard RFC3339 format (which includes Z)
            utc_date.serialize(serializer)
        }
        None => serializer.serialize_none(),
    }
}
