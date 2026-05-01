"""
model/predictor.py
==================
Single Responsibility: Applies the loaded model to new token data.
"""
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from app.core.schemas import TokenData, PredictionResult
from app.core.exceptions import ModelNotLoadedError


class TokenPredictor:
    """Uses a scikit-learn model to generate predictions for tokens."""

    def __init__(self, model: RandomForestClassifier | None):
        self.model = model

    def predict(self, token: TokenData) -> PredictionResult:
        """Evaluates a single token and returns a standardized result."""
        if not self.model:
            raise ModelNotLoadedError("Model is not loaded.")

        # 1. Feature normalization
        liq   = max(token.liquidity or 1.0, 1.0)  # Avoid div/0
        vol   = token.volume24hUSD or 0.0
        chg   = token.price24hChangePercent or 0.0
        ratio = vol / liq

        features_df = pd.DataFrame([{
            'liquidity':     liq,
            'volume':        vol,
            'price_change':  chg,
            'vol_liq_ratio': ratio
        }])

        # 2. Inference
        pred  = self.model.predict(features_df)[0]
        probs = self.model.predict_proba(features_df)[0]
        
        confidence = float(max(probs) * 100)

        # 3. Post-processing logic
        if pred == 1:
            verdict     = "GEM"
            alpha_score = round(confidence)
            risk_score  = round(100 - confidence)
        elif pred == 2:
            verdict     = "RUG"
            alpha_score = round(100 - confidence)
            risk_score  = round(confidence)
        else:
            verdict     = "NEUTRAL"
            alpha_score = 50
            risk_score  = 50

        return PredictionResult(
            address=token.address,
            verdict=verdict,
            alphaScore=alpha_score,
            riskScore=risk_score,
            confidence=round(confidence, 1)
        )
