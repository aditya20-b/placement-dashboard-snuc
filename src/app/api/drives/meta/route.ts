import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertDriveMeta } from "@/lib/sheets";
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
    const { company, driveType } = body as {
      company: string;
      driveType: DriveType;
    };

    if (!company || !driveType) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "company and driveType are required" } },
        { status: 400 },
      );
    }

    if (!VALID_DRIVE_TYPES.includes(driveType)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid driveType" } },
        { status: 400 },
      );
    }

    await upsertDriveMeta(company, driveType);
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
