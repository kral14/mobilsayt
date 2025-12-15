"""
Admin User System Migration Script
Bu script users table-ə yeni field-lər əlavə edir və activity_logs table yaradır
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# .env faylını yüklə
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ .env faylında DATABASE_URL tapılmadı!")
    print("\n📝 .env faylı yaradın və DATABASE_URL əlavə edin:")
    print('DATABASE_URL="postgresql://user:password@host:5432/database"')
    sys.exit(1)

print("=" * 70)
print("🔧 Admin User System Migration")
print("=" * 70)

try:
    # Database-ə qoşul
    print("\n🔌 Database-ə qoşulur...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("✅ Database qoşulması uğurlu")

    # Users table-ə yeni field-lər əlavə et
    print("\n📝 Users table-ə yeni field-lər əlavə edilir...")
    
    migrations = [
        # full_name field
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='full_name'
            ) THEN
                ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
            END IF;
        END $$;
        """,
        
        # role field
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='role'
            ) THEN
                ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';
            END IF;
        END $$;
        """,
        
        # is_admin field
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_admin'
            ) THEN
                ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
        """,
        
        # is_active field
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_active'
            ) THEN
                ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            END IF;
        END $$;
        """,
    ]
    
    for migration in migrations:
        cursor.execute(migration)
    
    conn.commit()
    print("✅ Users table yeniləndi")

    # activity_logs table yarat
    print("\n📝 activity_logs table yaradılır...")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            level VARCHAR(50) NOT NULL,
            details TEXT,
            metadata JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Index-lər yarat
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
    """)
    
    conn.commit()
    print("✅ activity_logs table yaradıldı")

    # Mövcud user-ləri yenilə (əgər varsa)
    print("\n📝 Mövcud user-lər yenilənir...")
    cursor.execute("""
        UPDATE users 
        SET role = 'USER', is_admin = FALSE, is_active = TRUE 
        WHERE role IS NULL OR role = '';
    """)
    conn.commit()
    print("✅ Mövcud user-lər yeniləndi")

    # İlk admin user yarat (əgər yoxdursa)
    print("\n📝 Admin user yoxlanır...")
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin = TRUE;")
    admin_count = cursor.fetchone()[0]
    
    if admin_count == 0:
        print("⚠️  Admin user tapılmadı!")
        print("\n💡 İlk admin user yaratmaq üçün:")
        print("   1. Web interfeys-dən qeydiyyatdan keçin")
        print("   2. Database-də həmin user-in is_admin field-ini TRUE edin:")
        print("      UPDATE users SET is_admin = TRUE, role = 'ADMIN' WHERE email = 'your@email.com';")
    else:
        print(f"✅ {admin_count} admin user tapıldı")

    cursor.close()
    conn.close()

    print("\n" + "=" * 70)
    print("✅ Migration tamamlandı!")
    print("=" * 70)
    print("\n📌 Növbəti addımlar:")
    print("   1. Backend-i yenidən başladın: npm run dev")
    print("   2. Prisma client yenilə: npx prisma generate")
    print("   3. Admin panel-ə daxil ol: http://localhost:3000/admin")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ Xəta baş verdi: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
