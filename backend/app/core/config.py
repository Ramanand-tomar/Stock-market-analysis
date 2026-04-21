"""Application configuration via environment variables."""

import logging
from pathlib import Path
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NIFTY 50 AI Stock Intelligence"
    DEBUG: bool = False

    # CORS — comma-separated list of allowed origins.
    # In production, set this explicitly to your mobile/web app origins.
    CORS_ORIGINS: str = "http://localhost:19006,http://localhost:8081,exp://localhost:19000"

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

    # JWT — MUST be overridden in production via env var. The default value below
    # is intentionally insecure-looking so that any production deployment using
    # it is immediately recognisable; the validator below also logs a critical
    # warning at startup.
    JWT_SECRET: str = "INSECURE-DEV-ONLY-DO-NOT-USE-IN-PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ML models path
    ML_MODELS_DIR: str = str(Path(__file__).resolve().parents[3] / "ml" / "models")
    ML_DATA_DIR: str = str(Path(__file__).resolve().parents[3] / "ml" / "data" / "processed")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

# Startup safety check — refuse to silently use the default JWT secret in
# production. We can't always tell if we're in production, but DEBUG=False is
# a good proxy.
if not settings.DEBUG and "INSECURE-DEV-ONLY" in settings.JWT_SECRET:
    logger.critical(
        "JWT_SECRET is using the insecure default value. "
        "Set JWT_SECRET environment variable to a strong random string "
        "(e.g. `python -c \"import secrets; print(secrets.token_urlsafe(64))\"`)."
    )
