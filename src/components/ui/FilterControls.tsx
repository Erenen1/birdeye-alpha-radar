"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  active: boolean;
  onClick: () => void;
  colorClass: string;
}

export function MetricCard({ title, active, onClick, colorClass }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex justify-center items-center px-4 py-2 rounded border transition-all cursor-pointer group min-h-[32px] text-center whitespace-nowrap",
        active ? colorClass : "bg-surface/40 border-border hover:bg-surface text-gray-400"
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold tracking-widest transition-colors uppercase",
          active ? "text-white" : "group-hover:text-white"
        )}
      >
        {title}
      </span>
    </div>
  );
}

interface QuickFilterProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function QuickFilter({ label, active, onClick }: QuickFilterProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1",
        active
          ? "bg-primary/20 text-primary border-primary/50"
          : "bg-surface/50 text-gray-500 border-border hover:border-gray-600"
      )}
    >
      {active && <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />}
      {label}
    </button>
  );
}
