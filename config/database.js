const { Pool } = require('pg');

// Neon PostgreSQL connection pool
// Production-da DATABASE_URL environment variable-dan gəlir
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Password reset tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products (Məhsullar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(100),
        code VARCHAR(20),
        description TEXT,
        unit VARCHAR(50) DEFAULT 'ədəd',
        purchase_price DECIMAL(10, 2) DEFAULT 0,
        sale_price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add code column if it doesn't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='products' AND column_name='code') THEN
          ALTER TABLE products ADD COLUMN code VARCHAR(20);
        END IF;
      END $$;
    `);

    // Customers (Müştərilər)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Suppliers (Satıcılar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Warehouse (Anbar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warehouse (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity DECIMAL(10, 2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Purchase Invoices (Alış Qaimələri)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id),
        total_amount DECIMAL(10, 2) DEFAULT 0,
        invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Purchase Invoice Items (Alış Qaiməsi Məhsulları)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES purchase_invoices(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10, 2) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL
      );
    `);

    // Sale Invoices (Satış Qaimələri)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        total_amount DECIMAL(10, 2) DEFAULT 0,
        invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sale Invoice Items (Satış Qaiməsi Məhsulları)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES sale_invoices(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10, 2) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Call initialization
initializeDatabase();

module.exports = pool;

