import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def get_connection():
    """Get a connection to the Supabase PostgreSQL database."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    
    return psycopg2.connect(database_url)