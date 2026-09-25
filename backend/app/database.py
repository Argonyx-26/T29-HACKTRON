from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

import urllib.parse

def get_normalized_database_url(url: str) -> str:
    cleaned = (url or "").strip()
    if cleaned.startswith("postgres://"):
        cleaned = cleaned.replace("postgres://", "postgresql://", 1)
    
    # Safely handle special characters in database password (such as '@', '#', '%')
    if "://" in cleaned and "@" in cleaned:
        proto, rest = cleaned.split("://", 1)
        creds, host_part = rest.rsplit("@", 1)
        if ":" in creds:
            user, raw_pass = creds.split(":", 1)
            encoded_pass = urllib.parse.quote_plus(urllib.parse.unquote_plus(raw_pass))
            return f"{proto}://{user}:{encoded_pass}@{host_part}"
    return cleaned


normalized_url = get_normalized_database_url(settings.DATABASE_URL)

engine_kwargs = {}
if "sqlite" in normalized_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Supabase PostgreSQL / Transaction or Session Pooler optimizations
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(normalized_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
