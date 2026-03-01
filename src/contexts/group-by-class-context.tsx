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
  const [groupByClass, setGroupByClass] = useState(false);

  // Persist preference in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("groupByClass");
    if (stored === "true") setGroupByClass(true);
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
