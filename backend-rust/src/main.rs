use axum::{
    routing::{get, post, put, delete},
    Router,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber;

mod models;
mod handlers;
mod db;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

#[tokio::main]
async fn main() {
    // Logging quraşdır
    tracing_subscriber::fmt::init();

    // Database connection pool yarat
    let db_pool = db::create_pool().await.expect("Database connection failed");

    // CORS konfiqurasiyası
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Router quraşdır
    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/products", get(handlers::products::get_all_products))
        .route("/api/customers", get(handlers::customers::get_all_customers))
        .route("/api/customers", post(handlers::customers::create_customer))
        .route("/api/customers/:id", delete(handlers::customers::delete_customer))
        .route("/api/warehouses", get(handlers::warehouses::get_all_warehouses))
        .route("/api/warehouses/:id", put(handlers::warehouses::update_warehouse))
        .route("/api/notifications", get(handlers::notifications::get_notifications))
        .route("/api/notifications", post(handlers::notifications::create_notification))
        .route("/api/notifications/:id", put(handlers::notifications::mark_as_read))
        .route("/api/orders", get(handlers::orders::get_all_orders).post(handlers::orders::create_order))
        .route("/api/orders/:id", get(handlers::orders::get_order_by_id).put(handlers::orders::update_order).delete(handlers::orders::delete_order))
        .route("/api/orders/:id/status", put(handlers::orders::update_order_status))
        .route("/api/purchase-invoices", get(handlers::orders::get_all_purchase_invoices))
        .route("/api/logs", post(handlers::logs::create_logs))
        .route("/api/categories", get(handlers::categories::get_all_categories))
        .route("/api/debug/tables", get(handlers::debug::list_tables))
        .route("/api/setup/init-discounts", get(handlers::setup::init_discounts))
        .route("/api/products/:id/discounts", get(handlers::products::get_product_discounts))
        .route("/api/documents/discounts", get(handlers::discounts::get_discounts))
        .route("/api/products/:id", get(handlers::products::get_product_by_id))
        .layer(cors)
        .with_state(db_pool);

    // Server başlat
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("{}:{}", host, port).parse().unwrap();

    tracing::info!("🚀 Rust Backend running on http://{}", addr);
    tracing::info!("📝 API endpoints:");
    tracing::info!("   - GET  /api/health");
    tracing::info!("   - GET  /api/products");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    let response = HealthResponse {
        status: "OK".to_string(),
        message: "Rust Backend API is running".to_string(),
    };
    (StatusCode::OK, Json(response))
}
