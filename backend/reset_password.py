"""
Reset password for nesib20@gmail.com
New password: admin123
"""

import os
from dotenv import load_dotenv
import psycopg2
import bcrypt

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# Generate bcrypt hash for 'admin123'
password = 'admin123'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

print(f"Resetting password for nesib20@gmail.com...")
print(f"New password: {password}")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE users 
        SET password = %s
        WHERE email = 'nesib20@gmail.com'
        RETURNING id, email;
    """, (hashed.decode('utf-8'),))
    
    result = cursor.fetchone()
    
    if result:
        conn.commit()
        print(f"SUCCESS! Password updated for user ID: {result[0]}")
        print(f"\nLogin credentials:")
        print(f"  Email: nesib20@gmail.com")
        print(f"  Password: admin123")
    else:
        print("ERROR: User not found!")
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
