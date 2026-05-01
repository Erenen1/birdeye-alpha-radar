"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingToken, NewListingToken } from "@/services/birdeye/types";

// Token tipi ikisini de kapsayacak şekilde birleşik (union) tip
type TokenData = (TrendingToken | NewListingToken) & { signal?: string; signalColor?: 'success' | 'primary' | 'danger' | 'warning' | 'info' };

export default function RadarDashboard({ initialTrending }: { initialTrending: TrendingToken[] }) {
  const [activeTab, setActiveTab] = useState("Trending");
  const [tokens, setTokens] = useState<TokenData[]>(initialTrending.map(t => ({ ...t, signal: 'High Momentum', signalColor: 'success' })));
  const [isLoading, setIsLoading] = useState(false);

  // Tab değiştiğinde API'den veri çekme efekti
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (activeTab === "Trending") {
          const res = await fetch("/api/birdeye/trending");
          const json = await res.json();
          if (json.success) {
            setTokens(json.data.map((t: TrendingToken) => ({ ...t, signal: 'High Momentum', signalColor: 'success' })));
          }
        } else if (activeTab === "New Listings") {
          const res = await fetch("/api/birdeye/new_listings");
          const json = await res.json();
          if (json.success) {
            setTokens(json.data.map((t: NewListingToken) => ({ ...t, signal: 'Fresh Listing', signalColor: 'primary' })));
          }
        }
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // İlk yüklemede Trending zaten var, sadece diğer tablarda fetch at
    if (activeTab !== "Trending") {
      fetchData();
    } else {
      setTokens(initialTrending.map(t => ({ ...t, signal: 'High Momentum', signalColor: 'success' })));
    }
  }, [activeTab, initialTrending]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-primary h-6 w-6" />
          <span className="font-bold text-lg tracking-wide">BIRDEYE ALPHA RADAR</span>
        </div>
        
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search token, symbol, or address..." 
              className="w-full bg-background border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-700"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Title Section */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-medium text-gray-200">Early Solana Token Discovery Radar - Spot opportunities before they go viral</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="NEW LISTINGS" value="124" icon={<Activity className="h-5 w-5 text-info" />} />
          <StatCard title="TRENDING" value="56" icon={<TrendingUp className="h-5 w-5 text-primary" />} />
          <StatCard title="HIGH MOMENTUM" value="32" icon={<TrendingUp className="h-5 w-5 text-success" />} />
          <StatCard title="HIGH RISK" value="8" icon={<AlertTriangle className="h-5 w-5 text-danger" />} />
        </div>

        {/* Radar & Signals Section */}
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
          
          {/* Main Radar Table */}
          <div className="flex-1 glass-panel flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium">Live Token Discovery Radar</h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] border border-success/20 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Showing live token signals generated from Birdeye market data.</p>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 lg:pb-0">
                {["All", "New Listings", "Trending", "High Momentum", "High Risk", "Watchlist"].map(tab => (
                  <FilterTab 
                    key={tab} 
                    label={tab} 
                    active={activeTab === tab} 
                    onClick={() => setActiveTab(tab)} 
                  />
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div className="flex-1 overflow-auto p-4 relative">
               <div className="min-w-[800px] grid grid-cols-10 gap-4 text-xs font-medium text-gray-400 pb-2 border-b border-border/50 sticky top-0 bg-surface z-10">
                  <div className="col-span-2">Token</div>
                  <div className="col-span-1">Source</div>
                  <div className="col-span-1 text-right">Price</div>
                  <div className="col-span-1 text-right">24h Change</div>
                  <div className="col-span-1 text-right">Liquidity</div>
                  <div className="col-span-1 text-right">24h Volume</div>
                  <div className="col-span-1 text-center">Risk Score</div>
                  <div className="col-span-1 text-center">Momentum Score</div>
                  <div className="col-span-1 text-center">Signal</div>
               </div>
               
               {/* Table Content */}
               <div className="mt-4 flex flex-col gap-2 min-w-[800px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-12 text-gray-400">Loading data from Birdeye API...</div>
                  ) : tokens.length > 0 ? (
                    tokens.map((token, i) => (
                      <TableRow 
                        key={token.address + i} 
                        name={token.name} 
                        symbol={token.symbol} 
                        logoURI={token.logoURI}
                        price={token.price} 
                        change={token.price24hChangePercent} 
                        liq={token.liquidity} 
                        vol={token.volume24hUSD} 
                        signal={token.signal || "Tracking"} 
                        color={token.signalColor || "info"} 
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-12 text-gray-400">No tokens found for this filter.</div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Sidebar - Live Signals */}
          <div className="w-full lg:w-80 glass-panel flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-medium">Live Signals</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              <SignalItem signal="High Momentum" desc="showing opportunities before is..." time="Just now" color="success" />
              <SignalItem signal="High Risk" desc="tr20% or amt signals from Birdeye mark..." time="2 mins ago" color="danger" />
              <SignalItem signal="Alpha Opportunities" desc="sheat signals from solan as to d..." time="5 mins ago" color="info" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass-panel p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background rounded-lg border border-border">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400">{title}</span>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
    </div>
  );
}

function FilterTab({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
        active ? "bg-white text-black border-white" : "bg-transparent text-gray-400 border-border hover:border-gray-500"
      )}
    >
      {label}
    </button>
  );
}

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return "$0.00";
  if (val < 0.01 && val > 0) return "$" + val.toFixed(6);
  if (val > 1000000) return "$" + (val / 1000000).toFixed(2) + "M";
  if (val > 1000) return "$" + (val / 1000).toFixed(2) + "K";
  return "$" + val.toFixed(2);
};

