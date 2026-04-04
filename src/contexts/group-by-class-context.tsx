"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface GroupByClassContextValue {
  groupByClass: boolean;
  toggleGroupByClass: () => void;
}

const GroupByClassContext = createContext<GroupByClassContextValue>({
  groupByClass: false,
  toggleGroupByClass: () => {},
});

export function GroupByClassProvider({ children }: { children: ReactNode }) {
  const [groupByClass, setGroupByClass] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("groupByClass") !== "false";
  });

  const toggleGroupByClass = () => {
    setGroupByClass((prev) => {
      const next = !prev;
      localStorage.setItem("groupByClass", String(next));
      return next;
    });
  };

  return (
    <GroupByClassContext.Provider value={{ groupByClass, toggleGroupByClass }}>
      <TooltipProvider delayDuration={200}>
        {children}
      </TooltipProvider>
    </GroupByClassContext.Provider>
  );
}

export function useGroupByClass() {
  return useContext(GroupByClassContext);
}
