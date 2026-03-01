import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchMasterSheet, fetchOfferDetails } from "@/lib/sheets";
import { joinStudentRecords, anonymizeRecord } from "@/lib/data";
import {
  computeOverviewStats,
  computeCTCStats,
  computeCompanyStats,
  computeTopOffers,
  computeMultipleOfferStudents,
  computeCompanyClassBreakdown,
  computeTimelineStats,
} from "@/lib/stats";
import { getCachedData } from "@/lib/cache";
import { validateOrigin } from "@/lib/csrf";
import { CACHE_KEYS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    // CSRF check for non-GET (this is GET, but validate origin if present)
    const origin = request.headers.get("origin");
    if (origin && !validateOrigin(request)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid origin" } },
        { status: 403 }
      );
    }

    const isAdmin = session?.user?.role === "admin";

    const { data: students, cached } = await getCachedData(
      CACHE_KEYS.STUDENT_RECORDS,
      async () => {
        const [master, offers] = await Promise.all([
          fetchMasterSheet(),
          fetchOfferDetails(),
        ]);
        return joinStudentRecords(master, offers);
      }
    );

    const overview = computeOverviewStats(students);
    const ctc = computeCTCStats(students);
    const companies = computeCompanyStats(students);
    const topOffers = computeTopOffers(students);
    const multipleOffers = computeMultipleOfferStudents(students);
    const companyClassBreakdown = computeCompanyClassBreakdown(students);
    const timeline = computeTimelineStats(students);

    // Anonymize top offers for non-admin
    const safeTopOffers = isAdmin
      ? topOffers
      : topOffers.map((o, i) => ({
          ...o,
          studentName: `Student ${i + 1}`,
        }));

    return NextResponse.json({
      success: true,
      data: {
        overview,
        ctc,
        companies,
        topOffers: safeTopOffers,
        multipleOffers: isAdmin ? multipleOffers : [],
        companyClassBreakdown,
        timeline,
        students: isAdmin
          ? students
          : students.map(anonymizeRecord),
      },
      cached,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API /data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch data",
        },
      },
      { status: 500 }
    );
  }
}
