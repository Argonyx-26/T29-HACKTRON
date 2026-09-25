import os
from pathlib import Path

# Ensure tests run against an isolated local database and never drop or alter Supabase
TEST_DB_PATH = Path(__file__).parent / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from app.database import engine, Base
from app.seed.seed_data import init_db, seed_database

def pytest_configure(config):
    init_db()
    seed_database(force_reset=True, include_demo_cohort=True)

def pytest_unconfigure(config):
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
