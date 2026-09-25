import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load .env from root and backend
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

import urllib.parse

db_url = os.getenv("DATABASE_URL", "").strip()

def mask_url(url: str) -> str:
    if "@" in url and "://" in url:
        proto, rest = url.split("://", 1)
        creds, host_part = rest.rsplit("@", 1)
        user = creds.split(":", 1)[0] if ":" in creds else creds
        return f"{proto}://{user}:*****@{host_part}"
    return url

def normalize_url(url: str) -> str:
    cleaned = (url or "").strip()
    if cleaned.startswith("postgres://"):
        cleaned = cleaned.replace("postgres://", "postgresql://", 1)
    if "://" in cleaned and "@" in cleaned:
        proto, rest = cleaned.split("://", 1)
        creds, host_part = rest.rsplit("@", 1)
        if ":" in creds:
            user, raw_pass = creds.split(":", 1)
            encoded_pass = urllib.parse.quote_plus(urllib.parse.unquote_plus(raw_pass))
            return f"{proto}://{user}:{encoded_pass}@{host_part}"
    return cleaned

print("=" * 60)
print("KNOWLEDGE TWIN — SUPABASE POSTGRESQL VERIFICATION")
print("=" * 60)

if not db_url or "sqlite" in db_url.lower():
    print("STATUS: FAILED")
    print("REASON: Supabase NOT configured — current database is SQLite or DATABASE_URL is empty.")
    print("=" * 60)
    sys.exit(1)

if "[YOUR-PASSWORD]" in db_url or "[PASSWORD]" in db_url:
    print("STATUS: FAILED")
    print("REASON: Supabase connection string contains placeholder '[YOUR-PASSWORD]'.")
    print(f"DATABASE_URL: {mask_url(db_url)}")
    print("ACTION REQUIRED: Please open e:\\KNOWLEDGE TWIN\\.env and replace [YOUR-PASSWORD] with your actual Supabase PostgreSQL password.")
    print("=" * 60)
    sys.exit(1)

normalized_db_url = normalize_url(db_url)
print(f"Target Database URL: {mask_url(normalized_db_url)}")


try:
    engine = create_engine(normalized_db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database(), current_user, version();")).fetchone()
        db_name, user, version = result[0], result[1], result[2]
        
        print("\nDATABASE CONNECTION: SUCCESSFUL!")
        print(f"Connected Database : {db_name}")
        print(f"Connected User     : {user}")
        print(f"PostgreSQL Version : {version.split(',')[0]}")
        
        # Check existing tables
        tables_res = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)).fetchall()
        
        tables = [t[0] for t in tables_res]
        print(f"\nPublic Tables ({len(tables)} found):")
        for t in tables:
            print(f"  - {t}")
            
    print("\n" + "=" * 60)
    print("Supabase PostgreSQL connection verified successfully.")
    print("=" * 60)
    sys.exit(0)

except Exception as e:
    err_str = str(e)
    print("\nSTATUS: CONNECTION FAILED")
    print("=" * 60)
    if "password authentication failed" in err_str.lower():
        print("ERROR: Password authentication failed.")
        print("ACTION REQUIRED: Check the password for user 'postgres' in your Supabase project settings.")
    elif "could not translate host name" in err_str.lower() or "getaddrinfo failed" in err_str.lower():
        print("ERROR: DNS / Host resolution failed. Verify the project reference in the hostname.")
    else:
        print(f"ERROR: {err_str}")
    print("=" * 60)
    sys.exit(1)
