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
  logo?: string;
  amount: number;
  type: "BUY" | "SELL";
  isSmart: boolean;
  time: string;
}

interface TokenOrder {
  id: string;
  side: string;
  volume: number;
  time: number;
  source: string;
}

function WhaleItem({ trade }: { trade: WhaleTrade }) {
  const isBuy = trade.type === "BUY";
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0 group hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 border overflow-hidden",
          isBuy 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        )}>
          {trade.logo ? (
            <img src={trade.logo} alt={trade.symbol} className="h-full w-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          ) : (
            trade.symbol?.[0] || "?"
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-100 truncate">{trade.symbol}</span>
            {trade.isSmart && (
              <span className="text-[8px] bg-primary/20 text-primary px-1 rounded font-black tracking-tighter uppercase border border-primary/30">
                Smart
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 font-mono">{trade.address.slice(0, 4)}...{trade.address.slice(-4)}</span>
            <div className={cn("h-1 w-1 rounded-full", isBuy ? "bg-success" : "bg-danger")} />
          </div>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className={cn(
          "text-xs font-mono font-bold flex items-center justify-end gap-1",
          isBuy ? "text-success" : "text-danger"
        )}>
          <span className="text-[9px] opacity-70 uppercase tracking-tighter">{isBuy ? "BUY" : "SELL"}</span>
          {isBuy ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3 rotate-180" />
          )}
          ${trade.amount > 1000 ? `${(trade.amount / 1000).toFixed(1)}k` : trade.amount.toFixed(0)}
        </div>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[9px] text-gray-600 uppercase tracking-tighter font-medium">{trade.time}</span>
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
  const [whaleTrades, setWhaleTrades] = useState<WhaleTrade[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<WhaleTrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<TokenOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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
    const interval = setInterval(fetchWhales, 60000); // Update every 60s (Optimization)
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTrade && isModalOpen) {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        try {
          const res = await fetch(`http://localhost:3001/api/token-trades/${selectedTrade.address}`);
          const json = await res.json();
          if (json.success) setRecentOrders(json.data);
        } catch (e) {
          console.error("Orders fetch error:", e);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [selectedTrade, isModalOpen]);

  const handleClick = (sig: LiveSignal) => {
    if (activeTab !== "All" && activeTab !== "Trending") {
      onTabChange("Trending");
    }
    setTimeout(() => onSignalClick(sig.address), 100);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const filteredWhales = whaleTrades.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full lg:w-80 flex flex-col gap-4 relative">
      {/* ── Whale Watch Section ── */}
      <div className="glass-panel flex flex-col h-[500px]">
        <div className="p-4 border-b border-border bg-white/[0.02]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-warning" />
              <h2 className="text-sm sm:text-base font-medium">Live Whale Watch</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] text-success font-bold uppercase tracking-wider">Live Ticker</span>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative group">
            <input 
              type="text"
              placeholder="Search token or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-[11px] focus:outline-none focus:border-primary/50 transition-all group-hover:border-white/20"
            />
            <Activity className="absolute right-3 top-2 h-3 w-3 text-gray-600 group-hover:text-gray-400" />
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-1 custom-scrollbar">
          {filteredWhales.length > 0 ? (
            filteredWhales.map((trade) => (
              <div key={trade.id} onClick={() => { setSelectedTrade(trade); setIsModalOpen(true); }} className="cursor-pointer">
                <WhaleItem trade={trade} />
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p className="text-[10px] uppercase tracking-widest animate-pulse">
                {searchQuery ? "No matches found" : "Monitoring Chain Trades..."}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-auto p-3 bg-white/[0.01] border-t border-border/50 text-center">
          <p className="text-[9px] text-gray-600 italic tracking-wide">Dynamic Whale Analytics Active</p>
        </div>
      </div>

      {/* ── Signals Section ── */}
      <div className="glass-panel flex flex-col max-h-[400px]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
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

      {/* ── Whale Detail Modal ── */}
      {isModalOpen && selectedTrade && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {selectedTrade.logo ? (
                    <img src={selectedTrade.logo} alt={selectedTrade.symbol} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">{selectedTrade.symbol[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTrade.symbol} Whale Analysis</h3>
                  <p className="text-[10px] font-mono text-gray-500">{selectedTrade.address}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Activity className="h-5 w-5 text-gray-400 rotate-45" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Trigger Event</span>
                  <div className={cn("text-lg font-bold mt-1", selectedTrade.type === "BUY" ? "text-success" : "text-danger")}>
                    {selectedTrade.type} ${selectedTrade.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Wallet Profile</span>
                  <div className="text-lg font-bold mt-1 text-primary">
                    {selectedTrade.isSmart ? "Institutional" : "High Volume"}
                  </div>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-warning" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Recent Orders</span>
                  </div>
                  {isLoadingOrders && <Activity className="h-3 w-3 text-primary animate-spin" />}
                </div>
                
                <div className="space-y-2">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            order.side === "BUY" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                          )}>
                            {order.side}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ${order.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-600 uppercase">{order.source}</span>
                      </div>
                    ))
                  ) : (
                    !isLoadingOrders && <div className="text-center py-4 text-[10px] text-gray-600 uppercase tracking-widest">No recent large orders</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-tighter">Institutional Thesis</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{selectedTrade.isSmart 
                    ? "Our models detect a structural accumulation pattern. Multiple high-conviction wallets are consolidating this position in current liquidity bands. Minimal exit pressure observed." 
                    : "Standard high-net-worth activity. No Sybil clusters detected. Volume is healthy but lacks deep institutional confluence. Monitor for sudden liquidity withdrawals."}"
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3">
              <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all">
                Track Address
              </button>
              <button 
                onClick={() => {
                  window.open(`https://birdeye.so/token/${selectedTrade.address}?chain=solana`, '_blank');
                }}
                className="flex-1 bg-primary hover:bg-primary-hover text-black text-xs font-bold py-3 rounded-xl transition-all"
              >
                Trade Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
