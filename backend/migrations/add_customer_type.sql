-- Add type field to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'BUYER';

-- Add customer_id to purchase_invoices table
ALTER TABLE purchase_invoices 
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- Update existing customers to have type BUYER (default)
UPDATE customers SET type = 'BUYER' WHERE type IS NULL;

-- Migrate existing suppliers to customers table as SUPPLIER type
INSERT INTO customers (name, phone, email, address, balance, created_at, updated_at, type, is_active)
SELECT name, phone, email, address, balance, created_at, updated_at, 'SUPPLIER', TRUE
FROM suppliers
WHERE id NOT IN (SELECT id FROM customers)
ON CONFLICT DO NOTHING;

-- Update purchase_invoices to use customer_id instead of supplier_id
-- Match suppliers with newly created customers by name
UPDATE purchase_invoices pi
SET customer_id = c.id
FROM customers c
INNER JOIN suppliers s ON s.name = c.name AND c.type = 'SUPPLIER'
WHERE pi.supplier_id = s.id AND pi.customer_id IS NULL;

-- Comment: supplier_id will be deprecated but kept for backward compatibility
