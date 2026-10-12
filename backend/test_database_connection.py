import os
from dotenv import load_dotenv
from database import get_connection

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def test_connection():
    """Test the database connection without printing sensitive information."""
    try:
        # Get connection
        conn = get_connection()
        
        # Test with a simple query
        cur = conn.cursor()
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        
        # Clean up
        cur.close()
        conn.close()
        
        # Print success message (without password)
        print("Database connection successful")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()