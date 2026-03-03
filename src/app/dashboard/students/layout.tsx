import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Students",
  description:
    "Student placement records for SNU Chennai Batch 2022-26. Admin access required.",
  robots: { index: false, follow: false },
};

export default function StudentsLayout({ children }: { children: ReactNode }) {
  return children;
}
