"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Activity, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { API_ROUTES, ALERT_THRESHOLDS, MOCK_SOL_PRICE, MOCK_SOL_CHANGE, MOCK_SOL_TPS } from "@/lib/constants";
import { TokenData, SortKey, SortDirection, LiveSignal, TrendingToken } from "@/types";

import { TokenTable } from "./TokenTable";
import { SignalsSidebar } from "./SignalsSidebar";

// ── Helpers ────────────────────────────────────────────────────────────────

function sortTokens(data: TokenData[], key: SortKey, direction: SortDirection): TokenData[] {
  return [...data].sort((a, b) => {
    const aVal: number = key === "price"
      ? typeof a.price === "number" ? a.price : 0
      : (a[key as keyof TokenData] as number) || 0;
    const bVal: number = key === "price"
      ? typeof b.price === "number" ? b.price : 0
      : (b[key as keyof TokenData] as number) || 0;
    return direction === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
}

// ── Component ──────────────────────────────────────────────────────────────

interface RadarDashboardProps {
  initialTrending: TrendingToken[];
}

export default function RadarDashboard({ initialTrending }: RadarDashboardProps) {
  const [activeTab, setActiveTab] = useState("Trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [minLiquidity, setMinLiquidity] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [tokens, setTokens] = useState<TokenData[]>(
    initialTrending.map((t) => ({ ...t, signal: "High Momentum", signalColor: "success" as const }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "alphaScore",
    direction: "desc",
  });
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<Record<string, any>>({});
  const [loadingOverview, setLoadingOverview] = useState<Record<string, boolean>>({});
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "New Listings" ? API_ROUTES.NEW_LISTINGS : API_ROUTES.TRENDING;
      const res = await fetch(endpoint);
      const json = await res.json();

      if (!json.success) return;

      const signal = activeTab === "New Listings" ? "Fresh Listing" : "High Momentum";
      const signalColor = activeTab === "New Listings" ? ("primary" as const) : ("success" as const);
      const fetchedTokens: TokenData[] = json.data.map((t: any) => ({ ...t, signal, signalColor }));

      const predictRes = await fetch(API_ROUTES.PREDICT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: fetchedTokens }),
      });
      const predictJson = await predictRes.json();

      const finalTokens = predictJson.success ? predictJson.data : fetchedTokens;
      setTokens(sortTokens(finalTokens, sortConfig.key, sortConfig.direction));
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    // Skip fetching on initial mount if we are on the Trending tab, 
    // because page.tsx already provided the initial data via SSR.
    if (activeTab === "Trending" && tokens.length > 0 && !isLoading && initialTrending.length > 0 && tokens[0]?.address === initialTrending[0]?.address) {
      return; 
    }
    fetchData(); 
  }, [activeTab]);

  // ── Live Signals ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tokens.length) return;

    const signals: LiveSignal[] = [];

    const gems = [...tokens]
      .filter((t) => (t.alphaScore ?? 0) >= ALERT_THRESHOLDS.GEM_MIN_ALPHA)
      .sort((a, b) => (b.alphaScore ?? 0) - (a.alphaScore ?? 0))
      .slice(0, 2);

    gems.forEach((gem) => {
      signals.push({
        id: `gem-${gem.address}`,
        address: gem.address,
        signal: "💎 GEM ALERT",
        desc: `$${gem.symbol} scored ${gem.alphaScore}/100 AI Confidence. High Momentum & Strong Liquidity detected.`,
        time: "Just now",
        color: "success",
      });
    });

    const rugs = [...tokens]
      .filter((t) => (t.riskScore ?? 0) >= ALERT_THRESHOLDS.RUG_MIN_RISK || (t.alphaScore ?? 0) <= ALERT_THRESHOLDS.RUG_MAX_ALPHA)
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 2);

    rugs.forEach((rug) => {
      signals.push({
        id: `rug-${rug.address}`,
        address: rug.address,
        signal: "🚨 RUG WARNING",
        desc: `Extreme Risk on $${rug.symbol} (Risk: ${rug.riskScore}/100). Institutional caution advised.`,
        time: "1 min ago",
        color: "danger",
      });
    });

    if (signals.length < 3) {
      const moderate = tokens.find(
        (t) => (t.alphaScore ?? 0) >= 60 && (t.alphaScore ?? 0) < 85 && (t.riskScore ?? 0) < 60
      );
      if (moderate) {
        signals.push({
          id: `mod-${moderate.address}`,
          address: moderate.address,
          signal: "Accumulation Zone",
          desc: `$${moderate.symbol} shows stable momentum (Alpha: ${moderate.alphaScore}). Watch for volume breakouts.`,
          time: "5 mins ago",
          color: "info",
        });
      }
    }

    setLiveSignals(signals);
  }, [tokens]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    const direction: SortDirection =
      sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc";
    setSortConfig({ key, direction });
    setTokens(sortTokens(tokens, key, direction));
  };

  const handleExpandToken = async (address: string) => {
    if (expandedToken === address) { setExpandedToken(null); return; }
    setExpandedToken(address);

    if (!overviewData[address] && !loadingOverview[address]) {
      setLoadingOverview((prev) => ({ ...prev, [address]: true }));
      try {
        const res = await fetch(`${API_ROUTES.OVERVIEW}?address=${address}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOverviewData((prev) => ({ ...prev, [address]: json.data }));
        }
      } catch (e) {
        console.error("Overview fetch error:", e);
      } finally {
        setLoadingOverview((prev) => ({ ...prev, [address]: false }));
      }
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filteredTokens = tokens.filter((token) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      token.name.toLowerCase().includes(q) ||
      token.symbol.toLowerCase().includes(q) ||
      token.address.toLowerCase().includes(q);
    const matchesLiquidity = (token.liquidity ?? 0) >= minLiquidity;
    const matchesVolume = (token.volume24hUSD ?? 0) >= minVolume;
    let matchesTab = true;
    if (activeTab === "High Momentum") matchesTab = (token.price24hChangePercent ?? 0) > 10;
    if (activeTab === "High Risk") matchesTab = (token.liquidity ?? 0) < 50_000;
    return matchesSearch && matchesLiquidity && matchesVolume && matchesTab;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-primary h-6 w-6" />
          <span className="font-bold text-lg tracking-wide">BIRDEYE SENTINEL</span>
        </div>

        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="token-search"
              type="text"
              placeholder="Search token, symbol, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-surface/50 border border-border rounded-full px-3 py-1.5 text-xs text-gray-300">
            <Zap className="h-3 w-3 text-warning fill-warning" />
            <span className="font-mono">{MOCK_SOL_TPS}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 text-xs font-medium">
            <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-purple-500 to-success flex items-center justify-center text-[8px] text-black">
              SOL
            </div>
            <span>{MOCK_SOL_PRICE}</span>
            <span className="text-success text-[10px]">{MOCK_SOL_CHANGE}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/10 text-success text-[10px] font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            API Online
          </div>
          <a href="https://t.me/sycon_alpha_radar" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] transition-colors rounded-full px-4 py-1.5 text-xs font-medium cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.12.03-1.98 1.25-5.58 3.68-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.24.36-.49 1-.76 3.91-1.7 6.52-2.8 7.82-3.34 3.73-1.55 4.5-1.82 5.01-1.83.11 0 .36.03.49.14.11.09.14.22.15.34-.01.12-.01.27-.03.41z"/></svg>
            Join Telegram
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* Title & Agent Trigger */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-100">
              Birdeye Sentinel{" "}
              <span className="text-primary text-sm font-medium ml-2 border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">
                v2.0 ML Auto-Scan
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time Solana token discovery. Birdeye Sentinel is continuously scanning in the background.
            </p>
          </div>
        </div>

        {/* Table + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
          <TokenTable
            tokens={filteredTokens}
            isLoading={isLoading}
            activeTab={activeTab}
            sortConfig={sortConfig}
            minLiquidity={minLiquidity}
            minVolume={minVolume}
            expandedToken={expandedToken}
            overviewData={overviewData}
            loadingOverview={loadingOverview}
            onTabChange={setActiveTab}
            onSort={handleSort}
            onExpandToken={handleExpandToken}
            onLiquidityFilter={setMinLiquidity}
            onVolumeFilter={setMinVolume}
            onRefresh={fetchData}
          />
          <SignalsSidebar
            signals={liveSignals}
            onSignalClick={handleExpandToken}
            onTabChange={setActiveTab}
            activeTab={activeTab}
          />
        </div>
      </main>
    </div>
  );
}
