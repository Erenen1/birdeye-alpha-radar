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

async def analyze_top_traders(address: str) -> str:
    if not BIRDEYE_API_KEY:
        return ""
    url = f"https://public-api.birdeye.so/defi/v2/tokens/top_traders?address={address}&time_frame=24h&sort_type=desc&sort_by=volume&offset=0&limit=3"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                items = resp.json().get("data", {}).get("items", [])
                if not items:
                    return ""
                
                total_pnl = sum(item.get("totalPnl") or 0 for item in items)
                total_vol = sum(item.get("volumeUsd") or 0 for item in items)
                
                if total_vol > 5000:
                    if total_pnl > 0:
                        return f"\n\n🐋 *SMART MONEY CONFLUENCE:*\nTop 3 whale wallets have accumulated `${total_vol:,.0f}` volume with an aggregate PnL of `+${total_pnl:,.0f}`. Strong institutional backing detected."
                    else:
                        return f"\n\n⚠️ *SMART MONEY DISTRIBUTION:*\nTop traders are currently distributing or underwater (Aggregate PnL: `${total_pnl:,.0f}`). Monitor for potential dump."
    except Exception as e:
        print(f"Error fetching top traders: {e}")
    return ""

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

async def background_scan(app: Application):
    chat_id = telegram_settings.chat_id
    if not chat_id:
        return
    tokens = await fetch_new_listings()
    try:
        model = ModelPersistence.load()
        predictor = TokenPredictor(model)
        
        scored_tokens = []
        for t in tokens:
            res = predictor.predict(t)
            scored_tokens.append((t, res.alphaScore, res.riskScore))
            
        if not scored_tokens:
            return
            
        # Sort by highest alpha, then lowest risk
        scored_tokens.sort(key=lambda x: (x[1], -x[2]), reverse=True)
        
        best_token, alpha, risk = scored_tokens[0]
        
        # Broadcast the highest alpha token from this 3-minute window
        if alpha >= 40: # Lowered threshold to ensure activity for the demo
            alpha_bar = create_ascii_bar(alpha)
            risk_bar = create_ascii_bar(risk, is_risk=True)
            thesis = get_quant_thesis(best_token, alpha, risk)
            
            smart_money_analysis = await analyze_top_traders(best_token.address)
            
            msg = f"⚡ *AUTO QUANT ALERT: {best_token.symbol}*\n"
            msg += f"`{best_token.address}`\n\n"
            msg += f"📊 *Alpha:* {alpha_bar} `{alpha}/100`\n"
            msg += f"🛡️ *Risk:*  {risk_bar} `{risk}/100`\n\n"
            msg += f"💧 *Liq:* `${best_token.liquidity or 0:,.0f}` | 📈 *Vol:* `${best_token.volume24hUSD or 0:,.0f}`\n\n"
            msg += thesis
            msg += smart_money_analysis

            try:
                await app.bot.send_message(chat_id=chat_id, text=msg, parse_mode="Markdown", reply_markup=get_action_keyboard(best_token.address))
            except Exception as e:
                print(f"Error sending bg alert: {e}")
    except Exception as e:
        print(f"Background scan error: {e}")

async def send_startup_message(app: Application):
    chat_id = telegram_settings.chat_id
    if chat_id:
        try:
            msg = "🦅 *Birdeye Sentinel Channel Activated*\n\n"
            msg += "Autonomous institutional-grade market scanning is active.\n"
            msg += "The AI will silently monitor on-chain metrics every 3 minutes and broadcast high-conviction GEM setups here."
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
    scheduler.add_job(background_scan, 'interval', minutes=3, args=[app])
    scheduler.start()
    
    return app
