
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BIRDEYE_API_KEY = os.getenv("BIRDEYE_API_KEY")

async def test_trending():
    # Trying the official trending endpoint with parameters
    url = "https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc"
    headers = {"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_trending())
