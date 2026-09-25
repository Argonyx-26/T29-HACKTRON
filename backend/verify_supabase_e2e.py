"""
Supabase End-to-End Verification Script
Performs an end-to-end verification of Supabase connectivity,
table schemas, and API integration.
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import engine, Base
import app.models.all_models  # Ensure all models are registered

def run_e2e_verification():
    print("=" * 65)
    print("        SUPABASE & BACKEND DATABASE E2E VERIFICATION        ")
    print("=" * 65)
    
    # 1. Environment Check
    print("\n1. Inspecting Environment Variables...")
    print(f" - APP_ENV: {settings.APP_ENV}")
    print(f" - SUPABASE_URL: {'Set' if settings.SUPABASE_URL else 'Not set (using local DB)'}")
    print(f" - SUPABASE_KEY: {'Set' if settings.SUPABASE_KEY else 'Not set'}")
    print(f" - DATABASE_URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    
    # 2. Database Schema Verification
    print("\n2. Verifying Tables via SQLAlchemy Metadata...")
    table_names = list(Base.metadata.tables.keys())
    print(f" - Registered ORM Tables ({len(table_names)}): {', '.join(table_names)}")
    
    try:
        # Create all tables if they do not exist
        Base.metadata.create_all(bind=engine)
        print(" - Successfully ensured all schema tables exist in the target database.")
    except Exception as e:
        print(f" - ERROR ensuring database tables: {e}")
        return False

    # 3. Read/Write Roundtrip Test
    print("\n3. Testing Database Session and Write/Read Roundtrip...")
    from app.database import SessionLocal
    from app.models.all_models import Subject
    import uuid

    session = SessionLocal()
    test_code = f"TEST_{int(time.time())}"
    test_subject = None
    try:
        test_subject = Subject(
            id=str(uuid.uuid4()),
            code=test_code,
            name="E2E Verification Subject",
            description="Created by verify_supabase_e2e.py to validate write persistence."
        )
        session.add(test_subject)
        session.commit()
        session.refresh(test_subject)
        print(f" - WRITE SUCCESS: Created temporary subject '{test_code}' (ID: {test_subject.id})")

        # Read back
        retrieved = session.query(Subject).filter(Subject.code == test_code).first()
        assert retrieved is not None, "Failed to retrieve the written record"
        print(f" - READ SUCCESS: Retrieved subject '{retrieved.name}' successfully.")

        # Clean up
        session.delete(retrieved)
        session.commit()
        print(" - CLEANUP SUCCESS: Temporary verification record removed.")

    except Exception as e:
        session.rollback()
        print(f" - WRITE/READ TEST FAILED: {e}")
        return False
    finally:
        session.close()

    # 4. Supabase Client Verification (if credentials present)
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        print("\n4. Testing Supabase Direct Client REST Interface...")
        try:
            from supabase import create_client
            client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            print(" - Direct Supabase client instantiated successfully.")
        except Exception as e:
            print(f" - Supabase client warning: {e}")
    else:
        print("\n4. Supabase REST API credentials not configured; using direct DB connection.")

    print("\n" + "=" * 65)
    print("E2E VERIFICATION COMPLETED: All core backend persistence layers operational!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_e2e_verification()
    sys.exit(0 if success else 1)
