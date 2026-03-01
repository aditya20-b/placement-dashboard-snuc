"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  OverviewStats,
  CTCStats,
  CompanyStats,
  TopOffer,
  MultipleOfferStudent,
  StudentRecord,
  AnonymizedStudentRecord,
  ClassSection,
} from "@/types";

export interface DashboardData {
  overview: OverviewStats;
  ctc: CTCStats;
  companies: CompanyStats[];
  topOffers: TopOffer[];
  multipleOffers: MultipleOfferStudent[];
  companyClassBreakdown: Record<string, Record<ClassSection | "total", number>>;
  students: StudentRecord[] | AnonymizedStudentRecord[];
  timestamp: string;
}

interface DashboardResponse {
  success: true;
  data: Omit<DashboardData, "timestamp">;
  cached: boolean;
  timestamp: string;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/data");
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status}`);
  }
  const json: DashboardResponse = await res.json();
  if (!json.success) {
    throw new Error("API returned error");
  }
  return {
    ...json.data,
    timestamp: json.timestamp,
  };
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
