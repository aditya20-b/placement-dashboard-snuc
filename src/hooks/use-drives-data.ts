"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyDriveView, DriveSummary, HandlerStats, DriveRole, DriveType } from "@/types/drives";

export interface DrivesData {
  companies: CompanyDriveView[];
  handlerStats: HandlerStats[];
  summary: DriveSummary;
}

interface DrivesResponse {
  success: true;
  data: DrivesData;
  cached: boolean;
  timestamp: string;
}

async function fetchDrivesData(): Promise<DrivesData> {
  const res = await fetch("/api/drives");
  if (!res.ok) throw new Error(`Failed to fetch drives: ${res.status}`);
  const json: DrivesResponse = await res.json();
  if (!json.success) throw new Error("API returned error");
  return json.data;
}

export function useDrivesData() {
  return useQuery({
    queryKey: ["drives"],
    queryFn: fetchDrivesData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAddHandler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      company: string;
      handler: string;
      role: DriveRole;
      notes?: string;
    }) => {
      const res = await fetch("/api/drives/handlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to add handler: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}

export function useDeleteHandler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rowIndex: number) => {
      const res = await fetch(`/api/drives/handlers/${rowIndex}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete handler: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}

export function useUpdateDriveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { company: string; driveType: DriveType }) => {
      const res = await fetch("/api/drives/meta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to update drive type: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}
