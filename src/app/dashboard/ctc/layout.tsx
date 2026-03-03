import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CTC Analytics",
  description:
    "CTC distribution, percentile curves, package bands, and top offer analytics for SNU Chennai Batch 2022-26 campus placements.",
};

export default function CTCLayout({ children }: { children: ReactNode }) {
  return children;
}
