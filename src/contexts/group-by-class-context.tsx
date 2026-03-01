"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface GroupByClassContextValue {
  groupByClass: boolean;
  toggleGroupByClass: () => void;
}

const GroupByClassContext = createContext<GroupByClassContextValue>({
  groupByClass: false,
  toggleGroupByClass: () => {},
});

export function GroupByClassProvider({ children }: { children: ReactNode }) {
  const [groupByClass, setGroupByClass] = useState(true);

  // Persist preference in localStorage (default: true)
  useEffect(() => {
    const stored = localStorage.getItem("groupByClass");
    if (stored === "false") setGroupByClass(false);
  }, []);

  const toggleGroupByClass = () => {
    setGroupByClass((prev) => {
      const next = !prev;
      localStorage.setItem("groupByClass", String(next));
      return next;
    });
  };

  return (
    <GroupByClassContext.Provider value={{ groupByClass, toggleGroupByClass }}>
      {children}
    </GroupByClassContext.Provider>
  );
}

export function useGroupByClass() {
  return useContext(GroupByClassContext);
}
