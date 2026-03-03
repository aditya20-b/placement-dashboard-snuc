import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { DashboardNav } from "./nav";
import { GroupByClassProvider } from "@/contexts/group-by-class-context";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Live placement statistics for SNU Chennai Batch 2022-26: total students, offer counts, average CTC, company count, and class-wise breakdowns.",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const userRole = session?.user?.role ?? "viewer";
  const userName = session?.user?.name ?? "Guest";
  const userEmail = session?.user?.email ?? "";

  return (
    <GroupByClassProvider>
      <div className="min-h-screen bg-brand-gradient">
        <DashboardNav
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          isAuthenticated={!!session}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8">
          {children}
        </main>
      </div>
    </GroupByClassProvider>
  );
}
