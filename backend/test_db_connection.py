"""
Database Connection Test Script
Tests connectivity to the relational database (PostgreSQL / SQLite fallback)
and verifies Supabase client initialization.
"""
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine, check_db_connection
from app.config import settings

def test_sqlalchemy_connection():
    print("=" * 60)
    print("Testing SQLAlchemy Database Connection...")
    print(f"Configured DB URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            scalar = result.scalar()
            if scalar == 1:
                print("SUCCESS: Successfully connected to database and executed 'SELECT 1'.")
                return True
            else:
                print(f"WARNING: Unexpected query result: {scalar}")
                return False
    except Exception as e:
        print(f"FAILED: Could not connect to database via SQLAlchemy: {e}")
        return False

def test_supabase_client():
    print("=" * 60)
    print("Testing Supabase Client Configuration...")
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("INFO: Supabase URL or Key not set in environment. Skipping remote Supabase API test.")
        return True
    
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("SUCCESS: Supabase client initialized successfully with provided credentials.")
        return True
    except Exception as e:
        print(f"FAILED: Supabase client initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("\n[Knowledge Twin Backend - Connectivity Check]")
    db_ok = test_sqlalchemy_connection()
    sb_ok = test_supabase_client()
    print("=" * 60)
    if db_ok:
        print("RESULT: Database connection verified successfully.\n")
        sys.exit(0)
    else:
        print("RESULT: Database connection test failed.\n")
        sys.exit(1)
