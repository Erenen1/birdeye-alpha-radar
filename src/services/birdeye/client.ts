import { BirdeyeResponse, TrendingToken, NewListingToken, TokenSecurity } from "./types";

const BIRDEYE_API_URL = "https://public-api.birdeye.so";

/**
 * Birdeye API'sine istek atmak için çekirdek fonksiyon.
 * API anahtarı güvenliği için sadece SERVER tarafında çalıştırılmalıdır.
 */
async function fetchBirdeye<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    throw new Error("BIRDEYE_API_KEY is not defined in .env file");
  }

  const url = `${BIRDEYE_API_URL}${endpoint}`;
  
  const headers = {
    "X-API-KEY": apiKey,
    "x-chain": "solana", // Hackathon Solana üzerine odaklanıyor
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { 
    ...options, 
    headers,
    cache: 'no-store' // Canlı veri için Next.js cache'ini iptal ediyoruz
  });

  if (!response.ok) {
    throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Trend olan tokenları getirir
 */
export async function getTrendingTokens(): Promise<TrendingToken[]> {
  // Hackathon endpoint örneği: /defi/token_trending
  const response = await fetchBirdeye<BirdeyeResponse<{ items: TrendingToken[] }>>("/defi/token_trending");
  console.log("RAW BIRDEYE RESPONSE:", JSON.stringify(response).substring(0, 200));
  return response.data?.items || response.data?.tokens || [];
}

/**
 * Yeni listelenen tokenları getirir
 */
export async function getNewListings(): Promise<NewListingToken[]> {
  // Hackathon endpoint örneği: /defi/v2/tokens/new_listing
  const response = await fetchBirdeye<BirdeyeResponse<{ items: NewListingToken[] }>>("/defi/v2/tokens/new_listing?limit=20");
  return response.data?.items || [];
}

/**
 * Token Detaylarını Getirir (Overview)
 * Hackathon Puanı İçin: Buy/Sell ratio, holders, unique wallets gibi derin verileri çeker.
 */
export async function getTokenOverview(address: string): Promise<any> {
  const response = await fetchBirdeye<BirdeyeResponse<any>>(`/defi/token_overview?address=${address}`);
  return response.data || null;
}

/**
 * Belirli bir token'ın güvenlik bilgilerini getirir (Risk hesaplaması için)
 */
export async function getTokenSecurity(address: string): Promise<TokenSecurity> {
  // Hackathon endpoint örneği: /defi/token_security
  const response = await fetchBirdeye<BirdeyeResponse<TokenSecurity>>(`/defi/token_security?address=${address}`);
  return response.data;
}
