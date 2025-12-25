
import os
import random
import time
from datetime import datetime

# Try to import psycopg2
try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("❌ Error: 'psycopg2' module not found.")
    print("👉 Please run: pip install psycopg2-binary")
    exit(1)

# -----------------------------------------------------------------------------
# ⚠️  BURANI DƏYİŞİN: Neon verilənlər bazası linkini aşağıya yapışdırın
# Nümunə: "postgres://user:pass@ep-cool-site.aws.neon.tech/mobilsayt?sslmode=require"
# -----------------------------------------------------------------------------
DB_URL = "postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def clean_url(url):
    """Remove unsupported 'schema' parameter but keep 'sslmode'."""
    if "?" in url:
        base, qs = url.split("?", 1)
        params = qs.split("&")
        # Filter out 'schema' param (Prisma uses it, psycopg2 does not like it)
        valid_params = [p for p in params if not p.startswith("schema=")]
        if valid_params:
            return f"{base}?{'&'.join(valid_params)}"
        return base
    return url

def main():
    if DB_URL == "postgres://...":
        print("❌ Xəta: Zəhmət olmasa script faylını açıb 'DB_URL' hissəsinə Neon baza linkini yazın.")
        return

    print("🚀 Starting Invoice Seeder...")
    
    url = clean_url(DB_URL)
    # Mask password for printing
    print_url = url.split("@")[-1] if "@" in url else "..."
    print(f"📂 Connecting to: ...@{print_url}")

    conn = None
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        # 1. Fetch Customers and Products
        cur.execute("SELECT id FROM customers LIMIT 50")
        customers = [r[0] for r in cur.fetchall()]
        
        cur.execute("SELECT id, sale_price FROM products LIMIT 100")
        products = [{"id": r[0], "sale_price": float(r[1] or 0)} for r in cur.fetchall()]
        
        print(f"✅ Found {len(customers)} customers and {len(products)} products.")
        
        if not customers or not products:
            print("❌ Error: Need customers and products to seed invoices.")
            return

        INVOICE_COUNT = 10000
        BATCH_SIZE = 100
        created_count = 0

        # 2. Find last used Invoice Number (SQxxxx)
        print("🔍 Checking last invoice number...")
        try:
            cur.execute("SELECT invoice_number FROM sale_invoices WHERE invoice_number LIKE 'SQ%' ORDER BY LENGTH(invoice_number) DESC, invoice_number DESC LIMIT 1")
            last_invoice_row = cur.fetchone()
            
            start_seq = 1
            if last_invoice_row:
                last_inv = last_invoice_row[0]
                # Extract number part "SQ00000001" -> 1
                try:
                    start_seq = int(last_inv.replace("SQ", "")) + 1
                except ValueError:
                    start_seq = 1
            
            print(f"🔢 Starting sequence from: SQ{start_seq:08d}")

        except Exception as e:
            print(f"⚠️ Could not fetch last invoice number, starting from 1. Error: {e}")
            start_seq = 1

        print(f"📦 Generating {INVOICE_COUNT} invoices in batches of {BATCH_SIZE}...")
        
        start_time = time.time()
        
        current_seq = start_seq

        for i in range(0, INVOICE_COUNT, BATCH_SIZE):
            current_batch_size = min(BATCH_SIZE, INVOICE_COUNT - i)
            
            # Prepare data
            # We need to insert invoice first to get ID, then items.
            # Efficient bulk insert is tricky with 1-to-many.
            # For 10k, plain loop with commit every batch is fine in Python.
            
            for j in range(current_batch_size):
                customer_id = random.choice(customers)
                item_count = random.randint(1, 5)
                
                # Sequential Invoice Number
                inv_number = f"SQ{current_seq:08d}"
                current_seq += 1
                
                total_amount = 0
                items_data = []

                for _ in range(item_count):
                    prod = random.choice(products)
                    qty = random.randint(1, 10)
                    price = prod["sale_price"] or 10
                    total = qty * price
                    total_amount += total
                    items_data.append((prod["id"], qty, price, total))

                # Insert Invoice (single)
                # Note: 'is_active' used to be approved
                cur.execute("""
                    INSERT INTO sale_invoices (invoice_number, customer_id, invoice_date, total_amount, is_active, created_at)
                    VALUES (%s, %s, NOW(), %s, true, NOW())
                    RETURNING id
                """, (inv_number, customer_id, total_amount))
                
                invoice_id = cur.fetchone()[0]

                # Insert Items (bulk for this invoice)
                # item structure: (invoice_id, product_id, quantity, unit_price, total_price)
                invoice_items_rows = [(invoice_id, item[0], item[1], item[2], item[3]) for item in items_data]
                
                execute_values(cur, """
                    INSERT INTO sale_invoice_items (invoice_id, product_id, quantity, unit_price, total_price)
                    VALUES %s
                """, invoice_items_rows)

            conn.commit()
            created_count += current_batch_size
            print(f"   Batch {i // BATCH_SIZE + 1} done. Total: {created_count} (Last: {inv_number})")

        duration = time.time() - start_time
        print(f"✅ Finished! Created {created_count} invoices in {duration:.2f} seconds.")

    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
