from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Path(__file__).resolve().parent.parent is the path to the backend directory
# __file__ is the path to the current file
# .resolve() is the path to the current file
# .parent is the path to the parent directory

BASE_DIR = Path(__file__).resolve().parent.parent

# BaseSettings allow to read settings from .env 

class DatabaseSettings(BaseSettings):
    url: str = "sqlite+aiosqlite:///./app.db"
    echo: bool = False
    pool_size: int = 5
    max_overflow: int = 10 
    auto_create_tables: bool = True

    model_config = SettingsConfigDict(
        env_prefix="DB_", # add prefix DB_ to environment variables
        env_file=str(BASE_DIR / ".env"), # path to environment variables
        extra="ignore", # ignore extra environment variables
    )

    def engine_kwargs(self) -> dict:
        kwargs = {"echo": self.echo}
        if not self.url.startswith("sqlite"):
            kwargs.update({"pool_size": self.pool_size, "max_overflow": self.max_overflow})
        return kwargs

    def session_kwargs(self) -> dict:
        return {"expire_on_commit": False}


class AuthSettings(BaseSettings):
    secret_key: SecretStr = SecretStr("dev-only-change-me-to-a-long-random-secret")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_prefix="AUTH_",
        env_file=str(BASE_DIR / ".env"),
        extra="ignore",
    )

class LoggingSettings(BaseSettings):
    file : str = "app.log"
    format : str= "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    level : str = "INFO"

    model_config = SettingsConfigDict(
        env_prefix="LOGGING_",
        env_file=str(BASE_DIR / ".env"),
        extra="ignore"
    )

class Settings(BaseSettings):
    environment: str = "development"
    cors_origins: str = "http://localhost,http://localhost:5173"
    database: DatabaseSettings = DatabaseSettings()
    auth: AuthSettings = AuthSettings()
    logging : LoggingSettings = LoggingSettings()

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        unsafe_secret = self.auth.secret_key.get_secret_value() in {
            "your-secret-key-change-in-production",
            "dev-only-change-me-to-a-long-random-secret",
            "eshkeree",
        }
        if self.environment.lower() == "production" and unsafe_secret:
            raise ValueError("AUTH_SECRET_KEY must be set to a strong random value in production")
        return self

# global settings object

settings = Settings()
