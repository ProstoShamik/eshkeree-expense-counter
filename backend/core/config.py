from pydantic import SecretStr
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

    model_config = SettingsConfigDict(
        env_prefix="DB_", # add prefix DB_ to environment variables
        env_file=str(BASE_DIR / ".env"), # path to environment variables
        extra="ignore", # ignore extra environment variables
    )

    def engine_kwargs(self) -> dict:
        return {"echo": self.echo}

    def session_kwargs(self) -> dict:
        return {"expire_on_commit": False}


class AuthSettings(BaseSettings):
    secret_key: SecretStr = SecretStr("your-secret-key-change-in-production")
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
    database: DatabaseSettings = DatabaseSettings()
    auth: AuthSettings = AuthSettings()
    logging : LoggingSettings = LoggingSettings()

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        extra="ignore",
    )

# global settings object

settings = Settings()
