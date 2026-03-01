"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/dashboard/page-transition";
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { formatINRCompact } from "@/lib/format";
import { CHART_COLORS } from "@/lib/constants";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PercentileRow = { percent: number; average: number };
type TopOfferRow = { rank: number; studentName: string; company: string; ctc: number; offerType: string };

export default function CTCPage() {
  const { data, isLoading, error } = useDashboardData();

  // Hooks must be called before any early returns
  const percentileRows = useMemo<PercentileRow[]>(() => {
    if (!data) return [];
    return data.ctc.topPercentiles.map((row) => ({
      percent: row.percent,
      average: Math.round(row.average),
    }));
  }, [data]);
  const percentileSort = useTableSort<PercentileRow, "percent" | "average">(percentileRows);

  const topOfferRows = useMemo<TopOfferRow[]>(() => {
    if (!data) return [];
    return data.topOffers.map((o, i) => ({
      rank: i + 1,
      studentName: o.studentName,
      company: o.company,
      ctc: o.ctc,
      offerType: o.offerType,
    }));
  }, [data]);
  const topOfferSort = useTableSort<TopOfferRow, "studentName" | "company" | "ctc" | "offerType">(topOfferRows);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="p-6 text-center">
          <p className="text-error">Failed to load CTC data.</p>
        </div>
      </div>
    );
  }

  const { ctc, topOffers } = data;

  // Percentile curve data (ascending)
  const percentileCurve = ctc.percentileValues.map((p) => ({
    percentile: p.n,
    value: p.value,
  }));

  // CTC vs date scatter data — built from individual offers
  const scatterData = data.students
    .flatMap((s) =>
      s.offers
        .filter((o) => o.offerType !== "Internship" && o.offerDate && o.ctc > 0)
        .map((o) => ({
          date: o.offerDate as string,
          ctc: o.ctc,
          company: o.company,
        }))
    );

  // Vibrant multi-hue for histogram
  const histogramColors = [
    "#93C5FD",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#7C3AED",
  ];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-gray-900">
            CTC Analytics
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <DataFreshness timestamp={data.timestamp} />
      </div>

      {/* CTC stat cards */}
      <StaggerContainer>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Highest CTC"
          value={ctc.highest}
          format={(v) => formatINRCompact(v)}
        />
        <StatCard
          title="Lowest CTC"
          value={ctc.lowest}
          format={(v) => formatINRCompact(v)}
        />
        <StatCard
          title="Average CTC"
          value={Math.round(ctc.average)}
          format={(v) => formatINRCompact(v)}
        />
        <StatCard
          title="Median CTC"
          value={ctc.median}
          format={(v) => formatINRCompact(v)}
        />
      </div>
      </StaggerContainer>

      {/* CTC Distribution Histogram */}
      <ChartCard
        title="CTC Distribution"
        description="Number of offers per CTC range (excluding internships)"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ctc.bucketDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ctc.bucketDistribution.map((_, i) => (
                  <Cell
                    key={i}
                    fill={histogramColors[i % histogramColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top N% Averages Table */}
        <ChartCard title="Top N% Averages">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Top %" sortDirection={percentileSort.getSortIndicator("percent")} onSort={() => percentileSort.requestSort("percent")} />
                <SortableHeader label="Average CTC" sortDirection={percentileSort.getSortIndicator("average")} onSort={() => percentileSort.requestSort("average")} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {percentileSort.sortedData.map((row) => (
                <TableRow key={row.percent}>
                  <TableCell>Top {row.percent}%</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINRCompact(row.average)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>

        {/* Percentile Curve */}
        <ChartCard title="Percentile Curve">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={percentileCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentile" unit="th" />
                <YAxis
                  tickFormatter={(v) => formatINRCompact(v)}
                />
                <Tooltip
                  formatter={(value) => formatINRCompact(Number(value))}
                />
                <ReferenceLine
                  y={ctc.average}
                  stroke={CHART_COLORS.sequential[1]}
                  strokeDasharray="5 5"
                  label="Avg"
                />
                <ReferenceLine
                  y={ctc.median}
                  stroke={CHART_COLORS.sequential[2]}
                  strokeDasharray="5 5"
                  label="Median"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.sequential[0]}
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* CTC vs Date Scatter */}
      {scatterData.length > 0 && (
        <ChartCard
          title="CTC vs Offer Date"
          description="Each point represents an offer"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="Date" />
                <YAxis
                  dataKey="ctc"
                  name="CTC"
                  tickFormatter={(v) => formatINRCompact(v)}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "CTC" ? formatINRCompact(Number(value)) : value
                  }
                />
                <Scatter
                  data={scatterData}
                  fill={CHART_COLORS.sequential[0]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Top Offers Table */}
      <ChartCard title="Top Offers" description="Highest CTC offers (excluding internships)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <SortableHeader label="Student" sortDirection={topOfferSort.getSortIndicator("studentName")} onSort={() => topOfferSort.requestSort("studentName")} />
              <SortableHeader label="Company" sortDirection={topOfferSort.getSortIndicator("company")} onSort={() => topOfferSort.requestSort("company")} />
              <SortableHeader label="CTC" sortDirection={topOfferSort.getSortIndicator("ctc")} onSort={() => topOfferSort.requestSort("ctc")} className="text-right" />
              <SortableHeader label="Type" sortDirection={topOfferSort.getSortIndicator("offerType")} onSort={() => topOfferSort.requestSort("offerType")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {topOfferSort.sortedData.map((offer, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">
                  {offer.studentName}
                </TableCell>
                <TableCell>{offer.company}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatINRCompact(offer.ctc)}
                </TableCell>
                <TableCell>{offer.offerType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ChartCard>
    </div>
    </PageTransition>
  );
}
