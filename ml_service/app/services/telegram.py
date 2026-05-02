"""
services/telegram.py
====================
Single Responsibility: Handles external API communication with Telegram.
"""
import requests

from app.core.config import telegram_settings
from app.core.schemas import TokenData


class TelegramAlertService:
    """Client for dispatching alerts via Telegram Bot API."""

    def __init__(self):
        self.settings = telegram_settings

    def send_alert(self, token: TokenData, label: str, confidence: float) -> None:
        """Constructs and sends a premium Markdown-formatted alert message."""
        
        if not self.settings.is_configured:
            return

        is_gem = label == "GEM"
        header = "🦅 *ALPHA SIGNAL*" if is_gem else "🚨 *RISK WARNING*"
        icon = "💎" if is_gem else "⚠️"
        
        # Create visual progress bar
        bar_len = 10
        filled = int((confidence / 100) * bar_len)
        bar = ("🟩" if is_gem else "🟥") * filled + "⬜" * (bar_len - filled)

        # AI Thesis generation
        thesis = ""
        if is_gem:
            thesis = "_AI Analysis: High-conviction setup. Smart money accumulation detected alongside healthy liquidity depth._"
        else:
            thesis = "_AI Analysis: High risk detected. Disproportionate volume/liquidity ratio suggests wash trading or impending exit._"

        # Message construction
        text = f"{header}\n\n"
        text += f"{icon} *Token:* {token.symbol} (`{token.address[:6]}...{token.address[-4:]}`)\n"
        text += f"📊 *AI Confidence:* {bar} `{confidence:.1f}%`\n"
        text += f"💧 *Liquidity:* `${token.liquidity:,.0f}`\n"
        text += f"📈 *24h Change:* `{token.price24hChangePercent:.2f}%`\n\n"
        text += f"{thesis}\n\n"
        text += f"🔗 [Trade on Birdeye](https://birdeye.so/token/{token.address}?chain=solana)"

        payload = {
            "chat_id": self.settings.chat_id,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True
        }

        try:
            requests.post(f"https://api.telegram.org/bot{self.settings.bot_token}/sendMessage", json=payload, timeout=5)
        except Exception as e:
            print(f"Telegram error: {e}")
