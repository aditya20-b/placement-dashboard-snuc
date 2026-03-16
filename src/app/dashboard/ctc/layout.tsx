import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SNU Chennai Placement Packages 2026 — Average & Highest CTC",
  description:
    "SNU Chennai Batch 2022-26 salary packages: average CTC, highest package, median salary, CTC distribution, percentile breakdown, and top offers for 2026 placements.",
};

export default function CTCLayout({ children }: { children: ReactNode }) {
  return children;
}
