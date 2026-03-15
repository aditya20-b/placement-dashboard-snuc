"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportEntry } from "@/lib/reports";

interface ReportPreviewCardProps {
  entry: ReportEntry | null;
  onDownload?: () => void;
  className?: string;
}

export function ReportPreviewCard({
  entry,
  onDownload,
  className,
}: ReportPreviewCardProps) {
  if (!entry) return null;

  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { stats } = entry;

  return (
    <div className={cn("overflow-hidden rounded-xl shadow-sm", className)}>
      {/* Blue gradient header — matches stats generator */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest text-blue-200 uppercase">
            Latest Report · Batch 2022–2026
          </p>
          <p className="mt-1 text-2xl font-bold text-white leading-tight">
            {dateStr}
          </p>
          <p className="mt-0.5 text-sm text-blue-200">{timeStr}</p>
        </div>
        {onDownload && (
          <Button
            size="sm"
            onClick={onDownload}
            className="shrink-0 bg-white text-blue-600 hover:bg-blue-50 font-medium shadow-none border-0"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border border border-t-0 border-border rounded-b-xl bg-white sm:grid-cols-4 sm:divide-y-0">
        <StatCell
          label="Placed"
          value={String(stats.placed)}
          sub={`of ${stats.optPlacement} opted`}
        />
        <StatCell
          label="Placement Rate"
          value={`${Number(stats.placementPercent).toFixed(0)}%`}
          sub="overall"
        />
        <StatCell
          label="Companies"
          value={String(stats.totalCompanies)}
          sub="recruiters"
        />
        <StatCell
          label="Median CTC"
          value={`₹${Number(stats.medianCtc).toFixed(2)}L`}
          sub="per annum"
        />
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-6 py-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-3xl font-bold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}
