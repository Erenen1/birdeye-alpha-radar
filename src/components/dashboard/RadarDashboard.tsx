"use client";

import { useState, useEffect } from "react";
import React from "react";
import { Search, Bell, Activity, TrendingUp, AlertTriangle, ExternalLink, Copy, ChevronDown, ChevronUp, Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingToken, NewListingToken } from "@/services/birdeye/types";

// Token tipi ikisini de kapsayacak şekilde birleşik (union) tip
type TokenData = (TrendingToken | NewListingToken) & { 
  signal?: string; 
  signalColor?: 'success' | 'primary' | 'danger' | 'warning' | 'info';
  alphaScore?: number;
  verdict?: string;
  riskScore?: number;
};

type SortKey = "price" | "price24hChangePercent" | "liquidity" | "volume24hUSD" | "alphaScore";
type SortDirection = "asc" | "desc";

export default function RadarDashboard({ initialTrending }: { initialTrending: TrendingToken[] }) {
  const [activeTab, setActiveTab] = useState("Trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [minLiquidity, setMinLiquidity] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [tokens, setTokens] = useState<TokenData[]>(initialTrending.map(t => ({ ...t, signal: 'High Momentum', signalColor: 'success' })));
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: "alphaScore", direction: "desc" });
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<Record<string, any>>({});
  const [loadingOverview, setLoadingOverview] = useState<Record<string, boolean>>({});
  const [liveSignals, setLiveSignals] = useState<Array<{ id: string, address: string, signal: string, desc: string, time: string, color: 'success' | 'danger' | 'info' | 'warning' }>>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "New Listings" ? "/api/birdeye/new_listings" : "/api/birdeye/trending";
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        const signal = activeTab === "New Listings" ? 'Fresh Listing' : 'High Momentum';
        const color = activeTab === "New Listings" ? 'primary' : 'success';
        const fetchedTokens = json.data.map((t: any) => ({ ...t, signal, signalColor: color }));
        
        // Machine Learning AI Analysis Pipeline
        const predictRes = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: fetchedTokens })
        });
        const predictJson = await predictRes.json();
        
        if (predictJson.success) {
          setTokens(sortTokens(predictJson.data, sortConfig.key, sortConfig.direction));
        } else {
          setTokens(sortTokens(fetchedTokens, sortConfig.key, sortConfig.direction));
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTelegramAgent = async () => {
    setIsAgentRunning(true);
    try {
      for (const token of tokens.slice(0, 10)) {
        if ((token.alphaScore || 0) >= 85 && (token.riskScore || 0) < 20) {
          await fetch("/api/telegram/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, type: 'GEM', alphaScore: token.alphaScore, riskScore: token.riskScore }) });
        } else if ((token.riskScore || 0) > 80 || (token.alphaScore || 0) < 30) {
          await fetch("/api/telegram/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, type: 'RUG', alphaScore: token.alphaScore, riskScore: token.riskScore }) });
        }
      }
      alert("🦅 Sycon AI Agent finished scanning. Telegram alerts processed successfully.");
    } catch (e) {
      console.error(e);
      alert("Agent encountered an error.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Tab değiştiğinde veya manuel yenilemede fetch
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Filtreleme Mantığı
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          token.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLiquidity = (token.liquidity || 0) >= minLiquidity;
    const matchesVolume = (token.volume24hUSD || 0) >= minVolume;
    
    // Tab Bazlı Filtreleme
    let matchesTab = true;
    if (activeTab === "High Momentum") {
      matchesTab = (token.price24hChangePercent || 0) > 10;
    } else if (activeTab === "High Risk") {
      matchesTab = (token.liquidity || 0) < 50000;
    }
    
    return matchesSearch && matchesLiquidity && matchesVolume && matchesTab;
  });

  // ML-driven AI Verdict Generation (Replaces static Algorithmic Signals)
  useEffect(() => {
    if (!tokens || tokens.length === 0) return;
    
    const signals: typeof liveSignals = [];
    
    // Top 2 AI Gems
    const gems = [...tokens].filter(t => (t.alphaScore || 0) >= 85).sort((a, b) => (b.alphaScore || 0) - (a.alphaScore || 0)).slice(0, 2);
    gems.forEach(gem => {
      signals.push({
        id: `gem-${gem.address}`,
        address: gem.address,
        signal: "💎 GEM ALERT",
        desc: `$${gem.symbol} scored ${gem.alphaScore}/100 AI Confidence. High Momentum & Strong Liquidity detected.`,
        time: "Just now",
        color: "success"
      });
    });

    // Top 2 High Risk
    const rugs = [...tokens].filter(t => (t.riskScore || 0) >= 80 || (t.alphaScore || 0) <= 30).sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 2);
    rugs.forEach(rug => {
      signals.push({
        id: `rug-${rug.address}`,
        address: rug.address,
        signal: "🚨 RUG WARNING",
        desc: `Extreme Risk on $${rug.symbol} (Risk: ${rug.riskScore}/100). Institutional caution advised.`,
        time: "1 min ago",
        color: "danger"
      });
    });

    // Fill with moderates if needed
    if (signals.length < 3) {
       const moderate = tokens.find(t => (t.alphaScore || 0) >= 60 && (t.alphaScore || 0) < 85 && (t.riskScore || 0) < 60);
       if (moderate) {
         signals.push({
           id: `mod-${moderate.address}`,
           address: moderate.address,
           signal: "Accumulation Zone",
           desc: `$${moderate.symbol} shows stable momentum (Alpha: ${moderate.alphaScore}). Watch for volume breakouts.`,
           time: "5 mins ago",
           color: "info"
         });
       }
    }

    setLiveSignals(signals);
  }, [tokens]);

  const handleExpandToken = async (address: string) => {
    if (expandedToken === address) {
      setExpandedToken(null);
      return;
    }
    setExpandedToken(address);
    
    // Eğer daha önce çekilmediyse detaylı veriyi çek
    if (!overviewData[address] && !loadingOverview[address]) {
      setLoadingOverview(prev => ({ ...prev, [address]: true }));
      try {
        const res = await fetch(`/api/birdeye/overview?address=${address}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOverviewData(prev => ({ ...prev, [address]: json.data }));
        }
      } catch (e) {
        console.error("Overview fetch error:", e);
      } finally {
        setLoadingOverview(prev => ({ ...prev, [address]: false }));
      }
    }
  };
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
    setTokens(sortTokens(tokens, key, direction));
  };

  const sortTokens = (data: TokenData[], key: SortKey, direction: SortDirection) => {
    return [...data].sort((a, b) => {
      let aVal: any = a[key as keyof TokenData] || 0;
      let bVal: any = b[key as keyof TokenData] || 0;
      
      // Special case for price object if it's not a direct number
      if (key === "price") {
        aVal = typeof a.price === "number" ? a.price : 0;
        bVal = typeof b.price === "number" ? b.price : 0;
      }

      if (direction === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Solana Network Status */}
          <div className="hidden md:flex items-center gap-2 bg-surface/50 border border-border rounded-full px-3 py-1.5 text-xs text-gray-300">
            <Zap className="h-3 w-3 text-warning fill-warning" />
            <span className="font-mono">2,450 TPS</span>
          </div>
          
          {/* Mock SOL Price */}
          <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 text-xs font-medium">
            <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-purple-500 to-success flex items-center justify-center text-[8px] text-black">SOL</div>
            <span>$142.50</span>
            <span className="text-success text-[10px]">+2.4%</span>
          </div>

          {/* API Status */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/10 text-success text-[10px] font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
              API Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Title & Agent Trigger Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-100">Birdeye Alpha Radar <span className="text-primary text-sm font-medium ml-2 border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">v2.0 ML</span></h1>
            <p className="text-gray-400 text-sm mt-1">Real-time Solana token discovery enhanced with Sycon AI predictions.</p>
          </div>
          <button 
            onClick={runTelegramAgent}
            disabled={isAgentRunning}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg border border-indigo-400/30 hover:opacity-90 transition-opacity font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] w-full md:w-auto justify-center"
          >
            <Bell className={cn("h-4 w-4", isAgentRunning && "animate-bounce")} />
            {isAgentRunning ? "Agent Scanning..." : "Run AI Telegram Agent"}
          </button>
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
                  <button 
                    onClick={fetchData}
                    className={cn("p-1 rounded hover:bg-surface transition-colors", isLoading && "animate-spin")}
                    title="Refresh Data"
                  >
                    <Activity className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Showing live token signals generated from Birdeye market data.</p>
              </div>              {/* Metric Cards (Tab Filters) */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <MetricCard 
                    title="NEW LISTINGS" 
                    active={activeTab === "New Listings"} 
                    onClick={() => setActiveTab("New Listings")} 
                    colorClass="border-blue-500/40 bg-blue-500/10 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  />
                  <MetricCard 
                    title="TRENDING" 
                    active={activeTab === "Trending"} 
                    onClick={() => setActiveTab("Trending")} 
                    colorClass="border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  />
                  <MetricCard 
                    title="HIGH MOMENTUM" 
                    active={activeTab === "High Momentum"} 
                    onClick={() => setActiveTab("High Momentum")} 
                    colorClass="border-success/40 bg-success/10 hover:border-success/60 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                  />
                  <MetricCard 
                    title="HIGH RISK" 
                    active={activeTab === "High Risk"} 
                    onClick={() => setActiveTab("High Risk")} 
                    colorClass="border-danger/40 bg-danger/10 hover:border-danger/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  />
                </div>
              </div>
              
              {/* Advanced Quick Filters */}

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Quick Filters:</span>
                  <QuickFilter 
                    label="Liq > $100k" 
                    active={minLiquidity === 100000} 
                    onClick={() => setMinLiquidity(minLiquidity === 100000 ? 0 : 100000)} 
                  />
                  <QuickFilter 
                    label="Vol > $50k" 
                    active={minVolume === 50000} 
                    onClick={() => setMinVolume(minVolume === 50000 ? 0 : 50000)} 
                  />
                </div>
              </div>

            {/* Table Header */}
            <div className="flex-1 overflow-auto p-4 relative">
               <div className="min-w-[800px] grid grid-cols-10 gap-4 text-xs font-medium text-gray-400 pb-2 border-b border-border/50 sticky top-0 bg-surface z-10 p-2">
                  <div className="col-span-2">Token</div>
                  <div className="col-span-1">Source</div>
                  <button onClick={() => handleSort("price")} className="col-span-1 text-right hover:text-white transition-colors flex items-center justify-end gap-1">
                    Price {sortConfig.key === "price" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </button>
                  <button onClick={() => handleSort("price24hChangePercent")} className="col-span-1 text-right hover:text-white transition-colors flex items-center justify-end gap-1">
                    24h % {sortConfig.key === "price24hChangePercent" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </button>
                  <button onClick={() => handleSort("liquidity")} className="col-span-1 text-right hover:text-white transition-colors flex items-center justify-end gap-1">
                    Liquidity {sortConfig.key === "liquidity" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </button>
                  <button onClick={() => handleSort("volume24hUSD")} className="col-span-1 text-right hover:text-white transition-colors flex items-center justify-end gap-1">
                    Volume {sortConfig.key === "volume24hUSD" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </button>
                  <button onClick={() => handleSort("alphaScore" as SortKey)} className="col-span-2 text-center hover:text-white transition-colors flex items-center justify-center gap-1">
                    Sycon AI {sortConfig.key === "alphaScore" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </button>
                  <div className="col-span-1 text-center">Actions</div>
               </div>
               
               {/* Table Content */}
               <div className="mt-4 flex flex-col gap-2 min-w-[800px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-12 text-gray-400">Loading data from Birdeye API...</div>
                  ) : filteredTokens.length > 0 ? (
                    filteredTokens.map((token, i) => (
                      <React.Fragment key={token.address + i}>
                        <TableRow 
                          token={token}
                          isExpanded={expandedToken === token.address}
                          onClick={() => handleExpandToken(token.address)}
                          overview={overviewData[token.address]}
                          isLoadingOverview={loadingOverview[token.address]}
                        />
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-12 text-gray-400">No tokens found matching your filters.</div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Sidebar - Live Signals */}
          <div className="w-full lg:w-80 glass-panel flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-medium">Algorithmic Signals</h2>
              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Actionable</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {liveSignals.length > 0 ? (
                liveSignals.map(sig => (
                  <SignalItem 
                    key={sig.id} 
                    signal={sig.signal} 
                    desc={sig.desc} 
                    time={sig.time} 
                    color={sig.color} 
                    onClick={() => {
                      // Tabloyu filtreden çıkarıp ilgili tokeni bulmayı kolaylaştırmak için All yapabiliriz
                      // Ya da sadece expandedToken olarak set ederiz.
                      if (activeTab !== "All" && activeTab !== "Trending") {
                        setActiveTab("All");
                      }
                      setTimeout(() => handleExpandToken(sig.address), 100);
                      // Mobilde görünmesi için scroll yapılabilir
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }} 
                  />
                ))
              ) : (
                <div className="text-xs text-gray-500 text-center mt-4">Analyzing real-time market data...</div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Subcomponents

function MetricCard({ title, active, onClick, colorClass }: { title: string, active: boolean, onClick: () => void, colorClass: string }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex justify-center items-center px-4 py-2 rounded border transition-all cursor-pointer group min-h-[32px] text-center whitespace-nowrap",
        active ? colorClass : "bg-surface/40 border-border hover:bg-surface text-gray-400"
      )}
    >
      <span className={cn(
        "text-[10px] font-bold tracking-widest transition-colors uppercase",
        active ? "text-white" : "group-hover:text-white"
      )}>
        {title}
      </span>
    </div>
  );
}

function QuickFilter({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1",
        active ? "bg-primary/20 text-primary border-primary/50" : "bg-surface/50 text-gray-500 border-border hover:border-gray-600"
      )}
    >
      {active && <div className="h-1 w-1 rounded-full bg-primary animate-pulse"></div>}
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

function TableRow({ token, isExpanded, onClick, overview, isLoadingOverview }: { token: TokenData, isExpanded: boolean, onClick: () => void, overview?: any, isLoadingOverview?: boolean }) {
  const { address, name, symbol, logoURI, price, price24hChangePercent: change, liquidity: liq, volume24hUSD: vol, signal = "Tracking", signalColor: color = "info" } = token;
  const isPositive = (change || 0) >= 0;
  
  const handleShareOnX = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🦅 I just spotted $${symbol} showing ${signal} on Birdeye Alpha Radar! \n\n💰 Price: ${formatCurrency(price)}\n📈 24h: ${formatPercent(change)}\n\nCheck it out here:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };
  
  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    // Basit bildirim eklenebilir
  };
  
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

  return (
    <>
    <div 
      onClick={onClick}
      className={cn(
        "grid grid-cols-10 gap-4 items-center p-3 border bg-surface/40 hover:bg-surface/80 transition-all duration-200 cursor-pointer group", 
        borderColors[color],
        isExpanded ? "rounded-t-lg border-b-0" : "rounded-lg"
      )}
    >
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
        <span className="px-2 py-1 bg-surface/80 border border-border rounded text-[10px] text-gray-300">
          {(token as any).source ? (token as any).source.split('_')[0] : "Birdeye"}
        </span>
      </div>
      <div className="col-span-1 text-right text-sm">{formatCurrency(price)}</div>
      <div className={cn("col-span-1 text-right text-sm", isPositive ? "text-success" : "text-danger")}>{formatPercent(change)}</div>
      <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(liq)}</div>
      <div className="col-span-1 text-right text-sm text-gray-300">{formatCurrency(vol)}</div>
      
      {/* Real AI Progress Bars */}
      <div className="col-span-2 flex flex-col items-center justify-center gap-1">
        <div className="flex w-full items-center justify-between px-2 text-[10px] font-bold">
          <span className={cn(
             (token.alphaScore||0) >= 80 ? "text-success" : (token.alphaScore||0) < 40 ? "text-danger" : "text-warning"
          )}>{token.verdict || "Neutral"}</span>
          <div className="flex gap-2 items-center">
            <span className="text-white/60 text-[8px]">Alpha: {token.alphaScore || 0}</span>
            <span className="text-white/60 text-[8px]">Risk: {token.riskScore || 0}</span>
          </div>
        </div>
        <div className="h-1.5 w-[90%] bg-surface rounded-full overflow-hidden flex">
          <div 
             className={cn("h-full transition-all duration-1000", (token.alphaScore||0) >= 80 ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" : (token.alphaScore||0) < 40 ? "bg-danger" : "bg-warning")}
             style={{width: `${Math.min(100, token.alphaScore || 0)}%`}}
          />
          <div 
             className="h-full bg-danger/30 transition-all duration-1000"
             style={{width: `${Math.min(100, token.riskScore || 0)}%`}}
          />
        </div>
      </div>

      <div className="col-span-1 flex items-center justify-center gap-1 group/actions relative">
        <div className="flex items-center gap-1 group-hover:opacity-0 transition-opacity">
           <span className={cn("px-2 py-0.5 rounded text-[10px] border whitespace-nowrap", badgeColors[color])}>{signal}</span>
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
           <button 
             onClick={handleShareOnX}
             className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-white" 
             title="Share on X"
           >
             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); window.open(`https://birdeye.so/token/${address}?chain=solana`, "_blank") }}
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
    
    {/* Expanded Details Panel */}
    {isExpanded && (
      <div className={cn("p-5 border border-t-0 bg-surface/20 rounded-b-lg animate-in slide-in-from-top-2 duration-200", borderColors[color])}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Core Data */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white/80 border-b border-border/50 pb-1">Token Information</h3>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Contract</span>
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-border">
                <span className="font-mono text-gray-300">{address.substring(0, 6)}...{address.slice(-4)}</span>
                <button onClick={(e) => copyToClipboard(e, address)} className="hover:text-white"><Copy className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); window.open(`https://solscan.io/token/${address}`, "_blank") }} className="hover:text-primary"><ExternalLink className="h-3 w-3" /></button>
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

          {/* Column 2: Trading Data (Rich Overview) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white/80 border-b border-border/50 pb-1">Deep Market Activity (24h)</h3>
            
            {isLoadingOverview ? (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-surface rounded w-3/4"></div>
                <div className="h-4 bg-surface rounded w-1/2"></div>
                <div className="h-4 bg-surface rounded w-full"></div>
              </div>
            ) : overview ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Activity className="h-3 w-3"/> Active Wallets</span>
                  <span className="font-medium">{overview.uniqueWallet24h?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Holders</span>
                  <span className="font-medium">{overview.holder?.toLocaleString() || "N/A"}</span>
                </div>
                
                {/* Buy / Sell Ratio */}
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Buy Vol: {formatCurrency(overview.vBuy24hUSD)}</span>
                    <span>Sell Vol: {formatCurrency(overview.vSell24hUSD)}</span>
                  </div>
                  <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-surface border border-border">
                    <div 
                      className="h-full bg-success transition-all" 
                      style={{ width: `${(overview.vBuy24hUSD / ((overview.vBuy24hUSD + overview.vSell24hUSD) || 1)) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-danger transition-all" 
                      style={{ width: `${(overview.vSell24hUSD / ((overview.vBuy24hUSD + overview.vSell24hUSD) || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Advanced data unavailable.</span>
              </div>
            )}
          </div>

          {/* Column 3: Actions */}
          <div className="flex flex-col justify-end gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); window.open(`https://jup.ag/swap/SOL-${address}`, "_blank") }}
              className="w-full py-2 bg-gradient-to-r from-success/80 to-success text-black font-bold text-xs rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
            >
              Swap on Jupiter 🪐
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); window.open(`https://birdeye.so/token/${address}?chain=solana`, "_blank") }}
              className="w-full py-2 bg-surface border border-border hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors"
            >
              Advanced Chart
            </button>
          </div>
          
        </div>
      </div>
    )}
    </>
  );
}

function SignalItem({ signal, desc, time, color, onClick }: { signal: string, desc: string, time: string, color: 'success' | 'danger' | 'info' | 'warning', onClick: () => void }) {
  const iconColors = {
    success: 'text-success bg-success/10 border-success/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
    info: 'text-info bg-info/10 border-info/20',
    warning: 'text-warning bg-warning/10 border-warning/20'
  };

  return (
    <div onClick={onClick} className="flex gap-3 pb-4 border-b border-border/50 last:border-0 group cursor-pointer hover:bg-white/[0.02] p-2 -mx-2 rounded transition-colors">
      <div className={cn("mt-0.5 flex-shrink-0 h-7 w-7 rounded flex items-center justify-center border transition-transform group-hover:scale-110 shadow-[0_0_10px_currentColor] animate-pulse", iconColors[color])}>
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-bold tracking-wide", color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : color === 'warning' ? 'text-warning' : 'text-info')}>{signal}</span>
          <ExternalLink className="h-3 w-3 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed opacity-90">{desc}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{time}</span>
          <span className="text-[9px] text-gray-500">• Click to analyze</span>
        </div>
      </div>
    </div>
  );
}
