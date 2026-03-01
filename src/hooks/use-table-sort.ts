"use client";

import { useState, useMemo, useCallback } from "react";

type SortDirection = "asc" | "desc" | null;

interface SortState<K extends string> {
  key: K | null;
  direction: SortDirection;
}

interface UseTableSortReturn<T, K extends string> {
  sortedData: T[];
  sortKey: K | null;
  sortDirection: SortDirection;
  requestSort: (key: K) => void;
  getSortIndicator: (key: K) => SortDirection;
}

export function useTableSort<T, K extends string>(
  data: T[],
  defaultSort?: { key: K; direction: "asc" | "desc" }
): UseTableSortReturn<T, K> {
  const [sort, setSort] = useState<SortState<K>>({
    key: defaultSort?.key ?? null,
    direction: defaultSort?.direction ?? null,
  });

  const requestSort = useCallback((key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;

    const key = sort.key;
    const dir = sort.direction === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[key];
      const bVal = (b as Record<string, unknown>)[key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir;
      }

      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }, [data, sort.key, sort.direction]);

  const getSortIndicator = useCallback(
    (key: K): SortDirection => {
      if (sort.key !== key) return null;
      return sort.direction;
    },
    [sort.key, sort.direction]
  );

  return { sortedData, sortKey: sort.key, sortDirection: sort.direction, requestSort, getSortIndicator };
}
