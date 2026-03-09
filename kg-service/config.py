from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API keys — at least one must be set for extraction
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Which provider to use for extraction: "openai" or "anthropic"
    extraction_provider: str = "openai"
    # Which provider to use for lesson generation: "openai" or "anthropic"
    generation_provider: str = "openai"

    # Model names per provider
    sonnet_model: str = "claude-sonnet-4-20250514"
    haiku_model: str = "claude-haiku-4-20250414"
    openai_extraction_model: str = "gpt-4.1"  # used for philosophy PDF extraction (one-time, quality matters)
    openai_enrichment_model: str = "gpt-4.1-mini"  # used for standards plain-language rewriting (bulk, simpler task)
    openai_generation_model: str = "gpt-5.2"
    openai_validation_model: str = "gpt-4.1-mini"

    # Paths
    docs_root: Path = Path(__file__).resolve().parent.parent / "docs" / "philosophy-references"
    kuzu_db_path: Path = Path(__file__).resolve().parent / "db"
    extracted_path: Path = Path(__file__).resolve().parent / "extracted"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
