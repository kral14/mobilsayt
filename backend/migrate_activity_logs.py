#!/usr/bin/env python3
"""
Activity Logs Migration Script
Bu skripti işlətmək üçün:
1. Backend qovluğunda .env faylında DATABASE_URL olmalıdır
2. Komanda: python migrate_activity_logs.py
"""

import os
import sys

def main():
    print("=" * 70)
    print("🔧 Activity Logs Migration")
    print("=" * 70)
    print()
    
    # .env faylını yoxla
    env_path = '.env'
    if not os.path.exists(env_path):
        print("❌ .env faylı tapılmadı!")
        print("\n📝 .env faylı yaradın və DATABASE_URL əlavə edin:")
        print('DATABASE_URL="postgresql://user:password@host:5432/database"')
        return 1
    
    # DATABASE_URL-i oxu
    database_url = None
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip().startswith('DATABASE_URL='):
                database_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                break
    
    if not database_url:
        print("❌ DATABASE_URL .env faylında tapılmadı!")
        print("\n📝 .env faylına əlavə edin:")
        print('DATABASE_URL="postgresql://user:password@host:5432/database"')
        return 1
    
    print(f"🗄️  Database: {database_url[:50]}...")
    print()
    
    # Migration SQL-i oxu
    migration_file = 'migrations/001_create_activity_logs.sql'
    if not os.path.exists(migration_file):
        print(f"❌ Migration faylı tapılmadı: {migration_file}")
        return 1
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("📋 Migration SQL yükləndi")
    print(f"📏 SQL ölçüsü: {len(sql)} bytes")
    print()
    
    # psycopg2 yoxla
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 quraşdırılmayıb!")
        print("\n📦 Quraşdırmaq üçün:")
        print("pip install psycopg2-binary")
        print("\nvə ya:")
        print("pip install psycopg2")
        return 1
    
    # Migration-ı işlət
    try:
        print("🚀 Migration işə salınır...")
        print()
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # SQL-i işlət
        cursor.execute(sql)
        conn.commit()
        
        # Nəticəni yoxla
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'activity_logs'
        """)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
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
            return 0
        else:
            print("⚠️  Cədvəl yaradılmadı")
            return 1
            
    except psycopg2.Error as e:
        print(f"❌ Database xətası: {e}")
        print()
        print("💡 Əgər cədvəl artıq mövcuddursa, bu normal ola bilər")
        print("   Yoxlamaq üçün: SELECT * FROM activity_logs LIMIT 1;")
        return 1
    except Exception as e:
        print(f"❌ Xəta: {e}")
        return 1

if __name__ == '__main__':
    exit_code = main()
    print()
    print("=" * 70)
    sys.exit(exit_code)
