"""
core/config.py
==============
Single source of truth for all ML service configuration.

Following the Open/Closed Principle: extend via new dataclass fields,
never by scattering magic numbers throughout the codebase.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# ── Paths ──────────────────────────────────────────────────────────────────
CORE_DIR = Path(__file__).parent
APP_DIR = CORE_DIR.parent
ML_SERVICE_DIR = APP_DIR.parent   # ml_service/
PROJECT_ROOT   = ML_SERVICE_DIR.parent           # project root

load_dotenv(dotenv_path=PROJECT_ROOT / ".env")


# ── Immutable config dataclasses ───────────────────────────────────────────

@dataclass(frozen=True)
class ModelConfig:
    """Hyperparameters for the Random Forest Classifier."""
    n_estimators: int  = 100
    max_depth:    int  = 6
    random_state: int  = 42
    n_samples:    int  = 3_000
    model_file:   str  = "model.pkl"

    @property
    def model_path(self) -> Path:
        return ML_SERVICE_DIR / "artifacts" / self.model_file


@dataclass(frozen=True)
class AlertThresholds:
    """Confidence levels that trigger Telegram notifications."""
    gem_min_confidence: float = 85.0
    rug_min_confidence: float = 80.0


@dataclass(frozen=True)
class ServerConfig:
    """Uvicorn binding settings."""
    host:   str  = "127.0.0.1"
    port:   int  = 8000
    reload: bool = False


# ── Env-driven Telegram settings (lazy reads) ──────────────────────────────

class _TelegramSettings:
    """Reads Telegram credentials lazily from environment variables."""

    _PLACEHOLDER = "YOUR_TELEGRAM_BOT_TOKEN_HERE"

    @property
    def bot_token(self) -> str:
        return os.getenv("TELEGRAM_BOT_TOKEN", "")

    @property
    def chat_id(self) -> str:
        return os.getenv("TELEGRAM_CHAT_ID", "")

    @property
    def is_configured(self) -> bool:
        return bool(
            self.bot_token
            and self.bot_token != self._PLACEHOLDER
            and self.chat_id
        )


# ── Global singletons (import these everywhere) ────────────────────────────
model_config       = ModelConfig()
alert_thresholds   = AlertThresholds()
server_config      = ServerConfig()
telegram_settings  = _TelegramSettings()
