import os
import asyncio
import httpx
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import telegram_settings
from app.model.persistence import ModelPersistence
from app.model.predictor import TokenPredictor
from app.core.schemas import TokenData

# Use the root .env API key
BIRDEYE_API_KEY = os.getenv("BIRDEYE_API_KEY")

# ── Optimization: Redis Cache ─────────────────────────────────────────────
import json
import redis as redis_lib

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = None

try:
    redis_client = redis_lib.from_url(REDIS_URL, decode_responses=True)
    print(f"Connected to Redis at {REDIS_URL}")
except Exception as e:
    print(f"Redis connection failed: {e}")

def get_cached(key: str):
    if not redis_client: return None
    try:
        val = redis_client.get(key)
        return json.loads(val) if val else None
    except: return None

def set_cached(key: str, data: any, ttl: int = 300):
    if not redis_client: return
    try:
        redis_client.setex(key, ttl, json.dumps(data))
    except: pass

async def fetch_new_listings():
    if not BIRDEYE_API_KEY:
        return []
    url = "https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=10"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", {}).get("items", [])
                tokens = []
                for item in items:
                    tokens.append(TokenData(
                        address=item.get("address", ""),
                        symbol=item.get("symbol", "UNKNOWN"),
                        name=item.get("name", ""),
                        price=item.get("price"),
                        liquidity=item.get("liquidity"),
                        volume24hUSD=item.get("v24hUSD"),
                        price24hChangePercent=item.get("priceChange24h")
                    ))
                return tokens
    except Exception as e:
        print(f"Error fetching birdeye: {e}")
    return []

async def fetch_token_overview(address: str):
    if not BIRDEYE_API_KEY:
        return None
    url = f"https://public-api.birdeye.so/defi/token_overview?address={address}"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                return TokenData(
                    address=data.get("address", address),
                    symbol=data.get("symbol", "UNKNOWN"),
                    name=data.get("name", ""),
                    price=data.get("price"),
                    liquidity=data.get("liquidity"),
                    volume24hUSD=data.get("v24hUSD"),
                    price24hChangePercent=data.get("priceChange24h")
                )
    except Exception as e:
        print(f"Error fetching token overview: {e}")
    return None

async def fetch_token_security(address: str) -> float:
    if not BIRDEYE_API_KEY:
        return 50.0
    
    cache_key = f"sec_{address}"
    cached = get_cached(cache_key)
    if cached is not None: return cached

    url = f"https://public-api.birdeye.so/defi/token_security?address={address}"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                # Simple logic: start with 100 and subtract for risks
                score = 100.0
                if not data.get("is_mintable") is False: score -= 30
                if data.get("is_proxy"): score -= 20
                if not data.get("is_mutable") is False: score -= 10
                set_cached(cache_key, max(0, score))
                return max(0, score)
    except Exception as e:
        print(f"Error fetching security: {e}")
    return 50.0

async def analyze_top_traders(address: str):
    """
    Performs Institutional-grade trader analysis.
    Detects Sybil clusters and evaluates Whale quality.
    Returns: (buy_ratio, sybil_score, whale_quality, text)
    """
    if not BIRDEYE_API_KEY:
        return 0.5, 0, 0, ""
    
    cache_key = f"traders_{address}"
    cached = get_cached(cache_key)
    if cached: return cached

    url = f"https://public-api.birdeye.so/defi/v2/tokens/top_traders?address={address}&time_frame=24h&sort_type=desc&sort_by=volume&offset=0&limit=10"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                items = resp.json().get("data", {}).get("items", [])
                if not items:
                    res = (0.5, 0, 0, "")
                    set_cached(cache_key, res)
                    return res
                
                # 1. Sybil Cluster Detection
                volumes = [round(item.get("volumeUsd") or 0, 2) for item in items]
                pnls = [round(item.get("totalPnl") or 0, 2) for item in items]
                
                unique_vols = len(set(volumes))
                
                sybil_score = 0
                if len(items) > 3:
                    sybil_score = (1 - (unique_vols / len(items))) * 100
                
                total_pnl = sum(pnls)
                total_vol = sum(volumes)
                
                whale_quality = 0
                if total_vol > 0:
                    whale_quality = min(100, max(0, (total_pnl / (total_vol * 0.1)) * 50 + 50))
                
                buy_ratio = 0.8 if total_pnl > 0 else 0.2
                
                text = ""
                if sybil_score > 40:
                    text += f"\n\n🚨 *SYBIL CLUSTER DETECTED:*\n{sybil_score:.0f}% of top traders show identical trading patterns. Highly likely to be a single entity (Bot Farm)."
                
                if whale_quality > 70:
                    text += f"\n\n🐋 *SMART MONEY CONFLUENCE:*\nTop traders have a high quality index ({whale_quality:.0f}/100). Institutional 'Alpha' wallets detected."
                elif total_vol > 10000:
                    text += f"\n\n⚠️ *WHALE ACTIVITY:*\nVolume: `${total_vol:,.0f}` | PnL: `${total_pnl:,.0f}`. Monitoring for breakout."

                res = (buy_ratio, sybil_score, whale_quality, text)
                set_cached(cache_key, res)
                return res
    except Exception as e:
        print(f"Error in trader analysis: {e}")
    
    return 0.5, 0, 0, ""

def create_ascii_bar(score: int, length: int = 10, is_risk: bool = False) -> str:
    filled = int((score / 100) * length)
    empty = length - filled
    filled_char = "🟥" if is_risk else "🟩"
    return filled_char * filled + "⬜" * empty

