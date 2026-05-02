"use client";

import { Activity, ExternalLink, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveSignal } from "@/types";

interface SignalItemProps {
  signal: LiveSignal;
  onClick: () => void;
}

const iconColors = {
  success: "text-success bg-success/10 border-success/20",
  danger: "text-danger bg-danger/10 border-danger/20",
  info: "text-info bg-info/10 border-info/20",
  warning: "text-warning bg-warning/10 border-warning/20",
};

const textColors = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

const glowColors = {
  success: "shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  danger: "shadow-[0_0_10px_rgba(239,68,68,0.15)]",
  info: "shadow-[0_0_10px_rgba(59,130,246,0.15)]",
  warning: "shadow-[0_0_10px_rgba(245,158,11,0.15)]",
};

export function SignalItem({ signal: sig, onClick }: SignalItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex gap-3 pb-4 border-b border-border/50 last:border-0 group cursor-pointer hover:bg-white/[0.03] p-2 -mx-2 rounded-lg transition-all duration-200",
        glowColors[sig.color]
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110",
          iconColors[sig.color]
        )}
      >
        <Activity className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("text-xs font-bold tracking-wide truncate", textColors[sig.color])}>
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

interface SignalsSidebarProps {
  signals: LiveSignal[];
  onSignalClick: (address: string) => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export function SignalsSidebar({ signals, onSignalClick, onTabChange, activeTab }: SignalsSidebarProps) {
  const handleClick = (sig: LiveSignal) => {
    if (activeTab !== "All" && activeTab !== "Trending") {
      onTabChange("Trending");
    }
    setTimeout(() => onSignalClick(sig.address), 100);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="w-full lg:w-80 glass-panel flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-base sm:text-lg font-medium">Algorithmic Signals</h2>
        </div>
        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-medium">
          {signals.length > 0 ? `${signals.length} Active` : "Scanning"}
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {signals.length > 0 ? (
          signals.map((sig) => (
            <SignalItem key={sig.id} signal={sig} onClick={() => handleClick(sig)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="h-10 w-10 rounded-full border border-border bg-surface/50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-gray-600 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500">Analyzing real-time market data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
