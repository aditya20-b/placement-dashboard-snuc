"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportEntry } from "@/lib/reports";

interface ReportHistoryItemProps {
  entry: ReportEntry;
  onDownload?: () => void;
  showIndex?: number;
  className?: string;
}

function flagToLabel(flag: string): string {
  return flag
    .replace(/^--/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReportHistoryItem({
  entry,
  onDownload,
  showIndex,
  className,
}: ReportHistoryItemProps) {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { stats } = entry;
  const label =
    entry.flags.length === 0
      ? "Default"
      : entry.flags.map(flagToLabel).join(", ");

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-5 py-4",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {/* Date · time · tag */}
        <div className="flex flex-wrap items-center gap-2">
          {showIndex !== undefined && (
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              #{showIndex}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">{dateStr}</span>
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 h-4 border-border text-muted-foreground"
          >
            {label}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
          <span>
            Placed{" "}
            <strong className="text-foreground">
              {stats.placed}/{stats.optPlacement}
            </strong>
          </span>
          <span>
            Rate{" "}
            <strong className="text-foreground">
              {Number(stats.placementPercent).toFixed(0)}%
            </strong>
          </span>
          <span>
            Companies{" "}
            <strong className="text-foreground">{stats.totalCompanies}</strong>
          </span>
          <span>
            Median{" "}
            <strong className="text-foreground">
              ₹{Number(stats.medianCtc).toFixed(2)}L
            </strong>
          </span>
        </div>
      </div>

      {onDownload && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDownload}
          className="shrink-0 text-muted-foreground hover:text-foreground gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>
      )}
    </div>
  );
}
