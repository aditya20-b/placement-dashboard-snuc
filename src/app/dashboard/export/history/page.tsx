"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useReports } from "@/hooks/use-reports";
import { ReportHistoryItem } from "@/components/dashboard/report-history-item";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft } from "lucide-react";
import type { ReportEntry } from "@/lib/reports";

const PAGE_SIZE = 10;

export default function ExportHistoryPage() {
  const { data: session } = useSession();
  const { reports, loading, refresh } = useReports();
  const [page, setPage] = useState(0);

  const isAdmin = session?.user?.role === "admin";

  // Fetch on mount
  useEffect(() => {
    if (isAdmin) refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-md">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground">
            Report history is restricted to placement cell staff.
          </p>
        </div>
      </div>
    );
  }

  const handleDownload = (entry: ReportEntry) => {
    window.open(`/api/download/${entry.filename}`, "_blank");
  };

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageEntries = reports.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/export"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Export
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Report History
        </h1>
        {reports.length > 0 && (
          <Badge variant="outline" className="border-border text-muted-foreground">
            {reports.length}
          </Badge>
        )}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : reports.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No report history
          </p>
          <p className="text-xs text-muted-foreground">
            Generated reports will appear here
          </p>
          <Link
            href="/dashboard/export"
            className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Generate your first report →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageEntries.map((entry, i) => (
              <ReportHistoryItem
                key={entry.id}
                entry={entry}
                showIndex={start + i + 1}
                onDownload={() => handleDownload(entry)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {start + 1}–{Math.min(start + PAGE_SIZE, reports.length)} of{" "}
                {reports.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
