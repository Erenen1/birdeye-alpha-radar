"""
api/app.py
==========
FastAPI application factory. Combines middleware, routers, and lifecycle events.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health, predict
from app.services.bot import start_telegram_bot, send_startup_message
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DEBUG: Lifespan starting...")
    # Small delay to allow any previous connection to close on Telegram's side
    await asyncio.sleep(2)
    bot_app = start_telegram_bot()
    if bot_app:
        print("DEBUG: Initializing and starting Telegram bot (Alerts only, polling disabled)...")
        await bot_app.initialize()
        await bot_app.start()
        # await bot_app.updater.start_polling() # No handlers registered, so polling is unnecessary and causes conflicts
        app.state.bot_app = bot_app
        # Run startup notification without blocking
        asyncio.create_task(send_startup_message(bot_app))
    yield
    if hasattr(app.state, 'bot_app'):
        print("DEBUG: Stopping Telegram bot...")
        bot_app = app.state.bot_app
        # await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()
    print("DEBUG: Lifespan shutdown complete.")

def create_app() -> FastAPI:
    """Factory function for the FastAPI application instance."""
    app = FastAPI(
        title="Birdeye Sentinel ML Service",
        version="3.0.0 (Refactored)",
        description="Machine Learning microservice for Birdeye Sentinel",
        lifespan=lifespan
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
