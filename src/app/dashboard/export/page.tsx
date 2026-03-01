"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileDown, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generatePDFReport, generateCSV } from "@/lib/export-pdf";
import { formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentRecord } from "@/types";

const SECTION_OPTIONS = [
  { key: "executiveSummary", label: "Executive Summary", description: "Totals, placement percentage, key metrics" },
  { key: "classwiseBreakdown", label: "Class-Wise Breakdown", description: "Per-class stats table" },
  { key: "ctcAnalysis", label: "CTC Analysis", description: "Percentiles, averages, distribution" },
  { key: "topOffers", label: "Top Offers", description: "Top 10 offers by CTC" },
  { key: "companyDirectory", label: "Company Directory", description: "All companies with offer counts" },
  { key: "genderStats", label: "Gender Diversity Stats", description: "Male/Female placement % per class" },
] as const;

type SectionKey = (typeof SECTION_OPTIONS)[number]["key"];

export default function ExportPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useDashboardData();
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    executiveSummary: true,
    classwiseBreakdown: true,
    ctcAnalysis: true,
    topOffers: true,
    companyDirectory: true,
    genderStats: true,
  });
  const [generating, setGenerating] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <div className="rounded-full bg-blue-50 p-3 ring-4 ring-blue-500/5">
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="font-heading text-xl font-semibold">Admin Access Required</h2>
          <p className="text-muted-foreground">
            PDF export is restricted to placement cell staff.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="p-6 text-center">
          <p className="text-error">Failed to load data for export.</p>
        </div>
      </div>
    );
  }

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePDFExport = async () => {
    setGenerating(true);
    try {
      const doc = await generatePDFReport(
        {
          overview: data.overview,
          ctc: data.ctc,
          companies: data.companies,
          topOffers: data.topOffers,
        },
        sections
      );
      doc.save("SNU_Placement_Report_2022-26.pdf");
      toast.success("PDF report generated successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCSVExport = () => {
    const students = data.students as StudentRecord[];
    if (!students.length || !("rollNo" in students[0])) {
      toast.error("Student data not available for CSV export.");
      return;
    }

    generateCSV(
      {
        headers: [
          "Roll No",
          "Reg No",
          "Name",
          "Gender",
          "Class",
          "Section",
          "Choice",
          "Status",
          "Companies",
          "Offer Count",
          "Best CTC",
        ],
        rows: students.map((s) => [
          s.rollNo,
          s.regNo,
          s.name,
          s.gender,
          s.class,
          s.section,
          s.choice,
          s.status,
          s.companies.join("; "),
          String(s.offers.length),
          s.bestOffer ? formatINRCompact(s.bestOffer.ctc) : "—",
        ]),
      },
      "SNU_Placement_Students_2022-26.csv"
    );
    toast.success("CSV exported successfully!");
  };

  const selectedCount = Object.values(sections).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-gray-900">
            Export
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
          <Sparkles className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Official Placement Report Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select sections to include in the PDF report
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section checkboxes */}
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTION_OPTIONS.map((option) => (
              <label
                key={option.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  sections[option.key]
                    ? "border-blue-200 bg-blue-50/50"
                    : "hover:border-gray-300 hover:bg-blue-50/30"
                )}
              >
                <input
                  type="checkbox"
                  checked={sections[option.key]}
                  onChange={() => toggleSection(option.key)}
                  className="mt-0.5 h-4 w-4 rounded accent-blue-500"
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePDFExport}
              disabled={generating || selectedCount === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Generate PDF Report
              <Badge variant="secondary" className="ml-2">
                {selectedCount} sections
              </Badge>
            </Button>

            <Button variant="outline" onClick={handleCSVExport}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Student CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
