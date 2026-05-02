"""
api/routes/predict.py
=====================
Prediction endpoint. Combines the Predictor and Telegram services.
"""
from fastapi import APIRouter, HTTPException, Depends

from app.core.schemas import PredictRequest
from app.core.config import alert_thresholds
from app.core.exceptions import ModelNotLoadedError
from app.model.persistence import ModelPersistence
from app.model.predictor import TokenPredictor
from app.services.telegram import TelegramAlertService

router = APIRouter(tags=["Prediction"])


# ── Dependency Injection ───────────────────────────────────────────────────
def get_predictor() -> TokenPredictor:
    """Dependency: initializes the predictor with the current model."""
    model = ModelPersistence.load()
    return TokenPredictor(model)

def get_telegram_service() -> TelegramAlertService:
    """Dependency: initializes the alert service."""
    return TelegramAlertService()


import asyncio
from app.services.bot import fetch_token_security, analyze_top_traders

# ── Route ──────────────────────────────────────────────────────────────────
@router.post("/predict")
async def predict_tokens(
    req: PredictRequest,
    predictor: TokenPredictor = Depends(get_predictor),
    notifier: TelegramAlertService = Depends(get_telegram_service)
):
    """Processes a batch of tokens, predicting classifications and firing alerts."""
    if not req.tokens:
        raise HTTPException(status_code=400, detail="No tokens provided.")

    results = []

    # Enrichment step for higher quality dashboard signals
    async def enrich_and_predict(token):
        if token.smartMoneyBuyRatio == 0.5 or token.securityScore == 50.0:
            # Only fetch if we're at defaults to save API credits/time
            sec_task = fetch_token_security(token.address)
            whale_task = analyze_top_traders(token.address)
            security_score, (buy_ratio, sybil_score, whale_quality, _) = await asyncio.gather(sec_task, whale_task)
            
            token.securityScore = security_score
            token.smartMoneyBuyRatio = buy_ratio
            token.sybilScore = sybil_score
            token.whaleQualityIndex = whale_quality
        
        return predictor.predict(token)

    tasks = [enrich_and_predict(t) for t in req.tokens]
    batch_results = await asyncio.gather(*tasks)

    for i, result in enumerate(batch_results):
        token = req.tokens[i]
        # 2. Alert logic
        if result.verdict == "GEM" and result.confidence >= alert_thresholds.gem_min_confidence:
            notifier.send_alert(token, "GEM", result.confidence)
        elif result.verdict == "RUG" and result.confidence >= alert_thresholds.rug_min_confidence:
            notifier.send_alert(token, "RUG", result.confidence)
            
        results.append(result.model_dump())

    return {
        "success": True, 
        "data": results, 
        "count": len(results)
    }