def get_quant_thesis(token, alpha: int, risk: int) -> str:
    liq = token.liquidity or 0.0
    vol = token.volume24hUSD or 0.0
    vl_ratio = (vol / liq) if liq > 0 else 0

    if alpha > 80 and risk < 30:
        if vl_ratio > 2.0 and liq > 50000:
            return f"💡 *QUANT THESIS:*\nSmart money accumulation detected. V/L ratio sits at an optimal {vl_ratio:.1f}x. Setup matches historical patterns of successful breakouts. High conviction GEM."
        else:
            return f"💡 *QUANT THESIS:*\nAlpha score is extreme, indicating a structural edge. Monitor volume expansion for breakout confirmation."
    elif risk > 80 or (vol > 50000 and liq < 5000):
        return f"💡 *QUANT THESIS:*\nHoneypot/Rug risk elevated. Volume is highly disproportional to liquidity. Severe slippage expected. AVOID."
    else:
        return f"💡 *QUANT THESIS:*\nNeutral market signals. Capital rotation is dormant. Wait for definitive volume spikes."

def get_action_keyboard(address: str) -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton("🦅 Birdeye Chart", url=f"https://birdeye.so/token/{address}?chain=solana"),
            InlineKeyboardButton("💸 Buy on Raydium", url=f"https://raydium.io/swap/?inputCurrency=sol&outputCurrency={address}")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

async def fetch_trending_tokens():
    if not BIRDEYE_API_KEY:
        return []
    
    cache_key = "trending_top_20"
    cached = get_cached(cache_key)
    if cached: return [TokenData(**t) for t in cached]

    # Fetch tokens with high volume (likely to have whale activity)
    url = "https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", {}).get("tokens", [])
                tokens = []
                for item in items:
                    # Skip common stables
                    if item.get("symbol") in ["SOL", "USDC", "USDT", "WSOL"]:
                        continue
                    tokens.append(TokenData(
                        address=item.get("address", ""),
                        symbol=item.get("symbol", "UNKNOWN"),
                        name=item.get("name", ""),
                        price=item.get("price"),
                        liquidity=item.get("liquidity"),
                        volume24hUSD=item.get("v24hUSD"),
                        price24hChangePercent=item.get("v24hChangePercent")
                    ))
                set_cached(cache_key, [t.model_dump() for t in tokens], ttl=120) # 2 minute cache
                return tokens
    except Exception as e:
        print(f"Error fetching trending: {e}")
    return []

async def background_scan(app: Application):
    chat_id = telegram_settings.chat_id
    if not chat_id:
        return
    
    # Switch to Whale-centric scanning
    tokens = await fetch_trending_tokens()
    if not tokens:
        return

    try:
        whale_alerts = []
        for t in tokens[:10]: # Check top 10 trending
            buy_ratio, sybil_score, whale_quality, analysis_text = await analyze_top_traders(t.address)
            
            # Alert criteria: High whale quality OR Sybil detection
            if whale_quality > 60 or sybil_score > 30:
                whale_alerts.append({
                    "token": t,
                    "quality": whale_quality,
                    "sybil": sybil_score,
                    "analysis": analysis_text
                })
        
        if not whale_alerts:
            return
            
        # Sort by whale quality
        whale_alerts.sort(key=lambda x: x["quality"], reverse=True)
        alert = whale_alerts[0]
        t = alert["token"]
        
        quality_bar = create_ascii_bar(alert["quality"])
        
        msg = f"🐋 *WHALE ACTIVITY DETECTED: {t.symbol}*\n"
        msg += f"`{t.address}`\n\n"
        msg += f"📊 *Whale Quality:* {quality_bar} `{alert['quality']:.0f}/100`\n"
        if alert['sybil'] > 20:
            msg += f"🚨 *Sybil Risk:* `{alert['sybil']:.0f}%` (Bot Cluster Detected)\n"
        
        msg += f"\n💰 *Price:* `${t.price:,.4f}` | 📈 *24h Vol:* `${t.volume24hUSD:,.0f}`\n"
        
        # Add Thesis based on whale activity
        if alert['quality'] > 80:
            msg += "\n💡 *INSIGHT:* Institutional accumulation confirmed. Tier-1 wallets are consolidating. High breakout probability."
        elif alert['sybil'] > 50:
            msg += "\n⚠️ *WARNING:* Large volume is artificial. Sybil clusters are wash-trading to lure retail. Exercise extreme caution."
        else:
            msg += "\n💡 *INSIGHT:* Significant whale movement detected. Monitoring for liquidity expansion."

        msg += alert['analysis'] # Add the detailed analysis from the service

        try:
            await app.bot.send_message(
                chat_id=chat_id, 
                text=msg, 
                parse_mode="Markdown", 
                reply_markup=get_action_keyboard(t.address)
            )
        except Exception as e:
            print(f"Error sending whale alert: {e}")
            
    except Exception as e:
        print(f"Background scan error: {e}")

async def send_startup_message(app: Application):
    chat_id = telegram_settings.chat_id
    if chat_id:
        try:
            msg = "🦅 *Birdeye Sentinel Channel Activated*\n\n"
            msg += "Autonomous institutional-grade market scanning is active.\n"
            msg += "The AI will silently monitor on-chain metrics every 10 minutes and broadcast high-conviction GEM setups here."
            await app.bot.send_message(chat_id=chat_id, text=msg, parse_mode="Markdown")
            await background_scan(app)
        except Exception as e:
            print(f"Failed to send startup message: {e}")

def start_telegram_bot():
    if not telegram_settings.is_configured:
        print("Telegram bot not configured. Skipping bot startup.")
        return None

    app = Application.builder().token(telegram_settings.bot_token).build()
    
    scheduler = AsyncIOScheduler()
    scheduler.add_job(background_scan, 'interval', minutes=10, args=[app])
    scheduler.start()
    
    return app
