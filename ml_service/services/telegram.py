"""
services/telegram.py
====================
Single Responsibility: Handles external API communication with Telegram.
"""
import requests

from core.config import telegram_settings
from core.schemas import TokenData


class TelegramAlertService:
    """Client for dispatching alerts via Telegram Bot API."""

    def __init__(self):
        self.settings = telegram_settings

    def send_alert(self, token: TokenData, label: str, confidence: float) -> None:
        """Constructs and sends a Markdown-formatted alert message."""
        
        # Guard clause: gracefully mock if not configured
        if not self.settings.is_configured:
            print(f"[SIMULATED TELEGRAM ALERT] {label}: ${token.symbol} (Confidence: {confidence:.1f}%)")
            return

        icon = "💎 GEM ALERT" if label == "GEM" else "🚨 RUG WARNING"
        url  = f"https://api.telegram.org/bot{self.settings.bot_token}/sendMessage"

        # Message construction
        text  = f"🦅 *SYCON ALPHA SIGNAL*\n\n{icon}\n"
        text += f"*Token:* ${token.symbol}"
        if token.name:
            text += f" ({token.name})"
        text += f"\n*AI Confidence:* {confidence:.1f}%\n"
        text += f"*Liquidity:* ${token.liquidity:,.0f}\n"
        text += f"*24h Change:* {token.price24hChangePercent:.2f}%\n\n"
        text += f"[Trade on Birdeye](https://birdeye.so/token/{token.address}?chain=solana)"

        payload = {
            "chat_id": self.settings.chat_id,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False
        }

        # Dispatch
        try:
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                print(f"Telegram alert sent for {label}: ${token.symbol}")
            else:
                print(f"Telegram API returned {resp.status_code}: {resp.text}")
        except requests.exceptions.Timeout:
            print(f"Telegram request timed out for ${token.symbol}")
        except Exception as e:
            print(f"Telegram error: {e}")
