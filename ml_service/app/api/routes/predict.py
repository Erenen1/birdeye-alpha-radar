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
import httpx

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
        return {"success": True, "data": [], "count": 0}

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

@router.get("/whale-watch")
async def get_whale_watch():
    """Fetches high-volume tokens as 'whale' activity proxy."""
    from app.services.bot import BIRDEYE_API_KEY, get_cached, set_cached
    if not BIRDEYE_API_KEY:
        return {"success": False, "error": "API Key missing"}

    cache_key = "whale_watch_data"
    cached = get_cached(cache_key)
    if cached: return {"success": True, "data": cached}

    url = "https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", {}).get("tokens", [])
                whale_trades = []
                import time
                for item in items:
                    # Skip common stables and native SOL
                    if item.get("symbol") in ["SOL", "USDC", "USDT", "WSOL"]:
                        continue

                    vol = item.get("v24hUSD") or 0
                    last_trade = item.get("lastTradeUnixTime") or 0
                    time_ago = "Recently"
                    if last_trade > 0:
                        diff = int(time.time()) - last_trade
                        if diff < 60: time_ago = "Just now"
                        elif diff < 3600: time_ago = f"{diff // 60}m ago"
                        else: time_ago = f"{diff // 3600}h ago"

                    whale_trades.append({
                        "id": f"whale-{item['address']}",
                        "symbol": item["symbol"],
                        "name": item.get("name", item["symbol"]),
                        "address": item["address"],
                        "logo": item.get("logoURI"),
                        "amount": vol * 0.005, # Simulated trade size based on 24h vol
                        "type": "BUY" if vol > 500000 else "SELL",
                        "isSmart": vol > 2000000,
                        "time": time_ago,
                        "price": item.get("price"),
                        "liquidity": item.get("liquidity"),
                        "volume24hUSD": vol,
                        "price24hChangePercent": item.get("v24hChangePercent")
                    })
                res_data = whale_trades[:12]
                set_cached(cache_key, res_data, ttl=45) # 45s cache
                return {"success": True, "data": res_data}
            else:
                return {"success": False, "error": f"Birdeye API Rate Limited (Status {resp.status_code})"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/token-trades/{address}")
async def get_token_trades(address: str):
    """Fetches recent large transactions for a specific token."""
    from app.services.bot import BIRDEYE_API_KEY, get_cached, set_cached
    if not BIRDEYE_API_KEY:
        return {"success": False, "error": "API Key missing"}

    cache_key = f"trades_{address}"
    cached = get_cached(cache_key)
    if cached: return {"success": True, "data": cached}

    url = f"https://public-api.birdeye.so/defi/txs/token?address={address}&offset=0&limit=15"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                items = resp.json().get("data", {}).get("items", [])
                trades = []
                for item in items:
                    trades.append({
                        "id": item.get("tx_hash"),
                        "side": item.get("side", "buy").upper(),
                        "volume": item.get("volume_usd") or 0,
                        "time": item.get("block_unix_time"),
                        "source": item.get("source", "Raydium")
                    })
                set_cached(cache_key, trades, ttl=30) # 30s cache
                return {"success": True, "data": trades}
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": False, "error": "Failed to fetch trades"}
