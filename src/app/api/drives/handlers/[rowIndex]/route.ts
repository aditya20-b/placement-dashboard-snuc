import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { deleteDriveHandlerRow } from "@/lib/sheets";
import { deleteCache } from "@/lib/cache";
import { CACHE_KEYS } from "@/lib/constants";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ rowIndex: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN" } },
        { status: 403 },
      );
    }

    const { rowIndex: rowIndexStr } = await params;
    const rowIndex = Number(rowIndexStr);
    if (isNaN(rowIndex) || rowIndex < 2) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid rowIndex" } },
        { status: 400 },
      );
    }

    await deleteDriveHandlerRow(rowIndex);
    deleteCache(CACHE_KEYS.DRIVE_DATA);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API DELETE /api/drives/handlers/[rowIndex] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
