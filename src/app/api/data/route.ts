import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchMasterSheet, fetchOfferDetails, fetchTotalCompanyCount, fetchNoOfferCompanies } from "@/lib/sheets";
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
import { CACHE_KEYS } from "@/lib/constants";

export async function GET() {
  try {
    const session = await getSession();
    const isAdmin = session?.user?.role === "admin";

    const [{ data: students, cached }, totalCompanyCount, noOfferCompanies] = await Promise.all([
      getCachedData(
        CACHE_KEYS.STUDENT_RECORDS,
        async () => {
          const [master, offers] = await Promise.all([
            fetchMasterSheet(),
            fetchOfferDetails(),
          ]);
          return joinStudentRecords(master, offers);
        }
      ),
      fetchTotalCompanyCount(),
      fetchNoOfferCompanies(),
    ]);

    const overview = computeOverviewStats(students, totalCompanyCount);
    const ctc = computeCTCStats(students);
    const companies = computeCompanyStats(students, noOfferCompanies);
    const topOffers = computeTopOffers(students);
    const multipleOffers = computeMultipleOfferStudents(students);
    const companyClassBreakdown = computeCompanyClassBreakdown(students);
    const timeline = computeTimelineStats(students);

    const safeTopOffers = topOffers;

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
