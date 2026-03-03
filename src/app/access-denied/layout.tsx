import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Access Restricted",
  description: "You do not have permission to view this page.",
  robots: { index: false, follow: false },
};

export default function AccessDeniedLayout({ children }: { children: ReactNode }) {
  return children;
}
