#!/usr/bin/env python3
"""
Notifications table migration-ını run edən script
"""

import psycopg2
import sys
from pathlib import Path

# Database connection string
DATABASE_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def run_migration():
    """Run notifications migration"""
    try:
        # Connect to database
        print("📡 Database-ə qoşulur...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Read migration file
        migration_file = Path(__file__).parent / "migrations" / "002_create_notifications.sql"
        print(f"📄 Migration faylı oxunur: {migration_file}")
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Execute migration
        print("🔧 Migration icra edilir...")
        cur.execute(sql)
        conn.commit()
        
        print("✅ Notifications table uğurla yaradıldı!")
        
        # Close connection
        cur.close()
        conn.close()
        
        return True
        
    except psycopg2.errors.DuplicateTable:
        print("ℹ️  Notifications table artıq mövcuddur")
        return True
    except Exception as e:
        print(f"❌ Xəta: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
