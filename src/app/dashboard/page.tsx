"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/dashboard/page-transition";
import { CHART_COLORS } from "@/lib/constants";
import { formatINRCompact } from "@/lib/format";
import { useGroupByClass } from "@/contexts/group-by-class-context";
import type { ClassStats } from "@/types/stats";
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import {
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  Building2,
  GraduationCap,
  UserX,
  Pause,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  LineChart,
  Line,
  ReferenceDot,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CLASSWISE_COLORS: Record<string, string> = {
  Placed: "#10B981",
  "Not Placed": "#EF4444",
  "Higher Studies": "#8B5CF6",
  "Opted Out": "#06B6D4",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NonZeroLabel(props: any) {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fill="#fff"
      fontWeight={600}
    >
      {value}
    </text>
  );
}

type ClassRow = {
  classSection: string;
  total: number;
  male: number;
  female: number;
  opted: number;
  hs: number;
  exempt: number;
  placed: number;
  notPlaced: number;
  hold: number;
  dropped: number;
  placementPercent: number;
  malePlacedPercent: number;
  femalePlacedPercent: number;
};

type MergedClassStats = Omit<ClassStats, "classSection"> & { classSection: string };

function mergeClassStats(stats: ClassStats[]): MergedClassStats[] {
  const groups: Record<string, ClassStats[]> = {};
  for (const cs of stats) {
    // "AIDS A" / "AIDS B" → "AIDS", "IOT A" / "IOT B" → "IOT", "CS" → "CS"
    const key = cs.classSection.split(" ")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(cs);
  }
  return Object.entries(groups).map(([key, rows]) => {
    const total = rows.reduce((s, r) => s + r.total, 0);
    const male = rows.reduce((s, r) => s + r.male, 0);
    const female = rows.reduce((s, r) => s + r.female, 0);
    const optedPlacement = rows.reduce((s, r) => s + r.optedPlacement, 0);
    const optedHigherStudies = rows.reduce((s, r) => s + r.optedHigherStudies, 0);
    const placementExempt = rows.reduce((s, r) => s + r.placementExempt, 0);
    const placed = rows.reduce((s, r) => s + r.placed, 0);
    const notPlaced = rows.reduce((s, r) => s + r.notPlaced, 0);
    const hold = rows.reduce((s, r) => s + r.hold, 0);
    const dropped = rows.reduce((s, r) => s + r.dropped, 0);
    const offers = rows.reduce((s, r) => s + r.offers, 0);
    // Recompute percentages from summed values
    const malePlaced = rows.reduce((s, r) => {
      const maleOpted = r.male > 0 ? r.optedPlacement * (r.male / r.total) : 0;
      return s + (maleOpted > 0 ? (r.malePlacedPercent / 100) * maleOpted : 0);
    }, 0);
    const femPlaced = rows.reduce((s, r) => {
      const femOpted = r.female > 0 ? r.optedPlacement * (r.female / r.total) : 0;
      return s + (femOpted > 0 ? (r.femalePlacedPercent / 100) * femOpted : 0);
    }, 0);
    const maleOpted = male > 0 && total > 0 ? optedPlacement * (male / total) : 0;
    const femOpted = female > 0 && total > 0 ? optedPlacement * (female / total) : 0;
    return {
      classSection: key,
      total,
      male,
      female,
      optedPlacement,
      optedHigherStudies,
      placementExempt,
      placed,
      notPlaced,
      hold,
      dropped,
      offers,
      placementPercent: optedPlacement > 0 ? (placed / optedPlacement) * 100 : 0,
      malePlacedPercent: maleOpted > 0 ? (malePlaced / maleOpted) * 100 : 0,
      femalePlacedPercent: femOpted > 0 ? (femPlaced / femOpted) * 100 : 0,
    };
  });
}

const mqSubscribe = (cb: () => void) => {
  const mql = window.matchMedia("(min-width: 640px)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const mqSnapshot = () => window.matchMedia("(min-width: 640px)").matches;
const mqServerSnapshot = () => true;

export default function OverviewPage() {
  const { data, isLoading, error } = useDashboardData();
  const { groupByClass } = useGroupByClass();
  const isSmUp = useSyncExternalStore(mqSubscribe, mqSnapshot, mqServerSnapshot);

  // Hooks must be called before any early returns
  const activeClassStats = useMemo((): MergedClassStats[] => {
    if (!data) return [];
    if (groupByClass) return mergeClassStats(data.overview.classwiseStats);
    return data.overview.classwiseStats.map((cs) => ({ ...cs }));
  }, [data, groupByClass]);

  const classwiseRows = useMemo<ClassRow[]>(() => {
    if (!data) return [];
    return activeClassStats.map((cs) => ({
      classSection: cs.classSection,
      total: cs.total,
      male: cs.male,
      female: cs.female,
      opted: cs.optedPlacement,
      hs: cs.optedHigherStudies,
      exempt: cs.placementExempt,
      placed: cs.placed,
      notPlaced: cs.notPlaced,
      hold: cs.hold,
      dropped: cs.dropped,
      placementPercent: cs.placementPercent,
      malePlacedPercent: cs.malePlacedPercent,
      femalePlacedPercent: cs.femalePlacedPercent,
    }));
  }, [activeClassStats]);
  const classSort = useTableSort<ClassRow, keyof ClassRow>(classwiseRows);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="p-6 text-center">
          <p className="text-error">Failed to load dashboard data.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  const { overview } = data;

  const classColors = groupByClass ? CHART_COLORS.classGrouped : CHART_COLORS.class;

  const placementBarData = activeClassStats.map((cs) => ({
    name: cs.classSection,
    "Placement %": Number(cs.placementPercent.toFixed(1)),
  }));

  const classwiseOverviewData = activeClassStats.map((cs) => ({
    name: cs.classSection,
    Placed: cs.placed,
    "Not Placed": cs.notPlaced,
    "Higher Studies": cs.optedHigherStudies,
    "Opted Out": cs.placementExempt,
    total: cs.total,
  }));

  const genderData = activeClassStats.map((cs) => ({
    name: cs.classSection,
    "Male %": Number(cs.malePlacedPercent.toFixed(1)),
    "Female %": Number(cs.femalePlacedPercent.toFixed(1)),
  }));

  const statusData = [
    {
      name: "Placed",
      value: activeClassStats.reduce((s, c) => s + c.placed, 0),
      color: CHART_COLORS.status.Placed,
    },
    {
      name: "Not Placed",
      value: activeClassStats.reduce((s, c) => s + c.notPlaced, 0),
      color: CHART_COLORS.status["Not Placed"],
    },
    {
      name: "Hold",
      value: activeClassStats.reduce((s, c) => s + c.hold, 0),
      color: CHART_COLORS.status.Hold,
    },
    {
      name: "Dropped",
      value: activeClassStats.reduce((s, c) => s + c.dropped, 0),
      color: CHART_COLORS.status.Dropped,
    },
  ].filter((d) => d.value > 0);

  const totalNotPlaced = activeClassStats.reduce(
    (s, c) => s + c.notPlaced,
    0
  );
  const totalHold = activeClassStats.reduce((s, c) => s + c.hold, 0);
  const totalDropped = activeClassStats.reduce(
    (s, c) => s + c.dropped,
    0
  );

  // Totals for expanded table
  const totals = activeClassStats.reduce(
    (acc, cs) => ({
      total: acc.total + cs.total,
      male: acc.male + cs.male,
      female: acc.female + cs.female,
      opted: acc.opted + cs.optedPlacement,
      hs: acc.hs + cs.optedHigherStudies,
      exempt: acc.exempt + cs.placementExempt,
      placed: acc.placed + cs.placed,
      notPlaced: acc.notPlaced + cs.notPlaced,
      hold: acc.hold + cs.hold,
      dropped: acc.dropped + cs.dropped,
      offers: acc.offers + cs.offers,
    }),
    {
      total: 0,
      male: 0,
      female: 0,
      opted: 0,
      hs: 0,
      exempt: 0,
      placed: 0,
      notPlaced: 0,
      hold: 0,
      dropped: 0,
      offers: 0,
    }
  );
  const totalPlacementPct =
    totals.opted > 0 ? ((totals.placed / totals.opted) * 100).toFixed(1) : "0.0";

  // Timeline — cumulative offers over time
  const timelineData = data.timeline ?? [];
  const timelineSorted = [...timelineData].sort((a, b) => a.date.localeCompare(b.date));
  const cumulativeTimeline = (() => {
    let running = 0;
    const byDate = new Map<string, number>();
    for (const e of timelineSorted) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.count);
    }
    return Array.from(byDate.entries()).map(([date, count]) => {
      running += count;
      return {
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        newOffers: count,
        cumulative: running,
      };
    });
  })();

  // Milestone dates — based on unique students placed (first offer date per student)
  // Students with offers but no recorded dates are counted before the first dated entry
  const placementMilestones = (() => {
    const firstOfferByDate = new Map<string, number>();
    let undatedStudents = 0;
    for (const student of data.students) {
      if (student.offers.length === 0) continue;
      const dates = student.offers
        .map((o) => o.offerDate)
        .filter((d): d is string => d !== null)
        .sort();
      if (dates.length === 0) {
        undatedStudents++;
        continue;
      }
      const first = dates[0];
      firstOfferByDate.set(first, (firstOfferByDate.get(first) ?? 0) + 1);
    }
    const sorted = Array.from(firstOfferByDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cumStudents = undatedStudents; // front-load undated placed students
    const milestoneMap = new Map<number, string>(); // pct → formatted date
    for (const [isoDate, count] of sorted) {
      cumStudents += count;
      for (const pct of [25, 50, 75, 85, 90, 100]) {
        if (milestoneMap.has(pct)) continue;
        const threshold = Math.round((pct / 100) * totals.opted);
        if (cumStudents >= threshold) {
          milestoneMap.set(
            pct,
            new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          );
        }
      }
    }
    return milestoneMap;
  })();

  // Offer type breakdown for donut
  const offerTypeData = (data.overview.offerTypeBreakdown ?? []).map((d) => ({
    name: d.offerType,
    value: d.count,
    color: CHART_COLORS.offerType[d.offerType as keyof typeof CHART_COLORS.offerType] ?? CHART_COLORS.sequential[0],
  }));



  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with freshness indicator */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-gray-900">
              Overview
            </h1>
            <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
          </div>
          <DataFreshness timestamp={data.timestamp} />
        </div>

        {/* Row 1 — Student Distribution */}
        <StaggerContainer>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StaggerItem>
              <StatCard
                title="Total Students"
                value={overview.totalStudents}
                icon={Users}
                iconColor="text-blue-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Opted Placement"
                value={overview.optedPlacement}
                icon={Briefcase}
                iconColor="text-gold-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Higher Studies"
                value={overview.optedHigherStudies}
                icon={GraduationCap}
                iconColor="text-purple-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Opted Out"
                value={overview.placementExempt}
                icon={UserX}
                iconColor="text-gray-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Companies"
                value={overview.uniqueCompanies}
                icon={Building2}
                iconColor="text-blue-400"
              />
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Row 2 — Placement Pipeline */}
        <StaggerContainer>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
            <StaggerItem>
              <StatCard
                title="Placement Rate"
                value={Math.round(overview.placementPercent * 10) / 10}
                suffix="%"
                format={(v) => v.toFixed(1)}
                icon={TrendingUp}
                iconColor="text-info"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Placed"
                value={overview.totalPlaced}
                icon={UserCheck}
                iconColor="text-success"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Not Placed"
                value={totalNotPlaced}
                icon={UserX}
                iconColor="text-error"
              />
            </StaggerItem>
            {totalHold > 0 && (
              <StaggerItem>
                <StatCard
                  title="Hold"
                  value={totalHold}
                  icon={Pause}
                  iconColor="text-warning"
                />
              </StaggerItem>
            )}
            {totalDropped > 0 && (
              <StaggerItem>
                <StatCard
                  title="Dropped"
                  value={totalDropped}
                  icon={XCircle}
                  iconColor="text-gray-400"
                />
              </StaggerItem>
            )}
          </div>
        </StaggerContainer>

        {/* Expanded Class-wise Summary Table */}
        <ChartCard title={groupByClass ? "Class Summary" : "Class-Wise Summary"}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Class" sortDirection={classSort.getSortIndicator("classSection")} onSort={() => classSort.requestSort("classSection")} />
                  <SortableHeader label="Total" sortDirection={classSort.getSortIndicator("total")} onSort={() => classSort.requestSort("total")} className="text-right" />
                  <SortableHeader label="Male" sortDirection={classSort.getSortIndicator("male")} onSort={() => classSort.requestSort("male")} className="text-right hidden sm:table-cell" />
                  <SortableHeader label="Female" sortDirection={classSort.getSortIndicator("female")} onSort={() => classSort.requestSort("female")} className="text-right hidden sm:table-cell" />
                  <SortableHeader label="Opted" sortDirection={classSort.getSortIndicator("opted")} onSort={() => classSort.requestSort("opted")} className="text-right" />
                  <SortableHeader label="Higher Studies" sortDirection={classSort.getSortIndicator("hs")} onSort={() => classSort.requestSort("hs")} className="text-right hidden md:table-cell" />
                  <SortableHeader label="Opted Out" sortDirection={classSort.getSortIndicator("exempt")} onSort={() => classSort.requestSort("exempt")} className="text-right hidden md:table-cell" />
                  <SortableHeader label="Placed" sortDirection={classSort.getSortIndicator("placed")} onSort={() => classSort.requestSort("placed")} className="text-right" />
                  <SortableHeader label="Not Placed" sortDirection={classSort.getSortIndicator("notPlaced")} onSort={() => classSort.requestSort("notPlaced")} className="text-right hidden sm:table-cell" />
                  <SortableHeader label="Placement %" sortDirection={classSort.getSortIndicator("placementPercent")} onSort={() => classSort.requestSort("placementPercent")} className="text-right" />
                  <SortableHeader label="Male %" sortDirection={classSort.getSortIndicator("malePlacedPercent")} onSort={() => classSort.requestSort("malePlacedPercent")} className="text-right hidden lg:table-cell" />
                  <SortableHeader label="Female %" sortDirection={classSort.getSortIndicator("femalePlacedPercent")} onSort={() => classSort.requestSort("femalePlacedPercent")} className="text-right hidden lg:table-cell" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classSort.sortedData.map((cs) => (
                  <TableRow key={cs.classSection}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {cs.classSection}
                    </TableCell>
                    <TableCell className="text-right">{cs.total}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{cs.male}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{cs.female}</TableCell>
                    <TableCell className="text-right">{cs.opted}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{cs.hs}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{cs.exempt}</TableCell>
                    <TableCell className="text-right">{cs.placed}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{cs.notPlaced}</TableCell>
                    <TableCell className="text-right font-mono">
                      {cs.placementPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono hidden lg:table-cell">
                      {cs.malePlacedPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono hidden lg:table-cell">
                      {cs.femalePlacedPercent.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold border-t-2">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{totals.total}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{totals.male}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{totals.female}</TableCell>
                  <TableCell className="text-right">{totals.opted}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{totals.hs}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{totals.exempt}</TableCell>
                  <TableCell className="text-right">{totals.placed}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{totals.notPlaced}</TableCell>
                  <TableCell className="text-right font-mono">
                    {totalPlacementPct}%
                  </TableCell>
                  <TableCell className="text-right font-mono hidden lg:table-cell">-</TableCell>
                  <TableCell className="text-right font-mono hidden lg:table-cell">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ChartCard>

        {/* Charts row 1 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ChartCard title="Class-Wise Placement %">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={placementBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="Placement %" radius={[0, 4, 4, 0]}>
                    {placementBarData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={classColors[entry.name as keyof typeof classColors] ?? CHART_COLORS.sequential[0]}
                      />
                    ))}
                    <LabelList
                      dataKey="Placement %"
                      position="right"
                      fontSize={11}
                      formatter={(value) => `${value}%`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Classwise Overview">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classwiseOverviewData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.entries(CLASSWISE_COLORS).map(([key, color]) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={color}
                    >
                      <LabelList
                        dataKey={key}
                        position="center"
                        content={NonZeroLabel}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ChartCard title="Gender-Wise Placed %">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar
                    dataKey="Male %"
                    fill={CHART_COLORS.sequential[0]}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="Male %"
                      position="top"
                      fontSize={11}
                      formatter={(value) => `${value}%`}
                    />
                  </Bar>
                  <Bar
                    dataKey="Female %"
                    fill={CHART_COLORS.sequential[1]}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="Female %"
                      position="top"
                      fontSize={11}
                      formatter={(value) => `${value}%`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Placement Pipeline Status">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Offer Type Breakdown + Gender Split */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {offerTypeData.length > 0 && (
            <ChartCard title="Offer Type Breakdown" description="Distribution of offer categories">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={offerTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {offerTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {data.topOffers.length > 0 && (
            <ChartCard title="Top Offers" description="Highest CTC packages this season">
              <div className="space-y-2 pt-1">
                {data.topOffers.slice(0, 6).map((offer, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm font-medium truncate">{offer.company}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: CHART_COLORS.offerType[offer.offerType as keyof typeof CHART_COLORS.offerType] + "22", color: CHART_COLORS.offerType[offer.offerType as keyof typeof CHART_COLORS.offerType] }}>
                        {offer.offerType}
                      </span>
                      <span className="text-sm font-mono font-semibold">{formatINRCompact(offer.ctc)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>

        {/* Cumulative Offers Timeline */}
        {cumulativeTimeline.length > 0 && (
          <ChartCard title="Placement Timeline" description="Cumulative offers over the placement season · Off-campus and PPO offers without a recorded date are not shown">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeTimeline} margin={{ top: 20, right: 15, bottom: 60, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} fontSize={10} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" allowDecimals={false} label={isSmUp ? { value: "Total Offers", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" } : undefined} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} label={isSmUp ? { value: "New Offers", angle: 90, position: "insideRight", fontSize: 11, fill: "#64748b" } : undefined} />
                  <Tooltip />
                  <Legend />
                  {[25, 50, 75, 85, 90, 100].map((pct) => {
                    const milestoneDate = placementMilestones.get(pct);
                    if (!milestoneDate) return null;
                    const point = cumulativeTimeline.find((d) => d.date === milestoneDate);
                    if (!point) return null;
                    return (
                      <ReferenceDot
                        key={pct}
                        yAxisId="left"
                        x={point.date}
                        y={point.cumulative}
                        r={isSmUp ? 5 : 4}
                        fill="#16a34a"
                        stroke="#fff"
                        strokeWidth={2}
                        label={{ value: `${pct}%`, position: "top", fontSize: isSmUp ? 10 : 8, fontWeight: 600, fill: "#16a34a" }}
                      />
                    );
                  })}
                  <Line yAxisId="left" type="monotone" dataKey="cumulative" name="Total Offers" stroke={CHART_COLORS.sequential[0]} strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="newOffers" name="New Offers" stroke={CHART_COLORS.sequential[1]} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
              Green dots mark placement milestones (% of opted students)
            </div>
          </ChartCard>
        )}

        {/* Mobile-only nudge to CTC page */}
        <Link
          href="/dashboard/ctc"
          className="flex items-center justify-between rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-white px-4 py-3 sm:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">CTC Analytics</p>
              <p className="text-xs text-muted-foreground">Salary breakdowns, top offers & more</p>
            </div>
          </div>
          <span className="text-blue-500 text-lg leading-none">→</span>
        </Link>
      </div>
    </PageTransition>
  );
}
