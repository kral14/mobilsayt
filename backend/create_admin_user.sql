-- Admin User Yaratmaq üçün SQL Script
-- Password: admin123 (bcrypt hash)

-- 1. Admin user yarat
INSERT INTO users (email, password, full_name, role, is_admin, is_active, created_at, updated_at)
VALUES (
  'admin@mobilsayt.com',
  '$2a$10$YourBcryptHashHere',  -- Bu hash-i dəyişdirin
  'Admin User',
  'ADMIN',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  role = 'ADMIN',
  is_admin = TRUE,
  full_name = 'Admin User';

-- 2. Mövcud user-i admin et (email-i dəyişdirin)
UPDATE users 
SET 
  role = 'ADMIN',
  is_admin = TRUE,
  is_active = TRUE
WHERE email = 'your@email.com';

-- 3. Bütün admin user-ləri göstər
SELECT id, email, full_name, role, is_admin, is_active, created_at
FROM users
WHERE is_admin = TRUE;