const formatPercent = (val?: number) => {
  if (val === undefined || val === null) return "0.00%";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
};

function TableRow({ name, symbol, logoURI, price, change, liq, vol, signal, color }: { name: string, symbol: string, logoURI?: string, price?: number, change?: number, liq?: number, vol?: number, signal: string, color: 'success' | 'primary' | 'danger' | 'warning' | 'info' }) {
  const isPositive = (change || 0) >= 0;
  
  const borderColors = {
    success: 'border-success/30 hover:border-success/60',
    primary: 'border-primary/30 hover:border-primary/60',
    danger: 'border-danger/30 hover:border-danger/60',
    warning: 'border-warning/30 hover:border-warning/60',
    info: 'border-info/30 hover:border-info/60',
  };

  const badgeColors = {
    success: 'bg-success/20 text-success border-success/30',
    primary: 'bg-primary/20 text-primary border-primary/30',
    danger: 'bg-danger/20 text-danger border-danger/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    info: 'bg-info/20 text-info border-info/30',
  };

  // Fake skorlar
  const riskScore = Math.floor(Math.random() * 50) + 10;
  const momentumScore = Math.floor(Math.random() * 40) + 50;

  return (
    <div className={cn("grid grid-cols-10 gap-4 items-center p-3 rounded-lg border bg-surface/40 hover:bg-surface/80 transition-all duration-200 cursor-pointer group", borderColors[color])}>
      <div className="col-span-2 flex items-center gap-3 overflow-hidden">
        {logoURI ? (
           <img src={logoURI} alt={symbol} className="h-8 w-8 rounded-full flex-shrink-0 object-cover border border-border group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
      <div className="col-span-1">
        <span className="px-2 py-1 bg-surface border border-border rounded text-[10px] text-gray-300">Birdeye Scan</span>
      </div>
      <div className="col-span-1 text-right text-sm">{formatCurrency(price)}</div>
      <div className={cn("col-span-1 text-right text-sm", isPositive ? "text-success" : "text-danger")}>{formatPercent(change)}</div>
      <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(liq)}</div>
      <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(vol)}</div>
      
      {/* Fake Progress Bars */}
      <div className="col-span-1 flex items-center justify-center gap-2">
        <span className="text-xs text-danger">{riskScore}</span>
        <div className="h-1.5 w-8 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-danger" style={{width: `${riskScore}%`}}></div></div>
      </div>
      <div className="col-span-1 flex items-center justify-center gap-2">
        <span className="text-xs text-success">{momentumScore}</span>
        <div className="h-1.5 w-8 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-success" style={{width: `${momentumScore}%`}}></div></div>
      </div>

      <div className="col-span-1 flex items-center justify-center">
        <span className={cn("px-2 py-0.5 rounded text-[10px] border whitespace-nowrap", badgeColors[color])}>{signal}</span>
      </div>
    </div>
  );
}

function SignalItem({ signal, desc, time, color }: { signal: string, desc: string, time: string, color: 'success' | 'danger' | 'info' }) {
  const iconColors = {
    success: 'text-success',
    danger: 'text-danger',
    info: 'text-info'
  };

  return (
    <div className="flex gap-3 pb-4 border-b border-border/50 last:border-0">
      <div className="mt-1 flex-shrink-0">
        <Activity className={cn("h-4 w-4", iconColors[color])} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-semibold", iconColors[color])}>{signal}</span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{desc}</p>
        <span className="text-[10px] text-gray-500">{time}</span>
      </div>
    </div>
  );
}
