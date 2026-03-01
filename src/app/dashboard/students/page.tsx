"use client";

import { useState, useMemo, Fragment } from "react";
import { useSession } from "next-auth/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTableSort } from "@/hooks/use-table-sort";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SortableHeader } from "@/components/dashboard/sortable-header";
import { formatINRCompact, formatDate } from "@/lib/format";
import { VALID_CLASS_SECTIONS, VALID_STATUSES, VALID_CHOICES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Users,
  Briefcase,
  UserCheck,
  UserX,
  GraduationCap,
  ShieldOff,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StudentRecord } from "@/types";

function isStudentRecord(record: unknown): record is StudentRecord {
  return typeof record === "object" && record !== null && "rollNo" in record;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Placed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Not Placed":
      return "bg-red-100 text-red-800 border-red-200";
    case "Hold":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Dropped":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "LOR Issued":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

type AllStudentRow = {
  rollNo: string;
  name: string;
  classSection: string;
  gender: string;
  choice: string;
  status: string;
  offerCount: number;
  bestCtc: number;
  _student: StudentRecord;
};

type MultipleOfferRow = {
  rollNo: string;
  name: string;
  classSection: string;
  companies: string;
  offerCount: number;
};

type SimpleStudentRow = {
  rollNo: string;
  name: string;
  classSection: string;
  gender: string;
};

type InternshipRow = {
  rollNo: string;
  name: string;
  company: string;
  ctc: number;
  offerDate: string;
};

export default function StudentsPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useDashboardData();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [choiceFilter, setChoiceFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  const students = useMemo((): StudentRecord[] => {
    if (!data?.students) return [];
    return (data.students as StudentRecord[]).filter(isStudentRecord);
  }, [data]);

  const filtered = useMemo(() => {
    let result = students;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      );
    }
    if (classFilter !== "all") {
      result = result.filter((s) => s.classSection === classFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (choiceFilter !== "all") {
      result = result.filter((s) => s.choice === choiceFilter);
    }
    return result;
  }, [students, search, classFilter, statusFilter, choiceFilter]);

  const multipleOffers = useMemo(
    () => students.filter((s) => s.offers.length > 1),
    [students]
  );
  const notPlaced = useMemo(
    () => students.filter((s) => s.choice === "Placement" && s.status === "Not Placed"),
    [students]
  );
  const higherStudies = useMemo(
    () => students.filter((s) => s.choice === "Higher Studies"),
    [students]
  );
  const placementExempt = useMemo(
    () => students.filter((s) => s.choice === "Placement Exempt"),
    [students]
  );
  const internshipOnly = useMemo(
    () =>
      students.filter(
        (s) =>
          s.offers.length > 0 &&
          s.offers.every((o) => o.offerType === "Internship")
      ),
    [students]
  );

  // Stat counts
  const optedPlacement = useMemo(
    () => students.filter((s) => s.choice === "Placement").length,
    [students]
  );
  const placedCount = useMemo(
    () => students.filter((s) => s.status === "Placed").length,
    [students]
  );

  // Sortable data for "All Students" tab
  const allStudentRows = useMemo<AllStudentRow[]>(
    () =>
      filtered.map((s) => ({
        rollNo: s.rollNo,
        name: s.name,
        classSection: s.classSection,
        gender: s.gender,
        choice: s.choice,
        status: s.status,
        offerCount: s.offers.length,
        bestCtc: s.bestOffer?.ctc ?? 0,
        _student: s,
      })),
    [filtered]
  );
  const allSort = useTableSort<AllStudentRow, keyof Omit<AllStudentRow, "_student">>(allStudentRows);

  // Sortable data for "Multiple Offers" tab
  const multipleOfferRows = useMemo<MultipleOfferRow[]>(
    () =>
      multipleOffers.map((s) => ({
        rollNo: s.rollNo,
        name: s.name,
        classSection: s.classSection,
        companies: s.offers.map((o) => o.company).join(", "),
        offerCount: s.offers.length,
      })),
    [multipleOffers]
  );
  const multiSort = useTableSort<MultipleOfferRow, keyof MultipleOfferRow>(multipleOfferRows);

  // Sortable data for "Not Placed" tab
  const notPlacedRows = useMemo<SimpleStudentRow[]>(
    () =>
      notPlaced.map((s) => ({
        rollNo: s.rollNo,
        name: s.name,
        classSection: s.classSection,
        gender: s.gender,
      })),
    [notPlaced]
  );
  const notPlacedSort = useTableSort<SimpleStudentRow, keyof SimpleStudentRow>(notPlacedRows);

  // Sortable data for "Higher Studies" tab
  const hsRows = useMemo<SimpleStudentRow[]>(
    () =>
      higherStudies.map((s) => ({
        rollNo: s.rollNo,
        name: s.name,
        classSection: s.classSection,
        gender: s.gender,
      })),
    [higherStudies]
  );
  const hsSort = useTableSort<SimpleStudentRow, keyof SimpleStudentRow>(hsRows);

  // Sortable data for "Placement Exempt" tab
  const exemptRows = useMemo<SimpleStudentRow[]>(
    () =>
      placementExempt.map((s) => ({
        rollNo: s.rollNo,
        name: s.name,
        classSection: s.classSection,
        gender: s.gender,
      })),
    [placementExempt]
  );
  const exemptSort = useTableSort<SimpleStudentRow, keyof SimpleStudentRow>(exemptRows);

  // Sortable data for "Internship Only" tab
  const internshipRows = useMemo<InternshipRow[]>(
    () =>
      internshipOnly.flatMap((s) =>
        s.offers.map((o) => ({
          rollNo: s.rollNo,
          name: s.name,
          company: o.company,
          ctc: o.ctc,
          offerDate: o.offerDate ?? "",
        }))
      ),
    [internshipOnly]
  );
  const internSort = useTableSort<InternshipRow, keyof InternshipRow>(internshipRows);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-white p-12">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Admin Access Required</h2>
        <p className="text-muted-foreground">
          This page is restricted to placement cell staff.
        </p>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <p className="text-error">Failed to load student data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-warning">
          Admin Access 
        </span>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Students" value={students.length} icon={Users} iconColor="text-blue-500" />
        <StatCard title="Opted Placement" value={optedPlacement} icon={Briefcase} iconColor="text-gold-500" />
        <StatCard title="Placed" value={placedCount} icon={UserCheck} iconColor="text-green-500" />
        <StatCard title="Not Placed" value={notPlaced.length} icon={UserX} iconColor="text-red-500" />
        <StatCard title="Higher Studies" value={higherStudies.length} icon={GraduationCap} iconColor="text-purple-500" />
        <StatCard title="Exempt" value={placementExempt.length} icon={ShieldOff} iconColor="text-gray-500" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All Students ({students.length})</TabsTrigger>
          <TabsTrigger value="multiple">
            Multiple Offers ({multipleOffers.length})
          </TabsTrigger>
          <TabsTrigger value="not-placed">
            Not Placed ({notPlaced.length})
          </TabsTrigger>
          <TabsTrigger value="higher-studies">
            Higher Studies ({higherStudies.length})
          </TabsTrigger>
          <TabsTrigger value="exempt">
            Exempt ({placementExempt.length})
          </TabsTrigger>
          <TabsTrigger value="internship">
            Internship Only ({internshipOnly.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* Filters */}
          <div className="my-4 flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {VALID_CLASS_SECTIONS.map((cs) => (
                  <SelectItem key={cs} value={cs}>
                    {cs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {VALID_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={choiceFilter} onValueChange={setChoiceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Choice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Choices</SelectItem>
                {VALID_CHOICES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student table */}
          <div className="max-h-[600px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <SortableHeader label="Roll No" sortDirection={allSort.getSortIndicator("rollNo")} onSort={() => allSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={allSort.getSortIndicator("name")} onSort={() => allSort.requestSort("name")} />
                  <SortableHeader label="Class" sortDirection={allSort.getSortIndicator("classSection")} onSort={() => allSort.requestSort("classSection")} />
                  <SortableHeader label="Gender" sortDirection={allSort.getSortIndicator("gender")} onSort={() => allSort.requestSort("gender")} />
                  <SortableHeader label="Choice" sortDirection={allSort.getSortIndicator("choice")} onSort={() => allSort.requestSort("choice")} />
                  <SortableHeader label="Status" sortDirection={allSort.getSortIndicator("status")} onSort={() => allSort.requestSort("status")} />
                  <SortableHeader label="Offers" sortDirection={allSort.getSortIndicator("offerCount")} onSort={() => allSort.requestSort("offerCount")} className="text-center" />
                  <SortableHeader label="Best CTC" sortDirection={allSort.getSortIndicator("bestCtc")} onSort={() => allSort.requestSort("bestCtc")} className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSort.sortedData.map((row) => {
                  const student = row._student;
                  return (
                    <Fragment key={student.rollNo}>
                      <TableRow
                        className="cursor-pointer hover:bg-blue-50/50"
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === student.rollNo
                              ? null
                              : student.rollNo
                          )
                        }
                      >
                        <TableCell>
                          {student.offers.length > 0 &&
                            (expandedRow === student.rollNo ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            ))}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.rollNo}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.classSection}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.choice}</Badge>
                        </TableCell>
                        <TableCell>
                          {student.choice === "Placement" ? (
                            <Badge className={statusBadgeClass(student.status)}>
                              {student.status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.offers.length}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {student.bestOffer
                            ? formatINRCompact(student.bestOffer.ctc)
                            : "—"}
                        </TableCell>
                      </TableRow>
                      {expandedRow === student.rollNo &&
                        student.offers.length > 0 && (
                          <TableRow key={`${student.rollNo}-expanded`}>
                            <TableCell colSpan={9} className="bg-gray-50 p-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Offer Details
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {student.offers.map((offer, j) => (
                                    <div
                                      key={j}
                                      className="rounded-md border bg-white p-3"
                                    >
                                      <p className="font-medium">
                                        {offer.company}
                                      </p>
                                      <p className="font-mono text-sm">
                                        {formatINRCompact(offer.ctc)}
                                      </p>
                                      <div className="mt-1 flex gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {offer.offerType}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(offer.offerDate)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {filtered.length} of {students.length} students
          </p>
        </TabsContent>

        <TabsContent value="multiple">
          <ChartCard title={`Multiple Offers (${multipleOffers.length} students)`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Roll No" sortDirection={multiSort.getSortIndicator("rollNo")} onSort={() => multiSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={multiSort.getSortIndicator("name")} onSort={() => multiSort.requestSort("name")} />
                  <SortableHeader label="Class" sortDirection={multiSort.getSortIndicator("classSection")} onSort={() => multiSort.requestSort("classSection")} />
                  <TableHead>Companies</TableHead>
                  <SortableHeader label="Offers" sortDirection={multiSort.getSortIndicator("offerCount")} onSort={() => multiSort.requestSort("offerCount")} className="text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {multiSort.sortedData.map((row) => (
                  <TableRow key={row.rollNo}>
                    <TableCell className="font-mono">{row.rollNo}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.classSection}</TableCell>
                    <TableCell>{row.companies}</TableCell>
                    <TableCell className="text-center">
                      {row.offerCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>

        <TabsContent value="not-placed">
          <ChartCard title={`Not Placed (${notPlaced.length} students)`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Roll No" sortDirection={notPlacedSort.getSortIndicator("rollNo")} onSort={() => notPlacedSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={notPlacedSort.getSortIndicator("name")} onSort={() => notPlacedSort.requestSort("name")} />
                  <SortableHeader label="Class" sortDirection={notPlacedSort.getSortIndicator("classSection")} onSort={() => notPlacedSort.requestSort("classSection")} />
                  <SortableHeader label="Gender" sortDirection={notPlacedSort.getSortIndicator("gender")} onSort={() => notPlacedSort.requestSort("gender")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {notPlacedSort.sortedData.map((row) => (
                  <TableRow key={row.rollNo}>
                    <TableCell className="font-mono">{row.rollNo}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.classSection}</TableCell>
                    <TableCell>{row.gender}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>

        <TabsContent value="higher-studies">
          <ChartCard title={`Higher Studies (${higherStudies.length} students)`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Roll No" sortDirection={hsSort.getSortIndicator("rollNo")} onSort={() => hsSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={hsSort.getSortIndicator("name")} onSort={() => hsSort.requestSort("name")} />
                  <SortableHeader label="Class" sortDirection={hsSort.getSortIndicator("classSection")} onSort={() => hsSort.requestSort("classSection")} />
                  <SortableHeader label="Gender" sortDirection={hsSort.getSortIndicator("gender")} onSort={() => hsSort.requestSort("gender")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hsSort.sortedData.map((row) => (
                  <TableRow key={row.rollNo}>
                    <TableCell className="font-mono">{row.rollNo}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.classSection}</TableCell>
                    <TableCell>{row.gender}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>

        <TabsContent value="exempt">
          <ChartCard title={`Placement Exempt (${placementExempt.length} students)`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Roll No" sortDirection={exemptSort.getSortIndicator("rollNo")} onSort={() => exemptSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={exemptSort.getSortIndicator("name")} onSort={() => exemptSort.requestSort("name")} />
                  <SortableHeader label="Class" sortDirection={exemptSort.getSortIndicator("classSection")} onSort={() => exemptSort.requestSort("classSection")} />
                  <SortableHeader label="Gender" sortDirection={exemptSort.getSortIndicator("gender")} onSort={() => exemptSort.requestSort("gender")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {exemptSort.sortedData.map((row) => (
                  <TableRow key={row.rollNo}>
                    <TableCell className="font-mono">{row.rollNo}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.classSection}</TableCell>
                    <TableCell>{row.gender}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>

        <TabsContent value="internship">
          <ChartCard
            title={`Internship Only (${internshipOnly.length} students)`}
            description="Students with only internship offers (no full-time)"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Roll No" sortDirection={internSort.getSortIndicator("rollNo")} onSort={() => internSort.requestSort("rollNo")} />
                  <SortableHeader label="Name" sortDirection={internSort.getSortIndicator("name")} onSort={() => internSort.requestSort("name")} />
                  <SortableHeader label="Company" sortDirection={internSort.getSortIndicator("company")} onSort={() => internSort.requestSort("company")} />
                  <SortableHeader label="Stipend" sortDirection={internSort.getSortIndicator("ctc")} onSort={() => internSort.requestSort("ctc")} className="text-right" />
                  <SortableHeader label="Date" sortDirection={internSort.getSortIndicator("offerDate")} onSort={() => internSort.requestSort("offerDate")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {internSort.sortedData.map((row, i) => (
                  <TableRow key={`${row.rollNo}-${i}`}>
                    <TableCell className="font-mono">{row.rollNo}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINRCompact(row.ctc)}
                    </TableCell>
                    <TableCell>{formatDate(row.offerDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
