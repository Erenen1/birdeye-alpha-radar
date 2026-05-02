"use client";

import { TrendingUp, Copy, ExternalLink, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, shortenAddress, formatSource } from "@/lib/formatters";
import { TokenData, SignalColor } from "@/types";

// ── Color maps ────────────────────────────────────────────────────────────

const borderColors: Record<SignalColor, string> = {
  success: "border-success/30 hover:border-success/60",
  primary: "border-primary/30 hover:border-primary/60",
  danger: "border-danger/30 hover:border-danger/60",
  warning: "border-warning/30 hover:border-warning/60",
  info: "border-info/30 hover:border-info/60",
};

const badgeColors: Record<SignalColor, string> = {
  success: "bg-success/20 text-success border-success/30",
  primary: "bg-primary/20 text-primary border-primary/30",
  danger: "bg-danger/20 text-danger border-danger/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  info: "bg-info/20 text-info border-info/30",
};

const glowColors: Record<SignalColor, string> = {
  success: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  primary: "shadow-[0_0_12px_rgba(139,92,246,0.15)]",
  danger: "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  warning: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  info: "shadow-[0_0_12px_rgba(59,130,246,0.15)]",
};

// Explicit text-only map — avoids fragile string splitting from badgeColors
const signalTextColors: Record<SignalColor, string> = {
  success: "text-success",
  primary: "text-primary",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

// ── Expanded Detail Panel ─────────────────────────────────────────────────

interface ExpandedPanelProps {
  token: TokenData;
  overview?: any;
  isLoadingOverview?: boolean;
  color: SignalColor;
}

function ExpandedPanel({ token, overview, isLoadingOverview, color }: ExpandedPanelProps) {
  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className={cn(
        "p-4 sm:p-5 border border-t-0 bg-surface/20 rounded-b-lg animate-in slide-in-from-top-2 duration-200",
        borderColors[color]
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1: Core Data */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white/80 border-b border-border/50 pb-1">
            Token Information
          </h3>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Contract</span>
            <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-border">
              <span className="font-mono text-gray-300">{shortenAddress(token.address)}</span>
              <button onClick={(e) => copyToClipboard(e, token.address)} className="hover:text-white">
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(`https://solscan.io/token/${token.address}`, "_blank"); }}
                className="hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Market Cap</span>
            <span className="font-medium">{(token as any).marketcap ? formatCurrency((token as any).marketcap) : "N/A"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fully Diluted Valuation</span>
            <span className="font-medium">{(token as any).fdv ? formatCurrency((token as any).fdv) : "N/A"}</span>
          </div>
        </div>

        {/* Column 2: Deep Trading Data */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white/80 border-b border-border/50 pb-1">
            Deep Market Activity (24h)
          </h3>
          {isLoadingOverview ? (
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-surface rounded w-3/4" />
              <div className="h-4 bg-surface rounded w-1/2" />
              <div className="h-4 bg-surface rounded w-full" />
            </div>
          ) : overview ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Active Wallets
                </span>
                <span className="font-medium">{overview.uniqueWallet24h?.toLocaleString() ?? "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Holders</span>
                <span className="font-medium">{overview.holder?.toLocaleString() ?? "N/A"}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Buy Vol: {formatCurrency(overview.vBuy24hUSD)}</span>
                  <span>Sell Vol: {formatCurrency(overview.vSell24hUSD)}</span>
                </div>
                <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-surface border border-border">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${(overview.vBuy24hUSD / ((overview.vBuy24hUSD + overview.vSell24hUSD) || 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-danger/30 transition-all"
                    style={{ width: `${(overview.vSell24hUSD / ((overview.vBuy24hUSD + overview.vSell24hUSD) || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500">Advanced data unavailable.</div>
          )}
        </div>

        {/* Column 3: Actions */}
        <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`https://jup.ag/swap/SOL-${token.address}`, "_blank"); }}
            className="w-full py-2.5 bg-gradient-to-r from-success/80 to-success text-black font-bold text-xs rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
          >
            Swap on Jupiter 🪐
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`https://birdeye.so/token/${token.address}?chain=solana`, "_blank"); }}
            className="w-full py-2.5 bg-surface border border-border hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors"
          >
            Advanced Chart
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Token Table Row ────────────────────────────────────────────────────────

interface TokenTableRowProps {
  token: TokenData;
  isExpanded: boolean;
  onClick: () => void;
  overview?: any;
  isLoadingOverview?: boolean;
}

export function TokenTableRow({
  token,
  isExpanded,
  onClick,
  overview,
  isLoadingOverview,
}: TokenTableRowProps) {
  const {
    address, name, symbol, logoURI, price,
    price24hChangePercent: change,
    liquidity: liq,
    volume24hUSD: vol,
    signal = "Tracking",
    signalColor: color = "info",
  } = token;

  const isPositive = (change || 0) >= 0;

  const handleShareOnX = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🦅 I just spotted $${symbol} showing ${signal} on Birdeye Sentinel!\n\n💰 Price: ${formatCurrency(price)}\n📈 24h: ${formatPercent(change)}\n\nCheck it out here:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      {/* ── DESKTOP ROW (hidden on mobile) ── */}
      <div
        onClick={onClick}
        className={cn(
          "hidden md:grid grid-cols-10 gap-4 items-center p-3 border bg-surface/40 hover:bg-surface/80 transition-all duration-200 cursor-pointer group",
          borderColors[color],
          glowColors[color],
          isExpanded ? "rounded-t-lg border-b-0" : "rounded-lg"
        )}
      >
        {/* Token Name */}
        <div className="col-span-2 flex items-center gap-3 overflow-hidden">
          {logoURI ? (
            <img
              src={logoURI}
              alt={symbol}
              className="h-8 w-8 rounded-full flex-shrink-0 object-cover border border-border group-hover:scale-110 transition-transform"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform">
              {symbol.substring(0, 2)}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="font-semibold text-sm truncate">{name}</span>
            <span className="text-xs text-gray-400">{symbol}</span>
          </div>
        </div>

        {/* Source */}
        <div className="col-span-1">
          <span className="px-2 py-1 bg-surface/80 border border-border rounded text-[10px] text-gray-300">
            {formatSource((token as any).source)}
          </span>
        </div>

        {/* Price */}
        <div className="col-span-1 text-right text-sm">{formatCurrency(price)}</div>

        {/* 24h % */}
        <div className={cn("col-span-1 text-right text-sm", isPositive ? "text-success" : "text-danger")}>
          {formatPercent(change)}
        </div>

        {/* Liquidity */}
        <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(liq)}</div>

        {/* Volume */}
        <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(vol)}</div>

        {/* AI Score Bar */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-1">
          <div className="flex w-full items-center justify-between px-2 text-[10px] font-bold">
            <span
              className={cn(
                (token.alphaScore || 0) >= 80 ? "text-success" :
                (token.alphaScore || 0) < 40 ? "text-danger" : "text-warning"
              )}
            >
              {token.verdict || "Neutral"}
            </span>
            <div className="flex gap-2 items-center">
              <span className="text-white/60 text-[8px]">Alpha: {token.alphaScore ?? 0}</span>
              <span className="text-white/60 text-[8px]">Risk: {token.riskScore ?? 0}</span>
            </div>
          </div>
          <div className="h-1.5 w-[90%] bg-surface rounded-full overflow-hidden flex">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                (token.alphaScore || 0) >= 80 ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                (token.alphaScore || 0) < 40 ? "bg-danger" : "bg-warning"
              )}
              style={{ width: `${Math.min(100, token.alphaScore ?? 0)}%` }}
            />
            <div
              className="h-full bg-danger/30 transition-all duration-1000"
              style={{ width: `${Math.min(100, token.riskScore ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-center gap-1 group/actions relative">
          <div className="flex items-center gap-1 group-hover:opacity-0 transition-opacity">
            <span className={cn("px-2 py-0.5 rounded text-[10px] border whitespace-nowrap", badgeColors[color])}>
              {signal}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
            <button
              onClick={handleShareOnX}
              className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-white"
              title="Share on X"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`https://birdeye.so/token/${address}?chain=solana`, "_blank"); }}
              className="p-1.5 rounded-md bg-primary/20 hover:bg-primary/40 border border-primary/30 transition-colors text-primary"
              title="Trade"
            >
              <TrendingUp className="h-3 w-3" />
            </button>
            <button className="p-1.5 rounded-md bg-surface border border-border hover:bg-gray-700 transition-colors">
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE CARD (hidden on desktop) ── */}
      <div
        onClick={onClick}
        className={cn(
          "md:hidden flex flex-col border bg-surface/40 hover:bg-surface/70 transition-all duration-200 cursor-pointer",
          borderColors[color],
          glowColors[color],
          isExpanded ? "rounded-t-lg border-b-0" : "rounded-lg"
        )}
      >
        {/* Card Top Row */}
        <div className="flex items-center justify-between p-3 pb-2">
          <div className="flex items-center gap-2.5">
            {logoURI ? (
              <img
                src={logoURI}
                alt={symbol}
                className="h-9 w-9 rounded-full flex-shrink-0 object-cover border border-border"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-[11px] font-bold">
                {symbol.substring(0, 2)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">{name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400">{symbol}</span>
                <span className="px-1.5 py-0.5 bg-surface/80 border border-border rounded text-[9px] text-gray-400">
                  {formatSource((token as any).source)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-sm">{formatCurrency(price)}</span>
            <span className={cn("text-xs font-semibold", isPositive ? "text-success" : "text-danger")}>
              {formatPercent(change)}
            </span>
          </div>
        </div>

        {/* Card Stats Row */}
        <div className="grid grid-cols-3 border-t border-border/40 mx-3 pt-2.5 pb-2">
          <div className="flex flex-col items-center gap-0.5 border-r border-border/30">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Liquidity</span>
            <span className="text-xs font-semibold text-gray-200">{formatCurrency(liq)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border-r border-border/30">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Vol 24h</span>
            <span className="text-xs font-semibold text-gray-200">{formatCurrency(vol)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">AI Verdict</span>
            <span className={cn("text-[10px] font-bold", signalTextColors[color])}>
              {token.verdict || "Neutral"}
            </span>
          </div>
        </div>

        {/* AI Score Bar */}
        <div className="px-3 pb-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px] text-gray-500">
            <span>Alpha: <span className={cn("font-bold", signalTextColors[color])}>{token.alphaScore ?? 0}</span></span>
            <span>Risk: <span className="text-danger font-bold">{token.riskScore ?? 0}</span></span>
          </div>
          <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden flex">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                (token.alphaScore || 0) >= 80 ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                (token.alphaScore || 0) < 40 ? "bg-danger" : "bg-warning"
              )}
              style={{ width: `${Math.min(100, token.alphaScore ?? 0)}%` }}
            />
            <div
              className="h-full bg-danger/40 transition-all duration-1000"
              style={{ width: `${Math.min(100, token.riskScore ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Card Bottom: Signal Badge + Actions */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-border/30 mt-1">
          <span className={cn("px-2 py-1 rounded text-[10px] border font-medium", badgeColors[color])}>
            {signal}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareOnX}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-white"
              title="Share on X"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`https://birdeye.so/token/${address}?chain=solana`, "_blank"); }}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 border border-primary/30 transition-colors text-primary"
              title="Chart"
            >
              <TrendingUp className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`https://jup.ag/swap/SOL-${address}`, "_blank"); }}
              className="px-3 py-1.5 rounded-lg bg-success/20 hover:bg-success/30 border border-success/30 text-success text-[10px] font-bold transition-colors"
            >
              Swap 🪐
            </button>
            <button className="p-2 rounded-lg bg-surface border border-border hover:bg-gray-700 transition-colors">
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <ExpandedPanel
          token={token}
          overview={overview}
          isLoadingOverview={isLoadingOverview}
          color={color}
        />
      )}
    </>
  );
}
