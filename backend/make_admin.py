"""
Make nesib20@gmail.com admin user - Simple version
"""

import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found!")
    exit(1)

print("Making nesib20@gmail.com admin...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Update user to admin
    cursor.execute("""
        UPDATE users 
        SET 
            role = 'ADMIN',
            is_admin = TRUE,
            is_active = TRUE
        WHERE email = 'nesib20@gmail.com'
        RETURNING id, email, role, is_admin;
    """)
    
    result = cursor.fetchone()
    
    if result:
        user_id, email, role, is_admin = result
        conn.commit()
        
        print(f"SUCCESS! User is now admin:")
        print(f"  ID: {user_id}")
        print(f"  Email: {email}")
        print(f"  Role: {role}")
        print(f"  Is Admin: {is_admin}")
        
    else:
        print("ERROR: User not found!")
        print("Please register first at: http://localhost:3000/register")
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    exit(1)
