import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { DashboardNav } from "./nav";
import { GroupByClassProvider } from "@/contexts/group-by-class-context";
import { getCachedData } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";
import { fetchMasterSheet, fetchOfferDetails, fetchTotalCompanyCount } from "@/lib/sheets";
import { joinStudentRecords } from "@/lib/data";
import { computeOverviewStats, computeCTCStats } from "@/lib/stats";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "SNU Chennai Placement Statistics 2026 — Batch 2022-26",
  description:
    "Live placement data for Shiv Nadar University Chennai Batch 2022-26. Placement percentage, average CTC, highest package, total offers, and company-wise breakdown for 2026 placements.",
};

async function getDatasetJsonLd() {
  try {
    const [{ data: students }, totalCompanyCount] = await Promise.all([
      getCachedData(CACHE_KEYS.STUDENT_RECORDS, async () => {
        const [master, offers] = await Promise.all([fetchMasterSheet(), fetchOfferDetails()]);
        return joinStudentRecords(master, offers);
      }),
      fetchTotalCompanyCount(),
    ]);
    const overview = computeOverviewStats(students, totalCompanyCount);
    const ctc = computeCTCStats(students);
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "@id": `${siteConfig.url}/dashboard#dataset`,
      name: "SNU Chennai Placement Statistics — Batch 2022-26",
      description:
        "Placement outcomes for Shiv Nadar University Chennai Batch 2022-26 including CTC data, company count, offer statistics, and placement percentage.",
      url: `${siteConfig.url}/dashboard`,
      creator: {
        "@type": "EducationalOrganization",
        name: "Shiv Nadar University Chennai",
        url: "https://www.snuchennai.edu.in",
      },
      temporalCoverage: "2022/2026",
      variableMeasured: [
        { "@type": "PropertyValue", name: "Total Students", value: overview.totalStudents },
        { "@type": "PropertyValue", name: "Placed Students", value: overview.totalPlaced },
        { "@type": "PropertyValue", name: "Placement Percentage", value: `${overview.placementPercent.toFixed(1)}%` },
        { "@type": "PropertyValue", name: "Total Offers", value: overview.totalOffers },
        { "@type": "PropertyValue", name: "Companies Visited", value: overview.uniqueCompanies },
        { "@type": "PropertyValue", name: "Average CTC (LPA)", value: (ctc.average / 100000).toFixed(2) },
        { "@type": "PropertyValue", name: "Highest CTC (LPA)", value: (ctc.highest / 100000).toFixed(2) },
        { "@type": "PropertyValue", name: "Median CTC (LPA)", value: (ctc.median / 100000).toFixed(2) },
      ],
    };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, datasetJsonLd] = await Promise.all([getSession(), getDatasetJsonLd()]);
  const userRole = session?.user?.role ?? "viewer";
  const userName = session?.user?.name ?? "Guest";
  const userEmail = session?.user?.email ?? "";

  return (
    <GroupByClassProvider>
      {datasetJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
        />
      )}
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
        <footer className="pb-24 pt-2 text-center text-xs text-muted-foreground sm:pb-6">
          Built by Aditya B &amp; Roahith R
        </footer>
      </div>
    </GroupByClassProvider>
  );
}
