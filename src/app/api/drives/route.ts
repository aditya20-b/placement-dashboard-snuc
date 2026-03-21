import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCachedData } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";
import { fetchAndComputeDrives } from "@/lib/drives";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN" } },
        { status: 403 },
      );
    }

    const { data, cached } = await getCachedData(
      CACHE_KEYS.DRIVE_DATA,
      fetchAndComputeDrives,
    );

    return NextResponse.json({
      success: true,
      data,
      cached,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API /api/drives error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
