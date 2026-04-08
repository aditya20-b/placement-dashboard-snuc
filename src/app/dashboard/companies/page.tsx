"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTableSort } from "@/hooks/use-table-sort";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import { PageTransition } from "@/components/dashboard/page-transition";
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { formatINRCompact, formatDate } from "@/lib/format";
import { CHART_COLORS, VALID_CLASS_SECTIONS, VALID_CLASSES } from "@/lib/constants";
import { useGroupByClass } from "@/contexts/group-by-class-context";
import { Input } from "@/components/ui/input";
import { Search, Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CompanyRow = {
  company: string;
  offerCount: number;
  percentage: number;
  dates: string;
  ctcRange: string;
  highestCtc: number;
  ctcValues: number[];
  offerDates: string[];
  earliestDate: string;
  visitedOnly: boolean;
  offCampus: boolean;
  companyType: string;
  companyDescription: string;
};

export default function CompaniesPage() {
  const { data, isLoading, error } = useDashboardData();
  const { groupByClass } = useGroupByClass();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Product Based" | "Service Based">("all");

  const filteredCompanies = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.companies.filter((c) => {
      if (!c.company.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && c.companyType !== typeFilter) return false;
      return true;
    });
  }, [data, search, typeFilter]);

  const companyRows = useMemo<CompanyRow[]>(
    () =>
      filteredCompanies.map((c) => ({
        company: c.company,
        offerCount: c.offerCount,
        percentage: c.percentage,
        dates:
          c.offerDates.length > 0
            ? c.offerDates.map(formatDate).join(", ")
            : "—",
        ctcRange:
          c.ctcValues.length > 0
            ? c.ctcValues.length === 1
              ? formatINRCompact(c.ctcValues[0])
              : `${formatINRCompact(c.ctcValues[c.ctcValues.length - 1])} - ${formatINRCompact(c.ctcValues[0])}`
            : "—",
        highestCtc: c.ctcValues[0] ?? 0,
        ctcValues: c.ctcValues,
        offerDates: c.offerDates,
        earliestDate: c.offerDates.length > 0 ? [...c.offerDates].sort()[0] : "9999-12-31",
        visitedOnly: c.visitedOnly ?? false,
        offCampus: c.offCampus ?? false,
        companyType: c.companyType ?? "",
        companyDescription: c.companyDescription ?? "",
      })),
    [filteredCompanies]
  );

  const tableSort = useTableSort<CompanyRow, keyof CompanyRow>(companyRows);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="p-6 text-center">
          <p className="text-error">Failed to load company data.</p>
        </div>
      </div>
    );
  }

  const { companies, companyClassBreakdown } = data;
  const totalCompanies = companies.length;
  const totalOffers = companies.reduce((s, c) => s + c.offerCount, 0);
  const avgPerCompany =
    totalCompanies > 0 ? (totalOffers / totalCompanies).toFixed(2) : "0";
  const offCampusCount = companies.filter((c) => c.offCampus).length;
  const productCount = companies.filter((c) => c.companyType === "Product Based").length;
  const serviceCount = companies.filter((c) => c.companyType === "Service Based").length;

  // All companies for stacked bar chart
  // When grouped: merge "AIDS A" + "AIDS B" → "AIDS", "IOT A" + "IOT B" → "IOT"
  const stackedBarData = companies.filter((c) => !c.visitedOnly).map((c) => {
    const breakdown = companyClassBreakdown[c.company] ?? {};
    if (groupByClass) {
      return {
        name: c.company,
        ...Object.fromEntries(
          VALID_CLASSES.map((cls) => {
            const total = VALID_CLASS_SECTIONS.filter((cs) =>
              cs.startsWith(cls)
            ).reduce((s, cs) => s + (breakdown[cs] ?? 0), 0);
            return [cls, total];
          })
        ),
      };
    }
    return {
      name: c.company,
      ...Object.fromEntries(
        VALID_CLASS_SECTIONS.map((cs) => [cs, breakdown[cs] ?? 0])
      ),
    };
  });

  const activeClassKeys = groupByClass ? VALID_CLASSES : VALID_CLASS_SECTIONS;
  const activeClassColors = groupByClass ? CHART_COLORS.classGrouped : CHART_COLORS.class;

  const chartHeight = Math.max(400, companies.length * 30);

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-gray-900">
            Companies
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <DataFreshness timestamp={data.timestamp} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Companies Visited" value={totalCompanies} />
        <StatCard title="Total Offers" value={totalOffers} />
        <StatCard
          title="Avg Offers / Company"
          value={Number(avgPerCompany)}
          format={(v) => v.toFixed(2)}
        />
        <StatCard
          title="Product / Service"
          value={productCount}
          format={(v) => `${v} / ${serviceCount}`}
        />
      </div>

      {/* Company-wise offers stacked bar — all companies */}
      <ChartCard
        title="Company-Wise Offers (All Companies)"
        description={groupByClass ? "Stacked by class" : "Stacked by class section"}
      >
        <div className="max-h-[600px] overflow-y-auto">
          <div style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                {activeClassKeys.map((cs) => (
                  <Bar
                    key={cs}
                    dataKey={cs}
                    stackId="a"
                    fill={activeClassColors[cs as keyof typeof activeClassColors]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {/* Company directory table */}
      <ChartCard
        title="Company Directory"
        description={offCampusCount > 0 ? `Includes ${offCampusCount} off-campus compan${offCampusCount === 1 ? "y" : "ies"}` : undefined}
      >
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 shrink-0">
            {([["all", "All"], ["Product Based", "Product"], ["Service Based", "Service"]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">#</TableHead>
                <SortableHeader label="Company" sortDirection={tableSort.getSortIndicator("company")} onSort={() => tableSort.requestSort("company")} />
                <SortableHeader label="Offers" sortDirection={tableSort.getSortIndicator("offerCount")} onSort={() => tableSort.requestSort("offerCount")} className="text-center" />
                <SortableHeader label="Dates" sortDirection={tableSort.getSortIndicator("earliestDate")} onSort={() => tableSort.requestSort("earliestDate")} className="hidden sm:table-cell" />
                <SortableHeader label="CTC Range" sortDirection={tableSort.getSortIndicator("highestCtc")} onSort={() => tableSort.requestSort("highestCtc")} className="text-right hidden sm:table-cell" />
                <SortableHeader label="CTC" sortDirection={tableSort.getSortIndicator("highestCtc")} onSort={() => tableSort.requestSort("highestCtc")} className="text-right sm:hidden" />
                <SortableHeader label="%" sortDirection={tableSort.getSortIndicator("percentage")} onSort={() => tableSort.requestSort("percentage")} className="text-right hidden sm:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableSort.sortedData.map((row, i) => (
                <TableRow key={row.company} className={row.visitedOnly ? "opacity-60" : ""}>
                  <TableCell className="hidden sm:table-cell">{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="truncate max-w-35 sm:max-w-none">{row.company}</span>
                      {row.companyDescription && (
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0 cursor-help">
                              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-64">
                            {row.companyDescription}
                          </TooltipContent>
                        </UITooltip>
                      )}
                      {row.companyType === "Product Based" && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 border border-blue-200 shrink-0">
                          Product
                        </span>
                      )}
                      {row.companyType === "Service Based" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 border border-emerald-200 shrink-0">
                          Service
                        </span>
                      )}
                      {row.visitedOnly && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 shrink-0">
                          No Hires
                        </span>
                      )}
                      {row.offCampus && (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600 border border-purple-200 shrink-0">
                          Off-Campus
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{row.offerCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {row.dates}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                    {row.ctcRange}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs sm:hidden">
                    {row.ctcValues.length > 0 ? formatINRCompact(row.ctcValues[0]) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono hidden sm:table-cell">
                    {row.visitedOnly ? "—" : `${row.percentage.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
    </PageTransition>
  );
}
