"""
model/persistence.py
====================
Single Responsibility: Loading and saving models to disk.
"""
from typing import Optional
import joblib
from sklearn.ensemble import RandomForestClassifier

from core.config import model_config


class ModelPersistence:
    """Provides I/O operations for scikit-learn models."""

    @staticmethod
    def save(model: RandomForestClassifier) -> str:
        """Saves the model to the configured path."""
        path = str(model_config.model_path)
        joblib.dump(model, path)
        return path

    @staticmethod
    def load() -> Optional[RandomForestClassifier]:
        """Loads the model, returning None if not found or corrupted."""
        try:
            return joblib.load(model_config.model_path)
        except (FileNotFoundError, EOFError, ValueError):
            # EOF/ValueError can happen if the pickle file is corrupt/empty
            return None
