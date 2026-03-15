"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useReports } from "@/hooks/use-reports";
import { useWorkflowPoller } from "@/hooks/use-workflow-poller";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { ReportPreviewCard } from "@/components/dashboard/report-preview-card";
import { ReportHistoryItem } from "@/components/dashboard/report-history-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { generateCSV } from "@/lib/export-pdf";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentRecord } from "@/types";
import type { ReportEntry } from "@/lib/reports";

// Maps our UI section keys to the CLI flags they correspond to.
// Sections without a flag are always included in the base report.
const SECTION_OPTIONS = [
  {
    key: "classwiseBreakdown",
    flag: "--sections",
    label: "Section Breakdown",
    description: "Show individual section breakdown (AIDS A/B, IOT A/B) instead of merged branches",
  },
  {
    key: "genderStats",
    flag: "--gender",
    label: "Gender Breakdown",
    description: "Include gender-wise placement breakdown chart",
  },
  {
    key: "companyDirectory",
    flag: "--companies",
    label: "Company Analysis",
    description: "Include company-wise breakdown page with detailed recruiter stats",
  },
  {
    key: "ctcBrackets",
    flag: "--ctc-brackets",
    label: "CTC Brackets",
    description: "Show CTC bracket distribution chart (0–6, 6–10, 10–20, 20+ LPA)",
  },
  {
    key: "classStatus",
    flag: "--class-status",
    label: "Class Status Overview",
    description: "Include class-wise stacked student status chart",
  },
] as const;

// Subtractives — things that are on by default but can be turned off
const SUBTRACTIVE_OPTIONS = [
  { key: "noCtc", flag: "--no-ctc", label: "Hide CTC Page" },
  { key: "noTimeline", flag: "--no-timeline", label: "Hide Timeline" },
] as const;

type AdditiveSectionKey = (typeof SECTION_OPTIONS)[number]["key"];
type SubtractiveSectionKey = (typeof SUBTRACTIVE_OPTIONS)[number]["key"];

type SectionsState = Record<AdditiveSectionKey, boolean> &
  Record<SubtractiveSectionKey, boolean>;

const DEFAULT_SECTIONS: SectionsState = {
  classwiseBreakdown: false,
  genderStats: false,
  companyDirectory: false,
  ctcBrackets: false,
  classStatus: false,
  noCtc: false,
  noTimeline: false,
};

function sectionsToFlags(sections: SectionsState): string[] {
  const flags: string[] = [];
  for (const opt of SECTION_OPTIONS) {
    if (sections[opt.key]) flags.push(opt.flag);
  }
  for (const opt of SUBTRACTIVE_OPTIONS) {
    if (sections[opt.key]) flags.push(opt.flag);
  }
  return flags;
}

function WorkflowStatusBadge({
  status,
  elapsedSeconds,
}: {
  status: ReturnType<typeof useWorkflowPoller>["status"];
  elapsedSeconds: number;
}) {
  if (status === "idle") return null;

  const elapsed =
    elapsedSeconds > 0
      ? ` · ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`
      : "";

  if (status === "queued")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        Queued{elapsed}
      </span>
    );

  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating{elapsed}
      </span>
    );

  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Done — report saved
      </span>
    );

  if (status === "failed" || status === "error")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
        <XCircle className="h-3.5 w-3.5" />
        Generation failed
      </span>
    );

  if (status === "timeout")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
        <AlertCircle className="h-3.5 w-3.5" />
        Timed out — check GitHub Actions
      </span>
    );

  return null;
}

