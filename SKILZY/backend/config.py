# backend/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    MONGO_DATABASE_URL: str

    # Comma-separated admin emails
    ADMINS: str | None = None

    # Frontend base URL for OAuth redirect (e.g., http://127.0.0.1:5173)
    FRONTEND_BASE_URL: str | None = None

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()