"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { PageTransition, StaggerContainer } from "@/components/dashboard/page-transition";
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { formatINRCompact } from "@/lib/format";
import { CHART_COLORS, VALID_CLASS_SECTIONS, VALID_CLASSES } from "@/lib/constants";
import { useGroupByClass } from "@/contexts/group-by-class-context";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  LabelList,
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
type TopOfferRow = { rank: number; company: string; ctc: number; offerType: string };

export default function CTCPage() {
  const { data, isLoading, error } = useDashboardData();
  const { groupByClass } = useGroupByClass();

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
      company: o.company,
      ctc: o.ctc,
      offerType: o.offerType,
    }));
  }, [data]);
  const topOfferSort = useTableSort<TopOfferRow, "company" | "ctc" | "offerType">(topOfferRows);

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

  const { ctc } = data;

  // Merge ctcByClass into classes (AIDS A + AIDS B → AIDS) when groupByClass is on
  const ctcByClassData = groupByClass
    ? VALID_CLASSES.map((cls) => {
        const sections = ctc.ctcByClass.filter((d) =>
          VALID_CLASS_SECTIONS.filter((cs) => cs.startsWith(cls)).includes(d.classSection as typeof VALID_CLASS_SECTIONS[number])
        );
        if (sections.length === 0) return null;
        const totalCount = sections.reduce((s, d) => s + d.count, 0);
        const weightedAvg = sections.reduce((s, d) => s + d.average * d.count, 0) / totalCount;
        const weightedMed = sections.reduce((s, d) => s + d.median * d.count, 0) / totalCount;
        return { classSection: cls, average: weightedAvg, median: weightedMed, count: totalCount };
      }).filter(Boolean) as typeof ctc.ctcByClass
    : ctc.ctcByClass;

  // Box plot as line chart
  const boxPlotData = [
    { label: "Min", value: ctc.boxPlot.min },
    { label: "P25", value: ctc.boxPlot.p25 },
    { label: "Median", value: ctc.boxPlot.median },
    { label: "Average", value: Math.round(ctc.boxPlot.average) },
    { label: "P75", value: ctc.boxPlot.p75 },
    { label: "P90", value: ctc.boxPlot.p90 },
    { label: "P99", value: ctc.boxPlot.p99 },
    { label: "Max", value: ctc.boxPlot.max },
  ];
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-gray-900">
            CTC Analytics
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <DataFreshness timestamp={data.timestamp} />
      </div>

      {/* CTC stat cards */}
      <StaggerContainer>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
                  <Cell key={i} fill={histogramColors[i % histogramColors.length]} />
                ))}
                <LabelList dataKey="count" position="top" fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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

        {/* Box Plot Summary — line chart showing the distribution spread */}
        <ChartCard title="CTC Distribution Summary" description="Spread across Min, P25, Median, Average, P75, P90, P99, Max">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={boxPlotData} margin={{ top: 24, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => formatINRCompact(v)} />
                <Tooltip formatter={(v) => formatINRCompact(Number(v))} />
                <ReferenceLine y={ctc.boxPlot.average} stroke={CHART_COLORS.sequential[1]} strokeDasharray="5 5" label={{ value: "Avg", position: "insideTopRight", fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.sequential[0]} strokeWidth={2} dot={{ r: 5, fill: CHART_COLORS.sequential[0] }}>
                  <LabelList dataKey="value" position="top" fontSize={11} formatter={(v: unknown) => formatINRCompact(Number(v))} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* CTC by Class — respects groupByClass toggle */}
      {ctcByClassData.length > 0 && (
        <ChartCard title={`Average CTC by ${groupByClass ? "Class" : "Class Section"}`} description="Best offer per student, excluding internships">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ctcByClassData} margin={{ top: 24, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="classSection" />
                <YAxis tickFormatter={(v) => formatINRCompact(v)} />
                <Tooltip formatter={(v) => formatINRCompact(Number(v))} />
                <Legend />
                <Bar dataKey="average" name="Avg CTC" fill={CHART_COLORS.sequential[0]} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="average" position="top" fontSize={11} fontWeight={600} formatter={(v: unknown) => formatINRCompact(Number(v))} />
                </Bar>
                <Bar dataKey="median" name="Median CTC" fill={CHART_COLORS.sequential[1]} radius={[4, 4, 0, 0]} opacity={0.75}>
                  <LabelList dataKey="median" position="top" fontSize={11} formatter={(v: unknown) => formatINRCompact(Number(v))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Top Offers Table */}
      <ChartCard title="Top Offers" description="Highest CTC offers (excluding internships)">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <SortableHeader label="Company" sortDirection={topOfferSort.getSortIndicator("company")} onSort={() => topOfferSort.requestSort("company")} />
              <SortableHeader label="CTC" sortDirection={topOfferSort.getSortIndicator("ctc")} onSort={() => topOfferSort.requestSort("ctc")} className="text-right" />
              <SortableHeader label="Type" sortDirection={topOfferSort.getSortIndicator("offerType")} onSort={() => topOfferSort.requestSort("offerType")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {topOfferSort.sortedData.map((offer, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{offer.company}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatINRCompact(offer.ctc)}
                </TableCell>
                <TableCell>{offer.offerType}</TableCell>
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
