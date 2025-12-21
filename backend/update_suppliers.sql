-- Update Mərhəmət and Murtuz to SUPPLIER type with SL codes
-- Run this SQL script in your PostgreSQL database

-- Update merhemet to SUPPLIER
UPDATE customers 
SET 
  type = 'SUPPLIER',
  code = 'SL00000001',
  updated_at = NOW()
WHERE name = 'merhemet';

-- Update murtuz to SUPPLIER  
UPDATE customers
SET
  type = 'SUPPLIER', 
  code = 'SL00000002',
  updated_at = NOW()
WHERE name = 'murtuz';

-- Verify the changes
SELECT id, code, name, type FROM customers WHERE name IN ('merhemet', 'murtuz');
