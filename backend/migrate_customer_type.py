import psycopg2
import os

# Database connection from start.py
DATABASE_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("Connecting to database...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    print("Adding type field to customers table...")
    cur.execute("""
        ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'BUYER';
    """)
    
    print("Adding customer_id to purchase_invoices table...")
    cur.execute("""
        ALTER TABLE purchase_invoices 
        ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
    """)
    
    print("Updating existing customers to have type BUYER...")
    cur.execute("""
        UPDATE customers SET type = 'BUYER' WHERE type IS NULL;
    """)
    
    print("Migrating suppliers to customers table as SUPPLIER type...")
    cur.execute("""
        INSERT INTO customers (name, phone, email, address, balance, created_at, updated_at, type, is_active)
        SELECT name, phone, email, address, balance, created_at, updated_at, 'SUPPLIER', TRUE
        FROM suppliers
        WHERE NOT EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.name = suppliers.name AND c.type = 'SUPPLIER'
        );
    """)
    
    print("Updating purchase_invoices to use customer_id...")
    cur.execute("""
        UPDATE purchase_invoices pi
        SET customer_id = c.id
        FROM customers c
        INNER JOIN suppliers s ON s.name = c.name AND c.type = 'SUPPLIER'
        WHERE pi.supplier_id = s.id AND pi.customer_id IS NULL;
    """)
    
    conn.commit()
    print("✅ Migration completed successfully!")
    
    # Show statistics
    cur.execute("SELECT COUNT(*) FROM customers WHERE type = 'BUYER'")
    buyers = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM customers WHERE type = 'SUPPLIER'")
    suppliers = cur.fetchone()[0]
    
    print(f"\nStatistics:")
    print(f"  Buyers: {buyers}")
    print(f"  Suppliers: {suppliers}")
    
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
    raise
finally:
    cur.close()
    conn.close()
