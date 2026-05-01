import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token, type, alphaScore, riskScore } = await req.json();
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Hackathon Fallback: If not configured, just return success so UI doesn't crash
    if (!BOT_TOKEN || !CHAT_ID) {
      console.warn("Telegram env vars missing. Simulating success for Hackathon demo.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const title = type === 'GEM' ? "🦅 SYCON ALPHA SIGNAL 🦅" : "🚨 SYCON RUG WARNING 🚨";
    const icon = type === 'GEM' ? "💎" : "⚠️";
    const actionText = type === 'GEM' ? "Trade Now" : "Review Assets";
    
    const message = `
${title}
${icon} *Token*: $${token.symbol}
📊 *Alpha Score*: ${alphaScore}/100
🛡️ *Risk Score*: ${riskScore}/100
💧 *Liquidity*: $${Math.round(token.liquidity || 0).toLocaleString()}

[${actionText} on Birdeye](https://birdeye.so/token/${token.address}?chain=solana)
    `.trim();

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });

    return NextResponse.json({ success: res.ok });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
