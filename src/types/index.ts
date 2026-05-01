/**
 * types/index.ts
 * ==============
 * Global TypeScript type definitions for the entire Next.js application.
 * Import from here instead of from individual service/component files.
 */

// ── Birdeye API Types ──────────────────────────────────────────────────────

export interface BirdeyeResponse<T> {
  success: boolean;
  data: T;
}

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume24hUSD: number;
  volume24hChangePercent?: number;
  price24hChangePercent: number;
  logoURI?: string;
  marketcap?: number;
  fdv?: number;
  rank?: number;
}

export interface NewListingToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume24hUSD: number;
  price24hChangePercent: number;
  listingTime?: string;
  liquidityAddedAt?: string;
  source?: string;
  logoURI?: string;
}

export interface TokenSecurity {
  address: string;
  isMintable: boolean;
  isMutable: boolean;
  top10HolderPercent: number;
  lockedLiquidityPercent: number;
  ownerBalance: number;
  creatorBalance: number;
}

// ── ML Service Types ───────────────────────────────────────────────────────

export interface MLPredictionResult {
  address: string;
  verdict: "GEM" | "RUG" | "NEUTRAL";
  alphaScore: number;
  riskScore: number;
  confidence: number;
}

// ── Dashboard / UI Types ───────────────────────────────────────────────────

export type SignalColor = "success" | "primary" | "danger" | "warning" | "info";

/** Combined token type used throughout the dashboard (raw data + ML overlay) */
export type TokenData = (TrendingToken | NewListingToken) & {
  signal?: string;
  signalColor?: SignalColor;
  alphaScore?: number;
  verdict?: string;
  riskScore?: number;
};

export type SortKey = "price" | "price24hChangePercent" | "liquidity" | "volume24hUSD" | "alphaScore";
export type SortDirection = "asc" | "desc";

export interface LiveSignal {
  id: string;
  address: string;
  signal: string;
  desc: string;
  time: string;
  color: "success" | "danger" | "info" | "warning";
}

// ── Telegram Types ─────────────────────────────────────────────────────────

export type AlertType = "GEM" | "RUG";

export interface TelegramAlertPayload {
  token: TokenData;
  type: AlertType;
  alphaScore?: number;
  riskScore?: number;
}
