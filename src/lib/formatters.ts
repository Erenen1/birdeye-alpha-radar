/**
 * lib/formatters.ts
 * =================
 * Pure utility functions for formatting values in the UI.
 * No framework dependencies — safe to use in both Server and Client components.
 */

/** Formats a dollar amount with K/M suffix and appropriate decimal places. */
export function formatCurrency(val?: number): string {
  if (val === undefined || val === null) return "$0.00";
  if (val < 0.01 && val > 0) return "$" + val.toFixed(6);
  if (val > 1_000_000) return "$" + (val / 1_000_000).toFixed(2) + "M";
  if (val > 1_000) return "$" + (val / 1_000).toFixed(2) + "K";
  return "$" + val.toFixed(2);
}

/** Formats a percentage value with a leading sign. */
export function formatPercent(val?: number): string {
  if (val === undefined || val === null) return "0.00%";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

/** Shortens a token contract address for display. */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Returns the source label for a token (from Birdeye source field). */
export function formatSource(source?: string): string {
  if (!source) return "Birdeye";
  return source.split("_")[0];
}
