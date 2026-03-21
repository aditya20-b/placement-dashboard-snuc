import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { appendDriveHandler } from "@/lib/sheets";
import { deleteCache } from "@/lib/cache";
import { CACHE_KEYS, VALID_DRIVE_ROLES } from "@/lib/constants";
import type { DriveRole } from "@/types/drives";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN" } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { company, handler, role, notes = "" } = body as {
      company: string;
      handler: string;
      role: DriveRole;
      notes?: string;
    };

    if (!company || !handler || !role) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "company, handler, and role are required" } },
        { status: 400 },
      );
    }

    if (!VALID_DRIVE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid role" } },
        { status: 400 },
      );
    }

    await appendDriveHandler(company, handler, role, notes);
    deleteCache(CACHE_KEYS.DRIVE_DATA);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST /api/drives/handlers error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
