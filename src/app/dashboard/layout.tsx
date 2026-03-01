import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-gradient">
      <DashboardNav
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
