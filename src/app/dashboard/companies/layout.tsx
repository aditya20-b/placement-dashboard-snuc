import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Companies",
  description:
    "Companies that recruited at SNU Chennai Batch 2022-26: offer counts, CTC ranges, hiring trends, and sector-wise breakdowns.",
};

export default function CompaniesLayout({ children }: { children: ReactNode }) {
  return children;
}
