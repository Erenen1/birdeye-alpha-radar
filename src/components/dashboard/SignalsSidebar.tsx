"use client";

import { useState, useEffect } from "react";
import { Activity, ExternalLink, Bell, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveSignal } from "@/types";
import { API_ROUTES } from "@/lib/constants";

interface SignalItemProps {
  signal: LiveSignal;
  onClick: () => void;
}

const iconColors: Record<string, string> = {
  success: "text-success bg-success/10 border-success/20",
  danger: "text-danger bg-danger/10 border-danger/20",
  info: "text-info bg-info/10 border-info/20",
  warning: "text-warning bg-warning/10 border-warning/20",
};

const textColors: Record<string, string> = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

const glowColors: Record<string, string> = {
  success: "shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  danger: "shadow-[0_0_10px_rgba(239,68,68,0.15)]",
  info: "shadow-[0_0_10px_rgba(59,130,246,0.15)]",
  warning: "shadow-[0_0_10px_rgba(245,158,11,0.15)]",
};

export function SignalItem({ signal: sig, onClick }: SignalItemProps) {
  const colorKey = sig.color || "info";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex gap-3 pb-4 border-b border-border/50 last:border-0 group cursor-pointer hover:bg-white/[0.03] p-2 -mx-2 rounded-lg transition-all duration-200",
        glowColors[colorKey]
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110",
          iconColors[colorKey]
        )}
      >
        <Activity className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("text-xs font-bold tracking-wide truncate", textColors[colorKey])}>
            {sig.signal}
          </span>
          <ExternalLink className="h-3 w-3 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">{sig.desc}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{sig.time}</span>
          <span className="text-[9px] text-gray-600">• tap to analyze</span>
        </div>
      </div>
    </div>
  );
}

interface WhaleTrade {
  id: string;
  symbol: string;
  address: string;
  amount: number;
  type: "BUY" | "SELL";
  isSmart: boolean;
  time: string;
}

function WhaleItem({ trade }: { trade: WhaleTrade }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 group">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
          trade.type === "BUY" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
        )}>
          {trade.symbol?.[0] || "?"}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-200 truncate">{trade.symbol}</span>
            {trade.isSmart && (
              <Activity className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>
          <span className="text-[9px] text-gray-500 font-mono truncate">{trade.address.slice(0, 4)}...{trade.address.slice(-4)}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={cn(
          "text-xs font-mono font-medium flex items-center justify-end gap-1",
          trade.type === "BUY" ? "text-success" : "text-danger"
        )}>
          {trade.type === "BUY" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3 rotate-180" />
          )}
          ${trade.amount > 1000 ? `${(trade.amount / 1000).toFixed(1)}k` : trade.amount.toFixed(0)}
        </div>
        <span className="text-[9px] text-gray-600 uppercase tracking-tighter">Just now</span>
      </div>
    </div>
  );
}

interface SignalsSidebarProps {
  signals: LiveSignal[];
  onSignalClick: (address: string) => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export function SignalsSidebar({ signals, onSignalClick, onTabChange, activeTab }: SignalsSidebarProps) {
  const [whaleTrades, setWhaleTrades] = useState<WhaleTrade[]>([]);

  useEffect(() => {
    const fetchWhales = async () => {
      try {
        const res = await fetch(API_ROUTES.WHALE_WATCH);
        const json = await res.json();
        if (json.success && json.data) setWhaleTrades(json.data);
      } catch (e) {
        console.error("Whale fetch error:", e);
      }
    };
    fetchWhales();
    const interval = setInterval(fetchWhales, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const handleClick = (sig: LiveSignal) => {
    if (activeTab !== "All" && activeTab !== "Trending") {
      onTabChange("Trending");
    }
    setTimeout(() => onSignalClick(sig.address), 100);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="w-full lg:w-80 flex flex-col gap-4">
      {/* ── Signals Section ── */}
      <div className="glass-panel flex flex-col max-h-[400px]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm sm:text-base font-medium">Algorithmic Signals</h2>
          </div>
          <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-medium">
            {signals.length} Active
          </span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
          {signals.length > 0 ? (
            signals.map((sig) => (
              <SignalItem key={sig.id} signal={sig} onClick={() => handleClick(sig)} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-gray-500">
              <Activity className="h-5 w-5 animate-pulse" />
              <p className="text-xs">Analyzing market data...</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Whale Watch Section ── */}
      <div className="glass-panel flex flex-col flex-1">
        <div className="p-4 border-b border-border flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-warning" />
            <h2 className="text-sm sm:text-base font-medium">Live Whale Watch</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] text-success font-bold uppercase tracking-wider">Live Ticker</span>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-1">
          {whaleTrades.length > 0 ? (
            whaleTrades.map((trade) => <WhaleItem key={trade.id} trade={trade} />)
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p className="text-[10px] uppercase tracking-widest animate-pulse">Monitoring Chain Trades...</p>
            </div>
          )}
        </div>
        <div className="mt-auto p-3 bg-white/[0.01] border-t border-border/50 text-center">
          <p className="text-[9px] text-gray-600 italic">Tracking swaps &gt; $5,000 on Solana</p>
        </div>
      </div>
    </div>
  );
}
