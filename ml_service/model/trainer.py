"""
model/trainer.py
================
Single Responsibility: Encapsulates model fitting logic.
"""
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from core.config import model_config


class ModelTrainer:
    """Handles the training of the token classification model."""

    def __init__(self):
        self.clf = RandomForestClassifier(
            n_estimators=model_config.n_estimators,
            max_depth=model_config.max_depth,
            random_state=model_config.random_state
        )

    def fit(self, df: pd.DataFrame) -> RandomForestClassifier:
        """Fits the internal classifier using the provided DataFrame."""
        # 1. Extract features and target
        feature_cols = ['liquidity', 'volume', 'price_change', 'vol_liq_ratio']
        X = df[feature_cols]
        y = df['target']

        # 2. Train
        self.clf.fit(X, y)
        return self.clf
