from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    docs_root: Path = Path(__file__).resolve().parent.parent / "docs" / "philosophy-references"
    kuzu_db_path: Path = Path(__file__).resolve().parent / "db"
    extracted_path: Path = Path(__file__).resolve().parent / "extracted"
    sonnet_model: str = "claude-sonnet-4-20250514"
    haiku_model: str = "claude-haiku-4-20250414"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
