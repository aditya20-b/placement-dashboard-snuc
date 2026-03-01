"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/dashboard/page-transition";
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { formatINRCompact } from "@/lib/format";
import { CHART_COLORS } from "@/lib/constants";
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

export default function CTCPage() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <p className="text-error">Failed to load CTC data.</p>
      </div>
    );
  }

  const { ctc, topOffers } = data;

  // Percentile curve data (ascending)
  const percentileCurve = ctc.percentileValues.map((p) => ({
    percentile: p.n,
    value: p.value,
  }));

  // CTC vs date scatter data
  const scatterData = data.companies.flatMap((c) =>
    c.offerDates.map((date, i) => ({
      date,
      ctc: c.ctcValues[i] ?? 0,
      company: c.company,
    }))
  ).filter((d) => d.date && d.ctc > 0);

  // Blue gradient for histogram
  const blueGradient = [
    "#CCE1F3",
    "#99C3E7",
    "#66A5DB",
    "#3387CF",
    "#0056A2",
    "#003A6B",
  ];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-gray-900">
          CTC Analytics
        </h1>
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
                    fill={blueGradient[i % blueGradient.length]}
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
                <TableHead>Top %</TableHead>
                <TableHead className="text-right">Average CTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctc.topPercentiles.map((row) => (
                <TableRow key={row.percent}>
                  <TableCell>Top {row.percent}%</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINRCompact(Math.round(row.average))}
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
              <TableHead>Student</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">CTC</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topOffers.map((offer, i) => (
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
