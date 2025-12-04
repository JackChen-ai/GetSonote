from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 3001
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Aliyun ASR
    aliyun_access_key_id: str = ""
    aliyun_access_key_secret: str = ""
    aliyun_app_key: str = ""

    # LLM
    llm_provider: str = "dashscope"  # dashscope | deepseek | openai
    dashscope_api_key: str = ""
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"

    # Mock Mode
    use_mock: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
