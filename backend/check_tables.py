import os
from dotenv import load_dotenv
from database import get_connection

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def check_tables():
    """Check that the Fortnight tables, columns, and RLS policies exist."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        for table_name in ("profiles", "shifts"):
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = %s
            """, (table_name,))

            result = cur.fetchone()
            if not result:
                print(f"Table not found: public.{table_name}")
                continue

            print(f"Table found: public.{table_name}")
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            columns = cur.fetchall()
            print("Columns:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")

            cur.execute("""
                SELECT policyname, cmd, qual
                FROM pg_policies
                WHERE schemaname = 'public' AND tablename = %s
            """, (table_name,))
            policies = cur.fetchall()
            if policies:
                print("RLS policies:")
                for policy in policies:
                    print(f"  - {policy[0]} ({policy[1]})")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == "__main__":
    check_tables()