#!/usr/bin/env python3
"""
Activity Logs Migration Script
Bu skripti işlətmək üçün sadəcə: python migrate_logs_simple.py
"""

import psycopg2

# start.py-dən eyni DATABASE_URL
DATABASE_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Migration SQL
SQL = """
-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  log_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER,
  timestamp TIMESTAMP(6) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('window', 'invoice', 'user', 'system', 'data')),
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for activity_logs user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activity_logs_user_id_fkey'
  ) THEN
    ALTER TABLE activity_logs 
      ADD CONSTRAINT activity_logs_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_user_timestamp ON activity_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_level ON activity_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_log_id ON activity_logs(log_id);
"""

def main():
    print("=" * 70)
    print("🔧 Activity Logs Migration")
    print("=" * 70)
    print()
    
    try:
        print("🗄️  Database-ə qoşulur...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🚀 Migration işə salınır...")
        cursor.execute(SQL)
        conn.commit()
        
        # Yoxla
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'activity_logs'
        """)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            print()
            print("✅ Migration uğurla tamamlandı!")
            print()
            print("📊 Yaradılanlar:")
            print("   ✓ activity_logs cədvəli")
            print("   ✓ idx_logs_user_timestamp index")
            print("   ✓ idx_logs_category index")
            print("   ✓ idx_logs_level index")
            print("   ✓ idx_logs_log_id index")
            print()
            print("🎉 Backend API hazırdır!")
            print("   POST   /api/logs")
            print("   GET    /api/logs/:userId")
            print("   DELETE /api/logs/:userId")
            print()
            print("=" * 70)
            return 0
        else:
            print("⚠️  Cədvəl yaradılmadı")
            return 1
            
    except psycopg2.Error as e:
        error_msg = str(e).lower()
        if "already exists" in error_msg or "duplicate" in error_msg:
            print()
            print("✅ Cədvəl artıq mövcuddur!")
            print("   Migration əvvəllər işlədilib")
            print()
            print("=" * 70)
            return 0
        else:
            print(f"❌ Database xətası: {e}")
            print()
            print("=" * 70)
            return 1
    except Exception as e:
        print(f"❌ Xəta: {e}")
        print()
        print("💡 psycopg2 quraşdırmaq lazım ola bilər:")
        print("   pip install psycopg2-binary")
        print()
        print("=" * 70)
        return 1

if __name__ == '__main__':
    exit(main())
