#!/usr/bin/env python3
"""
Activity Logs migration skriptini tətbiq et
"""
import os
import sys
from pathlib import Path

def run_migration():
    """Migration SQL faylını oxu və çalışdır"""
    backend_dir = Path(__file__).parent
    migration_file = backend_dir / 'migrations' / '001_create_activity_logs.sql'
    
    if not migration_file.exists():
        print(f"❌ Migration faylı tapılmadı: {migration_file}")
        return False
    
    # .env faylından DATABASE_URL oxu
    env_file = backend_dir / '.env'
    database_url = None
    
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    
    if not database_url:
        print("❌ DATABASE_URL tapılmadı .env faylında")
        print("\n📝 Manual migration:")
        print("1. Neon Dashboard-a daxil olun")
        print("2. SQL Editor-ü açın")
        print("3. Aşağıdakı SQL-i çalışdırın:\n")
        with open(migration_file, 'r', encoding='utf-8') as f:
            print(f.read())
        return False
    
    print("=" * 70)
    print("🔧 Activity Logs Migration")
    print("=" * 70)
    print(f"📁 Migration faylı: {migration_file.name}")
    print(f"🗄️  Database: {database_url[:40]}...")
    print()
    
    # SQL məzmununu oxu
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    try:
        # psycopg2 istifadə edərək SQL-i çalışdır
        import psycopg2
        
        print("🚀 Migration tətbiq edilir...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # SQL-i çalışdır
        cursor.execute(sql_content)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        print("✅ Migration uğurla tətbiq olundu!")
        print("\n📋 Yaradılan cədvəl: activity_logs")
        print("📊 Yaradılan index-lər:")
        print("   - idx_logs_user_timestamp")
        print("   - idx_logs_category")
        print("   - idx_logs_level")
        print("   - idx_logs_log_id")
        
        return True
        
    except ImportError:
        print("⚠️  psycopg2 quraşdırılmayıb")
        print("\n📝 Manual migration:")
        print("1. Neon Dashboard-a daxil olun")
        print("2. SQL Editor-ü açın")
        print("3. Aşağıdakı SQL-i çalışdırın:\n")
        print(sql_content)
        return False
        
    except Exception as e:
        print(f"❌ Migration xətası: {e}")
        print("\n📝 Manual migration:")
        print("1. Neon Dashboard-a daxil olun")
        print("2. SQL Editor-ü açın")
        print("3. Aşağıdakı SQL-i çalışdırın:\n")
        print(sql_content)
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
