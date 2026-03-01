"use client";

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
import { DataFreshness } from "@/components/dashboard/data-freshness";
import { Users, UserCheck, Briefcase, TrendingUp, Award } from "lucide-react";
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
} from "recharts";

export default function OverviewPage() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <p className="text-error">Failed to load dashboard data.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message ?? "Please try again later."}
        </p>
      </div>
    );
  }

  const { overview } = data;

  const placementBarData = overview.classwiseStats.map((cs) => ({
    name: cs.classSection,
    "Placement %": Number(cs.placementPercent.toFixed(1)),
  }));

  const choiceData = overview.classwiseStats.map((cs) => ({
    name: cs.classSection,
    Placement: cs.optedPlacement,
    "Higher Studies": cs.optedHigherStudies,
    "Placement Exempt": cs.placementExempt,
  }));

  const genderData = overview.classwiseStats.map((cs) => ({
    name: cs.classSection,
    "Male %": Number(cs.malePlacedPercent.toFixed(1)),
    "Female %": Number(cs.femalePlacedPercent.toFixed(1)),
  }));

  const statusData = [
    {
      name: "Placed",
      value: overview.classwiseStats.reduce((s, c) => s + c.placed, 0),
      color: CHART_COLORS.status.Placed,
    },
    {
      name: "Not Placed",
      value: overview.classwiseStats.reduce((s, c) => s + c.notPlaced, 0),
      color: CHART_COLORS.status["Not Placed"],
    },
    {
      name: "Hold",
      value: overview.classwiseStats.reduce((s, c) => s + c.hold, 0),
      color: CHART_COLORS.status.Hold,
    },
    {
      name: "Dropped",
      value: overview.classwiseStats.reduce((s, c) => s + c.dropped, 0),
      color: CHART_COLORS.status.Dropped,
    },
  ].filter((d) => d.value > 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with freshness indicator */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold text-gray-900">
            Overview
          </h1>
          <DataFreshness timestamp={data.timestamp} />
        </div>

        {/* Hero stat cards */}
        <StaggerContainer>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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
                title="Total Placed"
                value={overview.totalPlaced}
                icon={UserCheck}
                iconColor="text-success"
              />
            </StaggerItem>
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
                title="Total Offers"
                value={overview.totalOffers}
                icon={Award}
                iconColor="text-blue-400"
              />
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Charts row 1 */}
        <div className="grid gap-4 lg:grid-cols-2">
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
                        fill={
                          CHART_COLORS.class[
                            entry.name as keyof typeof CHART_COLORS.class
                          ] ?? CHART_COLORS.sequential[0]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Choice Distribution">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={choiceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Placement"
                    stackId="a"
                    fill={CHART_COLORS.sequential[0]}
                  />
                  <Bar
                    dataKey="Higher Studies"
                    stackId="a"
                    fill={CHART_COLORS.sequential[1]}
                  />
                  <Bar
                    dataKey="Placement Exempt"
                    stackId="a"
                    fill={CHART_COLORS.sequential[4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-4 lg:grid-cols-2">
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
                  />
                  <Bar
                    dataKey="Female %"
                    fill={CHART_COLORS.sequential[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Status Breakdown">
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
      </div>
    </PageTransition>
  );
}