export default function ExportPage() {
  const { data: session } = useSession();
  const { data, isLoading: dataLoading } = useDashboardData();
  const { reports, loading: reportsLoading, refresh } = useReports();
  const [sections, setSections] = useState<SectionsState>(DEFAULT_SECTIONS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  const { status: workflowStatus, elapsedSeconds, startPolling } =
    useWorkflowPoller(() => {
      refresh();
      toast.success("Report generated! Fetching latest…");
    });

  const isAdmin = session?.user?.role === "admin";
  const isBusy =
    isDispatching ||
    workflowStatus === "queued" ||
    workflowStatus === "in_progress";

  // Fetch existing reports on mount
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
            PDF export is restricted to placement cell staff.
          </p>
        </div>
      </div>
    );
  }

  const toggleSection = (key: keyof SectionsState) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    const flags = sectionsToFlags(sections);
    setIsDispatching(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags }),
      });
      const json = (await res.json()) as { runId?: number; error?: string };
      if (!res.ok || !json.runId) {
        throw new Error(json.error ?? "Dispatch failed");
      }
      startPolling(json.runId);
      toast.info("Workflow dispatched — generating report…");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start generation");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownload = (entry: ReportEntry) => {
    window.open(`/api/download/${entry.filename}`, "_blank");
  };

  const handleCSVExport = () => {
    if (!data) return;
    const students = data.students as StudentRecord[];
    if (!students.length || !("rollNo" in students[0])) {
      toast.error("Student data not available for CSV export.");
      return;
    }
    generateCSV(
      {
        headers: [
          "Roll No", "Reg No", "Name", "Gender", "Class", "Section",
          "Choice", "Status", "Companies", "Offer Count", "Best CTC",
        ],
        rows: students.map((s) => [
          s.rollNo, s.regNo, s.name, s.gender, s.class, s.section,
          s.choice, s.status, s.companies.join("; "),
          String(s.offers.length),
          s.bestOffer ? formatINRCompact(s.bestOffer.ctc) : "—",
        ]),
      },
      "SNU_Placement_Students_2022-26.csv"
    );
    toast.success("CSV exported successfully!");
  };

  const latest = reports[0] ?? null;
  const recent = reports.slice(1, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Export
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="h-3 w-3" />
            Admin Access
          </Badge>
          {reports.length > 0 && (
            <Link
              href="/dashboard/export/history"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View History ({reports.length})
            </Link>
          )}
        </div>
      </div>

      {/* Generator Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-xl text-foreground">
            Official Placement Report Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Runs on GitHub Actions — generates a PDF from live Google Sheets data and stores it in the reports branch.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Section toggles — plain checkbox style matching stats generator */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Report Sections
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SECTION_OPTIONS.map((option) => {
                const active = sections[option.key];
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleSection(option.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                      active
                        ? "border-blue-200 bg-blue-50/60"
                        : "border-border hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={active}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-blue-600 pointer-events-none"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced settings collapse */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  advancedOpen && "rotate-90"
                )}
              />
              Advanced settings
            </button>
            {advancedOpen && (
              <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
                {/* Subtractive toggles */}
                <div className="flex flex-wrap gap-2">
                  {SUBTRACTIVE_OPTIONS.map((opt) => {
                    const active = sections[opt.key];
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleSection(opt.key)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-3">
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-muted"
                    onClick={handleCSVExport}
                    disabled={dataLoading || !data}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Student CSV
                  </Button>
                  <p className="mt-1.5 text-xs text-muted-foreground text-center">
                    CSV includes all student PII. Admin only.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isBusy}
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 text-primary-foreground"
            >
              {isBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Generate PDF Report
            </Button>

            <WorkflowStatusBadge
              status={workflowStatus}
              elapsedSeconds={elapsedSeconds}
            />
          </div>

          {isBusy && (
            <p className="text-xs text-muted-foreground">
              Generation runs on GitHub Actions and typically takes 2–5 minutes. You can navigate away — the report will be saved to the history automatically.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Latest report preview */}
      {reportsLoading ? (
        <DashboardSkeleton />
      ) : (
        <ReportPreviewCard
          entry={latest}
          onDownload={latest ? () => handleDownload(latest) : undefined}
        />
      )}

      {/* Previous reports */}
      {recent.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Previous Reports
          </p>
          <div className="space-y-2">
            {recent.map((entry, i) => (
              <ReportHistoryItem
                key={entry.id}
                entry={entry}
                showIndex={i + 2}
                onDownload={() => handleDownload(entry)}
              />
            ))}
          </div>
          {reports.length > 3 && (
            <Link
              href="/dashboard/export/history"
              className="block text-center text-sm text-primary hover:text-primary/80 transition-colors pt-1"
            >
              View all {reports.length} reports →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
