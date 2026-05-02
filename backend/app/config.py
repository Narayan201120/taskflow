"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — Railway provides postgresql://, we need postgresql+asyncpg://
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/taskmanager"

    @property
    def async_database_url(self) -> str:
        """Convert standard postgres URL to asyncpg format for SQLAlchemy."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # JWT
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # App
    APP_NAME: str = "Team Task Manager"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
