from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Knowledge Twin API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Server
    APP_ENV: str = Field(default="development", env="APP_ENV")
    DEBUG: bool = Field(default=True, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    SECRET_KEY: str = Field(default="knowledge-twin-secret-key-super-secure-change-in-prod", env="SECRET_KEY")
    
    # Database (Supabase PostgreSQL / Local SQLite fallback)
    DATABASE_URL: str = Field(
        default="sqlite:///./knowledge_twin.db",
        env="DATABASE_URL"
    )
    
    # Supabase Credentials (optional for direct API access)
    SUPABASE_URL: Optional[str] = Field(default=None, env="SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = Field(default=None, env="SUPABASE_KEY")
    
    # LLM Integrations
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # File Storage
    UPLOAD_DIR: str = Field(
        default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"),
        env="UPLOAD_DIR"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
