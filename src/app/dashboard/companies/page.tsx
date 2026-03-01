"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
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

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <p className="text-error">Failed to load company data.</p>
      </div>
    );
  }

  const { companies, companyClassBreakdown } = data;
  const totalCompanies = companies.length;
  const totalOffers = companies.reduce((s, c) => s + c.offerCount, 0);
  const avgPerCompany =
    totalCompanies > 0 ? (totalOffers / totalCompanies).toFixed(2) : "0";

  // Top 15 companies for stacked bar chart
  const topCompanies = companies.slice(0, 15);
  const stackedBarData = topCompanies.map((c) => {
    const breakdown = companyClassBreakdown[c.company] ?? {};
    return {
      name: c.company,
      ...Object.fromEntries(
        VALID_CLASS_SECTIONS.map((cs) => [cs, breakdown[cs] ?? 0])
      ),
    };
  });

  return (
    <div className="space-y-6">
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

      {/* Company-wise offers stacked bar */}
      <ChartCard
        title="Company-Wise Offers (Top 15)"
        description="Stacked by class section"
      >
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
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
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Offers</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">CTC Range</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((c, i) => (
                <TableRow key={c.company}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{c.company}</TableCell>
                  <TableCell className="text-center">{c.offerCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.offerDates.length > 0
                      ? c.offerDates.map(formatDate).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {c.ctcValues.length > 0
                      ? c.ctcValues.length === 1
                        ? formatINRCompact(c.ctcValues[0])
                        : `${formatINRCompact(
                            c.ctcValues[c.ctcValues.length - 1]
                          )} - ${formatINRCompact(c.ctcValues[0])}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
