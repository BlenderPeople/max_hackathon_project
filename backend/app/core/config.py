from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str
    cors_origins: str = "http://localhost:5173"
    max_bot_token: str = ""
    max_webhook_secret: str = ""
    max_bot_username: str = ""
    max_app_url: str = ""
    max_api_base_url: str = "https://platform-api2.max.ru"
    max_ca_bundle_path: str = "/etc/ssl/certs/ca-certificates.crt"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
