"""
api/routes/predict.py
=====================
Prediction endpoint. Combines the Predictor and Telegram services.
"""
from fastapi import APIRouter, HTTPException, Depends

from core.schemas import PredictRequest
from core.config import alert_thresholds
from core.exceptions import ModelNotLoadedError
from model.persistence import ModelPersistence
from model.predictor import TokenPredictor
from services.telegram import TelegramAlertService

router = APIRouter(tags=["Prediction"])


# ── Dependency Injection ───────────────────────────────────────────────────
def get_predictor() -> TokenPredictor:
    """Dependency: initializes the predictor with the current model."""
    model = ModelPersistence.load()
    return TokenPredictor(model)

def get_telegram_service() -> TelegramAlertService:
    """Dependency: initializes the alert service."""
    return TelegramAlertService()


# ── Route ──────────────────────────────────────────────────────────────────
@router.post("/predict")
def predict_tokens(
    req: PredictRequest,
    predictor: TokenPredictor = Depends(get_predictor),
    notifier: TelegramAlertService = Depends(get_telegram_service)
):
    """Processes a batch of tokens, predicting classifications and firing alerts."""
    if not req.tokens:
        raise HTTPException(status_code=400, detail="No tokens provided.")

    results = []

    for token in req.tokens:
        try:
            # 1. Predict
            result = predictor.predict(token)
            
            # 2. Alert logic
            if result.verdict == "GEM" and result.confidence >= alert_thresholds.gem_min_confidence:
                notifier.send_alert(token, "GEM", result.confidence)
            elif result.verdict == "RUG" and result.confidence >= alert_thresholds.rug_min_confidence:
                notifier.send_alert(token, "RUG", result.confidence)
                
            results.append(result.model_dump())
            
        except ModelNotLoadedError as e:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Please run: python ml_service/train.py"
            ) from e

    return {
        "success": True, 
        "data": results, 
        "count": len(results)
    }
