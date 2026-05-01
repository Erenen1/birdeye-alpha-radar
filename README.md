<div align="center">
  <img src="https://birdeye.so/birdeye-logo.svg" alt="Birdeye Logo" width="100"/>
  <h1>🦅 Birdeye Sentinel</h1>
  <p><strong>The Autonomous Institutional-Grade Market Intelligence Agent for Solana</strong></p>
  <p><i>Built for the Birdeye Data 4-Week BIP Competition (Sprint 1)</i></p>
</div>

<br/>

## 🎯 The Vision: From Data to Actionable Alpha

In the hyper-fast environment of the Solana ecosystem, finding "Gems" early is mathematically impossible for humans manually refreshing dashboards. **We built Birdeye Sentinel to automate the "Aha!" moment.**

Instead of just building another charting website, we engineered a **Dual-Node Architecture**:
1. A blazing-fast **Next.js Radar Dashboard** for real-time market overview.
2. A **Python-based ML Microservice (FastAPI)** that runs an autonomous background job, analyzing the Birdeye API every 3 minutes. When it detects an anomaly (High Alpha, Low Risk, and Whale Accumulation), it broadcasts an institutional-grade alert directly to a Telegram Channel.

---

## ✨ Key Features & The "WOW" Factor

### 🧠 1. Smart Money Confluence (Top Traders Integration)
Volume alone is deceptive. Our AI doesn't just look at total volume; it leverages Birdeye's **Top Traders API** to cross-reference the top 3 whale wallets. If a token has a high ML Alpha Score AND the top whales are in profit while accumulating, the bot flags it as a `SMART MONEY CONFLUENCE`.

### 📊 2. Autonomous Telegram Broadcaster
We removed the human element. The bot operates as a silent channel administrator. It queries Birdeye every 3 minutes, processes the data through a Random Forest Classifier, and formats a stunning Markdown alert complete with **ASCII visualization bars** and **Inline Interactive Keyboards** (Direct links to Birdeye Charts and Raydium).

### ⚡ 3. Intelligent In-Memory Caching
To prevent `429 Too Many Requests` limits on the Birdeye free tier, our Next.js backend utilizes a strict 30-second global memory cache. Both SSR and Client-side requests are merged, ensuring optimal API utilization.

---

## 🛠 Birdeye Endpoints Utilized
We extensively explored the Birdeye Data ecosystem to power this project:
- `GET /defi/v2/tokens/new_listing` - To fuel the background ML anomaly detection.
- `GET /defi/v2/tokens/top_traders` - To generate the Smart Money Confluence analysis.
- `GET /defi/token_overview` - For deep, on-demand token health checks.
- `GET /defi/token_trending` - To populate the Next.js Radar Dashboard.

---

## 🏗 System Architecture

```mermaid
graph TD
    subgraph Birdeye Data Ecosystem
        B_API[Birdeye Public API]
    end

    subgraph Frontend Node (Next.js 14)
        UI[Radar Dashboard UI]
        API_Routes[Next.js API Routes]
        Cache[30s Memory Cache]
        
        UI <--> API_Routes
        API_Routes <--> Cache
        Cache <-->|REST| B_API
    end

    subgraph ML Microservice (FastAPI / Python)
        Cron[AsyncIOScheduler\n(Runs every 3m)]
        Model[Scikit-Learn\nRandom Forest Classifier]
        TG[Telegram Bot App]
        
        Cron -->|Fetch Listings| B_API
        Cron -->|Fetch Top Traders| B_API
        Cron --> Model
        Model -->|Alpha > 70 & Risk < 40| TG
    end

    subgraph End User
        Trader((Crypto Trader))
        Trader <-->|Views| UI
        TG -->|Broadcasts GEM Alerts| Trader
    end
```

---

## 🚀 Quick Start (Dockerized)

We ensured that the judges can run our entire complex architecture with a single command. 

### Prerequisites
- Docker & Docker Compose installed.
- A Birdeye API Key.
- A Telegram Bot Token & Channel ID.

### Setup
1. Clone the repository.
2. Configure your `.env` file at the root:
```env
BIRDEYE_API_KEY=your_api_key_here
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=@your_channel_username
```
3. Run the stack:
```bash
docker compose up --build -d
```

### What Happens Next?
- **Frontend:** Available at `http://localhost:3000`. You will see the beautiful, real-time Token Radar.
- **Backend ML:** The Python server boots on `http://localhost:8000`.
- **Telegram Agent:** The bot immediately sends an initialization message to your channel and begins its silent 3-minute monitoring loops.

---

## 🏆 Hackathon Alignment
This project aligns perfectly with **Sprint 1: Technical Depth & Product Utility**. By decoupling the frontend from the AI logic using Docker, handling rate-limits professionally, and combining multiple Birdeye APIs to create an institutional quant narrative, **Birdeye Sentinel** represents the true next wave of on-chain trading agents.
