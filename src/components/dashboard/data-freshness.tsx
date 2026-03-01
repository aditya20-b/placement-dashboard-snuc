"use client";

import { RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function DataFreshness({ timestamp }: { timestamp?: string }) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    setRefreshing(false);
  };

  const timeAgo = timestamp
    ? getTimeAgo(new Date(timestamp))
    : null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {timeAgo ? (
        <span>Updated {timeAgo}</span>
      ) : (
        <span>Loading...</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="h-6 px-1.5"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
