import os
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


def _default_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL", "")
    if os.getenv("VERCEL"):
        return "sqlite:////tmp/invex.db"
    return "sqlite:///./invex.db"


class Settings(BaseSettings):
    SECRET_KEY: str = "invex-super-secret-key-change-in-production"
    DATABASE_URL: str = Field(default_factory=_default_database_url)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12
    CORS_ORIGINS: str = "*"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
