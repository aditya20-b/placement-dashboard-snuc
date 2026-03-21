import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertDriveMeta, upsertDriveCountsOverride } from "@/lib/sheets";
import { deleteCache } from "@/lib/cache";
import { CACHE_KEYS, VALID_DRIVE_TYPES } from "@/lib/constants";
import type { DriveType } from "@/types/drives";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN" } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { company, driveType, countsOverride } = body as {
      company: string;
      driveType?: DriveType;
      countsOverride?: "yes" | "no" | "";
    };

    if (!company) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "company is required" } },
        { status: 400 },
      );
    }

    if (driveType !== undefined) {
      if (!VALID_DRIVE_TYPES.includes(driveType)) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "Invalid driveType" } },
          { status: 400 },
        );
      }
      await upsertDriveMeta(company, driveType);
    }

    if (countsOverride !== undefined) {
      if (countsOverride !== "yes" && countsOverride !== "no" && countsOverride !== "") {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "countsOverride must be yes, no, or empty" } },
          { status: 400 },
        );
      }
      await upsertDriveCountsOverride(company, countsOverride);
    }

    deleteCache(CACHE_KEYS.DRIVE_DATA);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API PATCH /api/drives/meta error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
