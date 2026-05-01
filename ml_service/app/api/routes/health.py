"""
api/routes/health.py
====================
Healthcheck endpoint.
"""
from fastapi import APIRouter

from app.core.config import telegram_settings
from app.model.persistence import ModelPersistence

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Returns the operational status of the service and its dependencies."""
    # We attempt a fast check. Note: hitting disk for model check 
    # on every ping might be slow in prod, but fine for hackathon.
    model_instance = ModelPersistence.load()
    
    return {
        "status": "ok",
        "model_loaded": model_instance is not None,
        "telegram_configured": telegram_settings.is_configured
    }
