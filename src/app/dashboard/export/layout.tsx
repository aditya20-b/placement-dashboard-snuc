import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Export",
  description:
    "Export placement reports as PDF or CSV for SNU Chennai Batch 2022-26. Admin access required.",
  robots: { index: false, follow: false },
};

export default function ExportLayout({ children }: { children: ReactNode }) {
  return children;
}
