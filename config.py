"""Application configuration module.

Reads sensitive settings from environment variables.
Never hardcode secrets in this file.

Environment variables required/optional:
- GEMINI_API_KEY (required): Your Gemini API key
- AI_MODEL (optional): Model name (default: gemini-2.5-flash)
- AI_TEMPERATURE (optional): Sampling temperature 0-1 (default: 0.2)
- AI_TEMPERATURE_DSA (optional): Temperature for DSA (default: 0.1)
- AI_TEMPERATURE_BACKEND (optional): Temperature for Backend (default: 0.2)
- AI_TEMPERATURE_FRONTEND (optional): Temperature for Frontend (default: 0.5)
- AI_MAX_TOKENS (optional): Max response tokens (default: 32768)
- APP_HOST (optional): Server host (default: 0.0.0.0)
- APP_PORT (optional): Server port (default: 5000)
- APP_DEBUG (optional): Debug mode (default: true)
- PROMPT_MAX_CHARS (optional): Max prompt length (default: 4000)

Usage:
    from config import settings
    api_key = settings.api_key
    model = settings.model_name
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

from google import genai


# ========== Helper Functions ==========

def _parse_float(value, default):
    """Parse string to float with fallback."""
    try:
        return float(value) if value else default
    except (TypeError, ValueError):
        return default


def _parse_int(value, default):
    """Parse string to int with fallback."""
    try:
        return int(value) if value else default
    except (TypeError, ValueError):
        return default


def _parse_bool(value, default):
    """Parse string to bool with fallback."""
    if not value:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


# ========== Configuration Class ==========

@dataclass(frozen=True)
class Settings:
    """Application settings (immutable)."""
    
    # API Settings
    api_key: str
    model_name: str
    temperature: float
    temperature_dsa: float
    temperature_backend: float
    temperature_frontend: float
    max_tokens: int
    
    # Server Settings
    app_host: str
    app_port: int
    app_debug: bool
    
    # Feature Settings
    prompt_max_chars: int


# ========== Load Settings from Environment ==========

settings = Settings(
    # API Settings (read from environment)
    api_key=os.getenv("GEMINI_API_KEY", "").strip(),
    model_name=os.getenv("AI_MODEL", "gemini-2.5-flash").strip(),
    temperature=_parse_float(os.getenv("AI_TEMPERATURE"), 0.2),
    temperature_dsa=_parse_float(os.getenv("AI_TEMPERATURE_DSA"), 0.1),
    temperature_backend=_parse_float(os.getenv("AI_TEMPERATURE_BACKEND"), 0.2),
    temperature_frontend=_parse_float(os.getenv("AI_TEMPERATURE_FRONTEND"), 0.5),
    max_tokens=_parse_int(os.getenv("AI_MAX_TOKENS"), 32768),
    
    # Server Settings
    app_host=os.getenv("APP_HOST", "0.0.0.0").strip(),
    app_port=_parse_int(os.getenv("APP_PORT"), 5000),
    app_debug=_parse_bool(os.getenv("APP_DEBUG"), True),
    
    # Feature Settings
    prompt_max_chars=_parse_int(os.getenv("PROMPT_MAX_CHARS"), 4000),
)


def get_temperature_for_project(project_type: Optional[str]) -> float:
    key = (project_type or "").strip().lower()
    if key == "dsa":
        return settings.temperature_dsa
    if key == "backend":
        return settings.temperature_backend
    if key == "frontend":
        return settings.temperature_frontend
    return settings.temperature


def log_genai(message: str) -> None:
    print(f"[GenAI] {message}")


@lru_cache(maxsize=1)
def get_genai_client():
    if not settings.api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    log_genai("Initializing client")
    return genai.Client(api_key=settings.api_key)
