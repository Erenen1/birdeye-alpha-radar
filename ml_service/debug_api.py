
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BIRDEYE_API_KEY = os.getenv("BIRDEYE_API_KEY")

async def test_token_trades():
    # Codex token address (from screenshot or simulated)
    address = "So11111111111111111111111111111111111111112" # SOL for testing
    url = f"https://public-api.birdeye.so/defi/txs/token?address={address}&offset=0&limit=10"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("data", {}).get("items", [])
            print(f"Trades count: {len(items)}")
            for i, tx in enumerate(items[:3]):
                print(f"Tx {i}: {tx.get('side')} - Vol: {tx.get('volume_usd')} - Time: {tx.get('block_unix_time')}")
        else:
            print(f"Error: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_token_trades())
