"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortDirection: SortDirection;
  onSort: () => void;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SortableHeader({
  label,
  sortDirection,
  onSort,
  className,
  align,
}: SortableHeaderProps) {
  // Auto-detect alignment from className if not explicitly set
  const resolved =
    align ??
    (className?.includes("text-right")
      ? "right"
      : className?.includes("text-center")
        ? "center"
        : "left");

  const justify =
    resolved === "right"
      ? "justify-end"
      : resolved === "center"
        ? "justify-center"
        : "justify-start";

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50", className)}
      onClick={onSort}
    >
      <div className={cn("flex items-center gap-1", justify)}>
        <span>{label}</span>
        {sortDirection === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
        ) : sortDirection === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}
