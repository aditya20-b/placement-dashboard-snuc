"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { ChartCard } from "@/components/dashboard/chart-card";
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
import { Search, ChevronDown, ChevronRight, Shield } from "lucide-react";
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
          s.rollNo.includes(q)
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
    () => students.filter((s) => s.status === "Not Placed"),
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
        <Shield className="h-5 w-5 text-warning" />
        <span className="text-sm font-medium text-warning">
          Admin Access — Placement Cell Staff Only
        </span>
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
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Choice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Offers</TableHead>
                  <TableHead className="text-right">Best CTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <>
                    <TableRow
                      key={student.rollNo}
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
                        <Badge
                          variant={
                            student.status === "Placed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {student.status}
                        </Badge>
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
                  </>
                ))}
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
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead className="text-center">Offers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {multipleOffers.map((s) => (
                  <TableRow key={s.rollNo}>
                    <TableCell className="font-mono">{s.rollNo}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.classSection}</TableCell>
                    <TableCell>
                      {s.offers.map((o) => o.company).join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.offers.length}
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
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Choice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notPlaced.map((s) => (
                  <TableRow key={s.rollNo}>
                    <TableCell className="font-mono">{s.rollNo}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.classSection}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>{s.choice}</TableCell>
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
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Stipend</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internshipOnly.flatMap((s) =>
                  s.offers.map((o, i) => (
                    <TableRow key={`${s.rollNo}-${i}`}>
                      <TableCell className="font-mono">{s.rollNo}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{o.company}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINRCompact(o.ctc)}
                      </TableCell>
                      <TableCell>{formatDate(o.offerDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
