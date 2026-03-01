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
import { CHART_COLORS, VALID_CLASS_SECTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  ctcValues: number[];
  offerDates: string[];
};

export default function CompaniesPage() {
  const { data, isLoading, error } = useDashboardData();
  const [search, setSearch] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.companies.filter((c) =>
      c.company.toLowerCase().includes(q)
    );
  }, [data, search]);

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
        ctcValues: c.ctcValues,
        offerDates: c.offerDates,
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

  // All companies for stacked bar chart
  const stackedBarData = companies.map((c) => {
    const breakdown = companyClassBreakdown[c.company] ?? {};
    return {
      name: c.company,
      ...Object.fromEntries(
        VALID_CLASS_SECTIONS.map((cs) => [cs, breakdown[cs] ?? 0])
      ),
    };
  });

  const chartHeight = Math.max(400, companies.length * 30);

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-gray-900">
            Companies
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <DataFreshness timestamp={data.timestamp} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Companies Visited" value={totalCompanies} />
        <StatCard title="Total Offers" value={totalOffers} />
        <StatCard
          title="Avg Offers / Company"
          value={Number(avgPerCompany)}
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* Company-wise offers stacked bar — all companies */}
      <ChartCard
        title="Company-Wise Offers (All Companies)"
        description="Stacked by class section"
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
                {VALID_CLASS_SECTIONS.map((cs) => (
                  <Bar
                    key={cs}
                    dataKey={cs}
                    stackId="a"
                    fill={CHART_COLORS.class[cs]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {/* Company directory table */}
      <ChartCard title="Company Directory">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <SortableHeader label="Company" sortDirection={tableSort.getSortIndicator("company")} onSort={() => tableSort.requestSort("company")} />
                <SortableHeader label="Offers" sortDirection={tableSort.getSortIndicator("offerCount")} onSort={() => tableSort.requestSort("offerCount")} className="text-center" />
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">CTC Range</TableHead>
                <SortableHeader label="%" sortDirection={tableSort.getSortIndicator("percentage")} onSort={() => tableSort.requestSort("percentage")} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableSort.sortedData.map((row, i) => (
                <TableRow key={row.company}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{row.company}</TableCell>
                  <TableCell className="text-center">{row.offerCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.dates}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.ctcRange}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.percentage.toFixed(1)}%
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
