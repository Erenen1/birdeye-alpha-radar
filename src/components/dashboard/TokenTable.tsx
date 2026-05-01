"use client";

import React from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenData, SortKey, SortDirection } from "@/types";
import { MetricCard, QuickFilter } from "@/components/ui/FilterControls";
import { TokenTableRow } from "./TokenTableRow";

interface TokenTableProps {
  tokens: TokenData[];
  isLoading: boolean;
  activeTab: string;
  sortConfig: { key: SortKey; direction: SortDirection };
  minLiquidity: number;
  minVolume: number;
  expandedToken: string | null;
  overviewData: Record<string, any>;
  loadingOverview: Record<string, boolean>;
  onTabChange: (tab: string) => void;
  onSort: (key: SortKey) => void;
  onExpandToken: (address: string) => void;
  onLiquidityFilter: (val: number) => void;
  onVolumeFilter: (val: number) => void;
  onRefresh: () => void;
}

const TABS = [
  { label: "NEW LISTINGS", value: "New Listings", colorClass: "border-blue-500/40 bg-blue-500/10 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]" },
  { label: "TRENDING",     value: "Trending",     colorClass: "border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]" },
  { label: "HIGH MOMENTUM",value: "High Momentum",colorClass: "border-success/40 bg-success/10 hover:border-success/60 shadow-[0_0_15px_rgba(34,197,94,0.15)]" },
  { label: "HIGH RISK",    value: "High Risk",    colorClass: "border-danger/40 bg-danger/10 hover:border-danger/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]" },
] as const;

const SORT_COLUMNS: { label: string; key: SortKey; colSpan: string }[] = [
  { label: "Price",    key: "price",                colSpan: "col-span-1" },
  { label: "24h %",   key: "price24hChangePercent", colSpan: "col-span-1" },
  { label: "Liquidity",key: "liquidity",            colSpan: "col-span-1" },
  { label: "Volume",   key: "volume24hUSD",         colSpan: "col-span-1" },
  { label: "Sentinel AI", key: "alphaScore",           colSpan: "col-span-2" },
];

export function TokenTable({
  tokens,
  isLoading,
  activeTab,
  sortConfig,
  minLiquidity,
  minVolume,
  expandedToken,
  overviewData,
  loadingOverview,
  onTabChange,
  onSort,
  onExpandToken,
  onLiquidityFilter,
  onVolumeFilter,
  onRefresh,
}: TokenTableProps) {
  return (
    <div className="flex-1 glass-panel flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">Live Token Discovery Radar</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] border border-success/20 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              LIVE
            </span>
            <button
              onClick={onRefresh}
              className={cn("p-1 rounded hover:bg-surface transition-colors", isLoading && "animate-spin")}
              title="Refresh Data"
            >
              <Activity className="h-3 w-3 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Showing live token signals generated from Birdeye market data.</p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <MetricCard
                key={tab.value}
                title={tab.label}
                active={activeTab === tab.value}
                onClick={() => onTabChange(tab.value)}
                colorClass={tab.colorClass}
              />
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Quick Filters:</span>
          <QuickFilter
            label="Liq > $100k"
            active={minLiquidity === 100_000}
            onClick={() => onLiquidityFilter(minLiquidity === 100_000 ? 0 : 100_000)}
          />
          <QuickFilter
            label="Vol > $50k"
            active={minVolume === 50_000}
            onClick={() => onVolumeFilter(minVolume === 50_000 ? 0 : 50_000)}
          />
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto p-4 relative">
        {/* Table Header */}
        <div className="min-w-[800px] grid grid-cols-10 gap-4 text-xs font-medium text-gray-400 pb-2 border-b border-border/50 sticky top-0 bg-surface z-10 p-2">
          <div className="col-span-2">Token</div>
          <div className="col-span-1">Source</div>
          {SORT_COLUMNS.map(({ label, key, colSpan }) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={cn(
                colSpan,
                "text-right hover:text-white transition-colors flex items-center justify-end gap-1",
                key === "alphaScore" && "justify-center"
              )}
            >
              {label}{" "}
              {sortConfig.key === key && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
          ))}
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="mt-4 flex flex-col gap-2 min-w-[800px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-gray-400">
              Loading data from Birdeye API...
            </div>
          ) : tokens.length > 0 ? (
            tokens.map((token, i) => (
              <React.Fragment key={token.address + i}>
                <TokenTableRow
                  token={token}
                  isExpanded={expandedToken === token.address}
                  onClick={() => onExpandToken(token.address)}
                  overview={overviewData[token.address]}
                  isLoadingOverview={loadingOverview[token.address]}
                />
              </React.Fragment>
            ))
          ) : (
            <div className="flex items-center justify-center p-12 text-gray-400">
              No tokens found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
