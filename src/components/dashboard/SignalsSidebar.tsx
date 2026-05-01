"use client";

import { Activity, ExternalLink } from "lucide-react";
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

export function SignalItem({ signal: sig, onClick }: SignalItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 pb-4 border-b border-border/50 last:border-0 group cursor-pointer hover:bg-white/[0.02] p-2 -mx-2 rounded transition-colors"
    >
      <div
        className={cn(
          "mt-0.5 flex-shrink-0 h-7 w-7 rounded flex items-center justify-center border transition-transform group-hover:scale-110 shadow-[0_0_10px_currentColor] animate-pulse",
          iconColors[sig.color]
        )}
      >
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-bold tracking-wide", textColors[sig.color])}>
            {sig.signal}
          </span>
          <ExternalLink className="h-3 w-3 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed opacity-90">{sig.desc}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{sig.time}</span>
          <span className="text-[9px] text-gray-500">• Click to analyze</span>
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
        <h2 className="text-lg font-medium">Algorithmic Signals</h2>
        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
          Actionable
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {signals.length > 0 ? (
          signals.map((sig) => (
            <SignalItem key={sig.id} signal={sig} onClick={() => handleClick(sig)} />
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center mt-4">
            Analyzing real-time market data...
          </div>
        )}
      </div>
    </div>
  );
}
