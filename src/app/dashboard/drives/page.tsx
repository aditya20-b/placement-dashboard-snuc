"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  useDrivesData,
  useAddHandler,
  useDeleteHandler,
  useUpdateDriveType,
} from "@/hooks/use-drives-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import { useTableSort } from "@/hooks/use-table-sort";
import { VALID_DRIVE_ROLES, VALID_DRIVE_TYPES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList,
} from "recharts";
import {
  Search,
  Shield,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import type { CompanyDriveView, DriveRole, DriveType, HandlerEntry } from "@/types/drives";

// ─── Helper components ──────────────────────────────────

function CountsPill({ counts }: { counts: boolean }) {
  return counts ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 border border-green-200">
      In
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 border border-gray-200">
      Out
    </span>
  );
}

function RoleBadge({ role }: { role: DriveRole }) {
  const colors: Record<DriveRole, string> = {
    "End-to-End": "bg-purple-100 text-purple-800 border-purple-200",
    Volunteering: "bg-amber-100 text-amber-800 border-amber-200",
    Coordination: "bg-blue-100 text-blue-800 border-blue-200",
    Support: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium ${colors[role]}`}
    >
      {role}
    </span>
  );
}

// ─── Add Handler Modal ─────────────────────────────────────

interface AddHandlerModalProps {
  company: string;
  allHandlerNames: string[];
  open: boolean;
  onClose: () => void;
}

function AddHandlerModal({
  company,
  allHandlerNames,
  open,
  onClose,
}: AddHandlerModalProps) {
  const addHandler = useAddHandler();
  const [handlerName, setHandlerName] = useState("");
  const [role, setRole] = useState<DriveRole>("End-to-End");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!handlerName.trim()) return;
    addHandler.mutate(
      { company, handler: handlerName.trim(), role, notes: notes.trim() },
      {
        onSuccess: () => {
          setHandlerName("");
          setNotes("");
          setRole("End-to-End");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Handler</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Company
            </label>
            <Input value={company} readOnly className="bg-gray-50" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Handler Name
            </label>
            <Input
              list="handler-names"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="Enter handler name"
              autoFocus
            />
            <datalist id="handler-names">
              {allHandlerNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as DriveRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALID_DRIVE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!handlerName.trim() || addHandler.isPending}
          >
            {addHandler.isPending ? "Adding..." : "Add Handler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Handler chips in company row ─────────────────────────

interface HandlerChipsProps {
  handlers: HandlerEntry[];
  company: string;
  allHandlerNames: string[];
}

function HandlerChips({ handlers, company, allHandlerNames }: HandlerChipsProps) {
  const deleteHandler = useDeleteHandler();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {handlers.map((h) => (
        <span
          key={h.rowIndex}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs"
        >
          <span className="font-medium">{h.handler}</span>
          <span className="text-gray-400">·</span>
          <RoleBadge role={h.role} />
          <button
            onClick={() => deleteHandler.mutate(h.rowIndex)}
            disabled={deleteHandler.isPending}
            className="ml-0.5 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
            title="Remove handler"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500"
      >
        <Plus className="h-3 w-3" />
        Add
      </button>
      <AddHandlerModal
        company={company}
        allHandlerNames={allHandlerNames}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// ─── Drive Type Select ──────────────────────────────────

interface DriveTypeSelectProps {
  company: string;
  value: DriveType | null;
}

function DriveTypeSelect({ company, value }: DriveTypeSelectProps) {
  const updateDriveType = useUpdateDriveType();

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) =>
        updateDriveType.mutate({ company, driveType: v as DriveType })
      }
    >
      <SelectTrigger className="h-7 w-44 text-xs">
        <SelectValue placeholder="Set type…" />
      </SelectTrigger>
      <SelectContent>
        {VALID_DRIVE_TYPES.map((t) => (
          <SelectItem key={t} value={t} className="text-xs">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Tab 1: Company Drives ─────────────────────────────

type CompanyRow = {
  company: string;
  firstDate: number; // Unix ms timestamp for correct sort; 0 = no date
  firstDateDisplay: string;
  offersGiven: number;
  driveType: string;
  countsInDenominator: boolean;
  handlerCount: number;
  _view: CompanyDriveView;
};

/** Parse "23-Jan-2026" → ms timestamp. Returns 0 on failure so undated rows sort last. */
function parseDriveDate(s: string): number {
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

interface CompanyDrivesTabProps {
  companies: CompanyDriveView[];
  allHandlerNames: string[];
}

function CompanyDrivesTab({ companies, allHandlerNames }: CompanyDrivesTabProps) {
  const [search, setSearch] = useState("");
  const [driveTypeFilter, setDriveTypeFilter] = useState("all");
  const [handlerFilter, setHandlerFilter] = useState("");
  const [unclassifiedOnly, setUnclassifiedOnly] = useState(false);
  const [noHandlerOnly, setNoHandlerOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = companies;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.company.toLowerCase().includes(q));
    }
    if (driveTypeFilter !== "all") {
      if (driveTypeFilter === "unclassified") {
        result = result.filter((c) => c.driveType === null);
      } else {
        result = result.filter((c) => c.driveType === driveTypeFilter);
      }
    }
    if (handlerFilter) {
      const q = handlerFilter.toLowerCase();
      result = result.filter((c) =>
        c.handlers.some((h) => h.handler.toLowerCase().includes(q)),
      );
    }
    if (unclassifiedOnly) result = result.filter((c) => c.driveType === null);
    if (noHandlerOnly) result = result.filter((c) => c.handlers.length === 0);
    return result;
  }, [companies, search, driveTypeFilter, handlerFilter, unclassifiedOnly, noHandlerOnly]);

  const rows = useMemo<CompanyRow[]>(
    () =>
      filtered.map((c) => ({
        company: c.company,
        firstDate: parseDriveDate(c.dates[0] ?? ""),
        firstDateDisplay: c.dates[0] ?? "",
        offersGiven: c.offersGiven,
        driveType: c.driveType ?? "",
        countsInDenominator: c.countsInDenominator,
        handlerCount: c.handlers.length,
        _view: c,
      })),
    [filtered],
  );

  const tableSort = useTableSort<CompanyRow, keyof Omit<CompanyRow, "_view" | "firstDateDisplay">>(rows);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={driveTypeFilter} onValueChange={setDriveTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Drive Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drive Types</SelectItem>
              <SelectItem value="unclassified">Unclassified</SelectItem>
              {VALID_DRIVE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by handler..."
            value={handlerFilter}
            onChange={(e) => setHandlerFilter(e.target.value)}
            className="w-44"
          />
          <button
            onClick={() => setUnclassifiedOnly(!unclassifiedOnly)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              unclassifiedOnly
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Unclassified only
          </button>
          <button
            onClick={() => setNoHandlerOnly(!noHandlerOnly)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              noHandlerOnly
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            No handler assigned
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[640px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader label="Company" sortDirection={tableSort.getSortIndicator("company")} onSort={() => tableSort.requestSort("company")} className="min-w-36" />
              <SortableHeader label="Date(s)" sortDirection={tableSort.getSortIndicator("firstDate")} onSort={() => tableSort.requestSort("firstDate")} className="hidden md:table-cell" />
              <SortableHeader label="Offers" sortDirection={tableSort.getSortIndicator("offersGiven")} onSort={() => tableSort.requestSort("offersGiven")} className="text-right w-20" />
              <SortableHeader label="Drive Type" sortDirection={tableSort.getSortIndicator("driveType")} onSort={() => tableSort.requestSort("driveType")} className="w-48" />
              <SortableHeader label="Counts?" sortDirection={tableSort.getSortIndicator("countsInDenominator")} onSort={() => tableSort.requestSort("countsInDenominator")} className="w-16 text-center" />
              <SortableHeader label="Handlers" sortDirection={tableSort.getSortIndicator("handlerCount")} onSort={() => tableSort.requestSort("handlerCount")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableSort.sortedData.map((row) => {
              const c = row._view;
              return (
                <TableRow key={c.company}>
                  <TableCell className="font-medium text-sm">{c.company}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {c.dates.length > 0 ? c.dates.join(", ") : <span className="text-gray-300 select-none">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {c.offersGiven > 0 ? c.offersGiven : <span className="text-gray-300">0</span>}
                  </TableCell>
                  <TableCell>
                    <DriveTypeSelect company={c.company} value={c.driveType} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CountsPill counts={c.countsInDenominator} />
                  </TableCell>
                  <TableCell>
                    <HandlerChips
                      handlers={c.handlers}
                      company={c.company}
                      allHandlerNames={allHandlerNames}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {companies.length} companies
      </p>
    </div>
  );
}

// ─── Chart constants ────────────────────────────────────

const HANDLER_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

const ROLE_COLORS: Record<DriveRole, string> = {
  "End-to-End": "#8B5CF6",
  Volunteering: "#F59E0B",
  Coordination: "#2563EB",
  Support: "#6B7280",
};

const DRIVE_TYPE_COLORS: Record<string, string> = {
  "On Campus": "#2563EB",
  "On Campus (Online)": "#06B6D4",
  "Off Campus": "#6B7280",
  "PPO / Intern Conversion": "#F59E0B",
  "Half Campus": "#10B981",
  "Online Only": "#8B5CF6",
  Unclassified: "#E5E7EB",
};

// ─── Tab 2: Handler Stats ──────────────────────────────

interface HandlerStatsTabProps {
  summary: { total: number; inDenominator: number; withHandlers: number; unclassified: number };
  handlerStats: Array<{
    name: string;
    drivesHandled: number;
    offersFromDrives: number;
    roleBreakdown: Record<DriveRole, number>;
    companies: string[];
  }>;
  companies: CompanyDriveView[];
}

function HandlerStatsTab({ summary, handlerStats, companies }: HandlerStatsTabProps) {
  const [expandedHandler, setExpandedHandler] = useState<string | null>(null);

  const total = summary.total;

  // Chart 1: drives vs offers per handler (grouped bar)
  const drivesOffersData = handlerStats.map((h) => ({
    name: h.name,
    Drives: h.drivesHandled,
    Offers: h.offersFromDrives,
  }));

  // Chart 2: drives handled per handler (simple coloured bar)
  const drivesData = handlerStats.map((h) => ({
    name: h.name,
    Drives: h.drivesHandled,
  }));

  // Chart 3: role breakdown stacked bar per handler
  const roleBreakdownData = handlerStats.map((h) => ({
    name: h.name,
    "End-to-End": h.roleBreakdown["End-to-End"],
    Volunteering: h.roleBreakdown["Volunteering"],
    Coordination: h.roleBreakdown["Coordination"],
    Support: h.roleBreakdown["Support"],
  }));

  // Chart 4: drive type donut
  const driveTypeCounts = new Map<string, number>();
  for (const c of companies) {
    const key = c.driveType ?? "Unclassified";
    driveTypeCounts.set(key, (driveTypeCounts.get(key) ?? 0) + 1);
  }
  const driveTypeData = [...driveTypeCounts.entries()]
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={summary.total}
          icon={Building2}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Tracked Drives"
          value={summary.inDenominator}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
        <StatCard
          title="With Handlers"
          value={summary.withHandlers}
          icon={Users}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Unclassified"
          value={summary.unclassified}
          icon={HelpCircle}
          iconColor="text-amber-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chart 1: Drives handled vs Offers per handler */}
        <ChartCard
          title="Drives vs Offers per Handler"
          description="Drives handled alongside total offers from those drives"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivesOffersData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Drives" fill="#2563EB" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Drives" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "#2563EB" }} />
                </Bar>
                <Bar dataKey="Offers" fill="#10B981" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Offers" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "#10B981" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Drive type breakdown donut with legend */}
        <ChartCard
          title="Drive Type Breakdown"
          description="Distribution of all companies by drive type"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={driveTypeData}
                  cx="42%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {driveTypeData.map((entry) => (
                    <Cell key={entry.name} fill={DRIVE_TYPE_COLORS[entry.name] ?? "#E5E7EB"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => {
                    const item = driveTypeData.find((d) => d.name === value);
                    return (
                      <span style={{ fontSize: 11, color: "#374151" }}>
                        {value}{" "}
                        <span style={{ color: (entry as { color?: string }).color, fontWeight: 600 }}>
                          {item?.value}
                        </span>
                        <span style={{ color: "#9CA3AF" }}> ({item?.pct}%)</span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Role breakdown stacked bar — no radius on stacked segments */}
        <ChartCard
          title="Role Breakdown per Handler"
          description="Number of drives per role type for each handler"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBreakdownData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {(Object.keys(ROLE_COLORS) as DriveRole[]).map((role) => (
                  <Bar key={role} dataKey={role} stackId="roles" fill={ROLE_COLORS[role]} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Drives handled per handler — simple coloured bar */}
        <ChartCard
          title="Drives Handled per Handler"
          description="Total number of drives each person handled"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivesData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="Drives" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Drives" position="top" style={{ fontSize: 12, fontWeight: 700 }} />
                  {drivesData.map((_, i) => (
                    <Cell key={i} fill={HANDLER_COLORS[i % HANDLER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Handler cards */}
      <div className="space-y-3">
        {handlerStats.map((h) => {
          const isExpanded = expandedHandler === h.name;
          const roleEntries = Object.entries(h.roleBreakdown).filter(
            ([, count]) => count > 0,
          ) as [DriveRole, number][];

          return (
            <div
              key={h.name}
              className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-sm"
            >
              <button
                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50"
                onClick={() =>
                  setExpandedHandler(isExpanded ? null : h.name)
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {h.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.drivesHandled} drive{h.drivesHandled !== 1 ? "s" : ""} ·{" "}
                      {h.offersFromDrives} offer
                      {h.offersFromDrives !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {roleEntries.map(([role, count]) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 text-xs"
                      >
                        <RoleBadge role={role} />
                        <span className="text-muted-foreground">×{count}</span>
                      </span>
                    ))}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Companies handled
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.companies.map((company) => (
                      <span
                        key={company}
                        className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {handlerStats.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No handler data yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function DrivesPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useDrivesData();

  const isAdmin = session?.user?.role === "admin";

  const allHandlerNames = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();
    for (const company of data.companies) {
      for (const h of company.handlers) {
        names.add(h.handler);
      }
    }
    return [...names].sort();
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <div className="rounded-full bg-blue-50 p-3 ring-4 ring-blue-500/5">
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="font-heading text-xl font-semibold">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground">
            This page is restricted to placement cell staff.
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
          <p className="text-red-500">Failed to load drives data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-gray-900">
            Drives
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <Badge className="bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
          <Sparkles className="h-3 w-3" />
          <span className="hidden sm:inline">Admin Access</span>
          <span className="sm:hidden">Admin</span>
        </Badge>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Company Drives</TabsTrigger>
          <TabsTrigger value="handlers">Handler Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-4">
          <CompanyDrivesTab
            companies={data.companies}
            allHandlerNames={allHandlerNames}
          />
        </TabsContent>

        <TabsContent value="handlers" className="mt-4">
          <HandlerStatsTab
            summary={data.summary}
            handlerStats={data.handlerStats}
            companies={data.companies}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
