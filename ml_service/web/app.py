"""
api/app.py
==========
FastAPI application factory. Combines middleware, routers, and lifecycle events.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health, predict

def create_app() -> FastAPI:
    """Factory function for the FastAPI application instance."""
    app = FastAPI(
        title="Sycon Alpha ML Service",
        version="3.0.0 (Refactored)",
        description="Machine Learning microservice for Birdeye Alpha Radar"
    )

    # Allow CORS so Next.js frontend/backend can hit it
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register sub-routers
    app.include_router(health.router)
    app.include_router(predict.router)

    return app
