/**
 * lib/constants.ts
 * ================
 * Application-wide constants. Single source of truth for magic numbers,
 * URLs, and configuration values used across the Next.js app.
 */

// ── External URLs ──────────────────────────────────────────────────────────
export const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";
export const BIRDEYE_CHAIN = "solana";

// ── Internal API Routes ────────────────────────────────────────────────────
export const API_ROUTES = {
  TRENDING: "/api/birdeye/trending",
  NEW_LISTINGS: "/api/birdeye/new_listings",
  OVERVIEW: "/api/birdeye/overview",
  PREDICT: "/api/predict",
  TELEGRAM_ALERT: "/api/telegram/alert",
} as const;

// ── ML / Alert Thresholds ──────────────────────────────────────────────────
export const ALERT_THRESHOLDS = {
  GEM_MIN_ALPHA: 85,
  GEM_MAX_RISK: 20,
  RUG_MIN_RISK: 80,
  RUG_MAX_ALPHA: 30,
} as const;

// ── Dashboard Defaults ─────────────────────────────────────────────────────
export const DEFAULT_SORT_KEY = "alphaScore";
export const DEFAULT_SORT_DIRECTION = "desc";

export const QUICK_FILTER_DEFAULTS = {
  MIN_LIQUIDITY: 100_000,
  MIN_VOLUME: 50_000,
} as const;

// ── Mock / Display Data ────────────────────────────────────────────────────
export const MOCK_SOL_PRICE = "$142.50";
export const MOCK_SOL_CHANGE = "+2.4%";
export const MOCK_SOL_TPS = "2,450 TPS";
