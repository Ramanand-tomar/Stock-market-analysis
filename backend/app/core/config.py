"""Application configuration via environment variables."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NIFTY 50 AI Stock Intelligence"
    DEBUG: bool = False

    # PostgreSQL — accepts a standard DATABASE_URL (Neon, Supabase, etc.)
    DATABASE_URL: str = "postgresql://nifty:nifty_secret@localhost:5432/nifty50"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Convert standard postgres:// URL to asyncpg driver URL.
        Strips sslmode and channel_binding params (handled via connect_args)."""
        import re
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        # Remove params not supported by asyncpg (SSL handled in connect_args)
        for param in ["sslmode", "channel_binding"]:
            url = re.sub(rf"[&?]{param}=[^&]*", "", url)
        # Clean up dangling ? if all params were removed
        url = re.sub(r"\?$", "", url)
        return url

    # MongoDB
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "nifty50"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ML models path
    ML_MODELS_DIR: str = str(Path(__file__).resolve().parents[3] / "ml" / "models")
    ML_DATA_DIR: str = str(Path(__file__).resolve().parents[3] / "ml" / "data" / "processed")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
