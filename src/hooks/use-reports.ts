"use client";

import { useState, useCallback } from "react";
import type { ReportEntry } from "@/lib/reports";

export function useReports(initial: ReportEntry[] = []) {
  const [reports, setReports] = useState<ReportEntry[]>(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = (await res.json()) as ReportEntry[];
      setReports(data);
    } catch (err) {
      console.error("Failed to refresh reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { reports, loading, refresh };
}
