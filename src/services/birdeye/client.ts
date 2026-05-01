/**
 * services/birdeye/client.ts
 * ==========================
 * Core Birdeye API client. SERVER-SIDE ONLY — API key is never exposed to the browser.
 * Import these functions only from Next.js API routes or Server Components.
 */
import { BirdeyeResponse, TrendingToken, NewListingToken, TokenSecurity } from "@/types";
import { BIRDEYE_BASE_URL, BIRDEYE_CHAIN } from "@/lib/constants";

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

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
  const response = await fetchBirdeye<BirdeyeResponse<{ items: TrendingToken[] }>>("/defi/token_trending");
  console.log("RAW BIRDEYE RESPONSE:", JSON.stringify(response).substring(0, 200));
  return response.data?.items || (response.data as any)?.tokens || [];
}

export async function getNewListings(): Promise<NewListingToken[]> {
  const response = await fetchBirdeye<BirdeyeResponse<{ items: NewListingToken[] }>>(
    "/defi/v2/tokens/new_listing?limit=20"
  );
  return response.data?.items || [];
}

export async function getTokenOverview(address: string): Promise<any> {
  const response = await fetchBirdeye<BirdeyeResponse<any>>(`/defi/token_overview?address=${address}`);
  return response.data || null;
}

export async function getTokenSecurity(address: string): Promise<TokenSecurity> {
  const response = await fetchBirdeye<BirdeyeResponse<TokenSecurity>>(`/defi/token_security?address=${address}`);
  return response.data;
}
