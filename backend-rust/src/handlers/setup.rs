use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use sqlx::prelude::*;

pub async fn init_discounts(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let q1 = r#"
    CREATE TABLE IF NOT EXISTS product_discounts (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      percentage DECIMAL(5, 2) NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    "#;
    let _ = sqlx::query(q1).execute(&pool).await;

    let q2 = r#"
    CREATE TABLE IF NOT EXISTS discount_documents (
      id SERIAL PRIMARY KEY,
      document_number VARCHAR(100) UNIQUE NOT NULL,
      document_date TIMESTAMP NOT NULL,
      start_date TIMESTAMP DEFAULT NOW(),
      end_date TIMESTAMP DEFAULT NOW(),
      type VARCHAR(20) NOT NULL,
      entity_id INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    "#;
    let _ = sqlx::query(q2).execute(&pool).await;

    let q3 = r#"
    CREATE TABLE IF NOT EXISTS discount_document_items (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES discount_documents(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      discount_percent DECIMAL(5, 2) NOT NULL,
      description TEXT
    );
    "#;
    let _ = sqlx::query(q3).execute(&pool).await;

    // Axtarış optimizasiyası
    let q_search = r#"
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_products_code_trgm ON products USING gin (code gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_products_barcode_trgm ON products USING gin (barcode gin_trgm_ops);
    "#;
    let _ = sqlx::query(q_search).execute(&pool).await;

    (StatusCode::OK, Json("Database optimized and tables initialized successfully"))
}
