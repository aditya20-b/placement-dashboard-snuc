import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Companies That Recruited at SNU Chennai — 2026 Placements",
  description:
    "Full list of companies that visited and recruited at Shiv Nadar University Chennai for Batch 2022-26: offer counts, CTC ranges, on-campus and off-campus recruiters.",
};

export default function CompaniesLayout({ children }: { children: ReactNode }) {
  return children;
}
