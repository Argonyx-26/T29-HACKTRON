import os
from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

from pydantic import ConfigDict, field_validator

class Settings(BaseSettings):
    APP_NAME: str = "Knowledge Twin"
    TEAM_NAME: str = "HACKTRON"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database: reads from DATABASE_URL env var if valid, otherwise fallback to local sqlite for tests/offline dev
    DATABASE_URL: str = ""
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        cleaned = (v or "").strip()
        if cleaned and "[YOUR-PASSWORD]" not in cleaned and "[PASSWORD]" not in cleaned:
            return cleaned
        return f"sqlite:///{BACKEND_DIR / 'knowledge_twin.db'}"
    
    # Dual API Keys for LLM Failover
    GEMINI_API_KEY_PRIMARY: str = os.getenv("GEMINI_API_KEY_PRIMARY", "")
    GEMINI_API_KEY_SECONDARY: str = os.getenv("GEMINI_API_KEY_SECONDARY", "")
    
    # Storage for uploaded files
    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"
    
    @property
    def is_postgres(self) -> bool:
        return "postgres" in self.DATABASE_URL.lower()

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL.lower()

    model_config = ConfigDict(
        extra="allow",
        env_file=[ROOT_DIR / ".env", BACKEND_DIR / ".env", ".env"]
    )

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

