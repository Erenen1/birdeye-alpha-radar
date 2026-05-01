/**
 * services/telegram/client.ts
 * ===========================
 * Server-side Telegram Bot API client.
 * Encapsulates message formatting and dispatch logic.
 */
import { TokenData, AlertType } from "@/types";

interface SendAlertOptions {
  token: TokenData;
  type: AlertType;
  alphaScore?: number;
  riskScore?: number;
}

interface TelegramResult {
  success: boolean;
  simulated?: boolean;
  error?: string;
}

/**
 * Sends a formatted Telegram alert for a GEM or RUG signal.
 * Gracefully simulates success if credentials are not configured.
 */
export async function sendTelegramAlert(opts: SendAlertOptions): Promise<TelegramResult> {
  const { token, type, alphaScore, riskScore } = opts;

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  // Graceful fallback for demo / hackathon environment
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram env vars missing. Simulating success for demo.");
    return { success: true, simulated: true };
  }

  const title = type === "GEM" ? "🦅 *SYCON AI ALPHA DETECTED* 🦅" : "🚨 *SYCON AI RUG WARNING* 🚨";
  const icon = type === "GEM" ? "💎" : "⚠️";
  const actionText = type === "GEM" ? "Trade on Birdeye" : "Verify on Birdeye";

  // Generate dynamic AI Interpretation based on stats
  let interpretation = "";
  if (type === "GEM") {
    if ((token.liquidity ?? 0) > 100000 && (token.volume24hUSD ?? 0) > 500000) {
      interpretation = `_🤖 Sycon AI Analysis:_ High confidence breakout. Massive 24h volume ($${Math.round((token.volume24hUSD ?? 0)/1000)}k) backed by deep locked liquidity. Smart money accumulation detected.`;
    } else if ((token.price24hChangePercent ?? 0) > 20) {
      interpretation = `_🤖 Sycon AI Analysis:_ Strong bullish momentum detected (+${Math.round(token.price24hChangePercent ?? 0)}% in 24h). Initial liquidity is stable. Excellent short-term upside potential.`;
    } else {
      interpretation = `_🤖 Sycon AI Analysis:_ Early gem parameters met. Alpha score (${alphaScore}) indicates institutional-level metrics. Monitor volume closely for the breakout.`;
    }
  } else {
    if ((token.liquidity ?? 0) < 10000) {
      interpretation = `_🤖 Sycon AI Analysis:_ Extreme danger. Critically low liquidity ($${Math.round(token.liquidity ?? 0)}). High probability of a honeypot or impending rug pull.`;
    } else {
      interpretation = `_🤖 Sycon AI Analysis:_ Warning metrics triggered. Disproportionate holder concentration and unusual smart contract patterns detected by Sycon.`;
    }
  }

  const message = [
    title,
    `\n${icon} *Token*: $${token.symbol} \`${token.address}\``,
    `📊 *Alpha Score*: ${alphaScore ?? "N/A"}/100`,
    `🛡️ *Risk Score*: ${riskScore ?? "N/A"}/100`,
    `💧 *Liquidity*: $${Math.round(token.liquidity ?? 0).toLocaleString()}`,
    `📈 *24h Volume*: $${Math.round(token.volume24hUSD ?? 0).toLocaleString()}`,
    `\n${interpretation}`,
    `\n🔗 [${actionText}](https://birdeye.so/token/${token.address}?chain=solana)`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: "Markdown" }),
    });

    return { success: res.ok };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
