/**
 * services/birdeye/client.ts
 * ==========================
 * Core Birdeye API client. SERVER-SIDE ONLY — API key is never exposed to the browser.
 * Import these functions only from Next.js API routes or Server Components.
 */
import { BirdeyeResponse, TrendingToken, NewListingToken, TokenSecurity } from "@/types";
import { BIRDEYE_BASE_URL, BIRDEYE_CHAIN } from "@/lib/constants";

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds (Optimization)

async function fetchBirdeye<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    throw new Error("BIRDEYE_API_KEY is not defined in .env file");
  }

  const url = `${BIRDEYE_BASE_URL}${endpoint}`;
  
  // Check cache
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const headers = {
    "X-API-KEY": apiKey,
    "x-chain": BIRDEYE_CHAIN,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store", // We use our own memory cache
  });

  if (!response.ok) {
    throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Save to cache
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

export async function getTrendingTokens(): Promise<TrendingToken[]> {
  try {
    const response = await fetchBirdeye<BirdeyeResponse<{ tokens: TrendingToken[] }>>(
      "/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20"
    );
    return response.data?.tokens || [];
  } catch (e) {
    console.error("Trending fetch failed, falling back to Whale Watch proxy:", e);
    try {
      // Fallback: try to get data from our own backend which seems to have a more stable connection/limit
      const res = await fetch("http://ml_service:8000/whale-watch");
      const json = await res.json();
      if (json.success) return json.data;
    } catch (fallbackError) {
      console.error("All trending fallbacks failed:", fallbackError);
    }
    return [];
  }
}

export async function getNewListings(): Promise<NewListingToken[]> {
  try {
    const response = await fetchBirdeye<BirdeyeResponse<{ items: NewListingToken[] }>>(
      "/defi/v2/tokens/new_listing?limit=20"
    );
    return response.data?.items || [];
  } catch (e) {
    console.error("New listings fetch failed:", e);
    return [];
  }
}

export async function getTokenOverview(address: string): Promise<any> {
  const response = await fetchBirdeye<BirdeyeResponse<any>>(`/defi/token_overview?address=${address}`);
  return response.data || null;
}

export async function getTokenSecurity(address: string): Promise<TokenSecurity> {
  const response = await fetchBirdeye<BirdeyeResponse<TokenSecurity>>(`/defi/token_security?address=${address}`);
  return response.data;
}
