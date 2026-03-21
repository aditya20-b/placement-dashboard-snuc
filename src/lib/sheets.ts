import "server-only";
import { google } from "googleapis";
import type { MasterSheetRow, OfferDetailSheetRow, NoOfferCompanyRow } from "@/types";
import type { Role } from "@/types/auth";
import { MASTER_COLUMNS, OFFER_COLUMNS } from "./constants";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

// ─── Access List ────────────────────────────────────────

export interface AccessEntry {
  email: string;
  role: Role;
}

/**
 * Fetch the Access sheet to get allowed emails and their roles.
 * Sheet format: Column A = Email, Column B = Role (admin/viewer)
 * Row 1 = header (skipped)
 */
export async function fetchAccessList(): Promise<AccessEntry[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Access!A2:B21",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      email: row[0].trim().toLowerCase(),
      role: (row[1]?.trim().toLowerCase() === "admin" ? "admin" : "viewer") as Role,
    }));
}

// ─── Placement Data ─────────────────────────────────────

export async function fetchMasterSheet(): Promise<MasterSheetRow[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Master!A2:I",
  });

  const rows = res.data.values ?? [];
  return rows.map((row) => ({
    rollNo: row[MASTER_COLUMNS.ROLL_NO] ?? "",
    regNo: row[MASTER_COLUMNS.REG_NO] ?? "",
    name: row[MASTER_COLUMNS.NAME] ?? "",
    gender: row[MASTER_COLUMNS.GENDER] ?? "",
    class: row[MASTER_COLUMNS.CLASS] ?? "",
    section: row[MASTER_COLUMNS.SECTION] ?? "",
    choice: row[MASTER_COLUMNS.CHOICE] ?? "",
    status: row[MASTER_COLUMNS.STATUS] ?? "",
    company: row[MASTER_COLUMNS.COMPANY] ?? "",
  }));
}

export async function fetchOfferDetails(): Promise<OfferDetailSheetRow[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Offer_Details!A2:F",
  });

  const rows = res.data.values ?? [];
  return rows.map((row) => ({
    rollNo: row[OFFER_COLUMNS.ROLL_NO] ?? "",
    name: row[OFFER_COLUMNS.NAME] ?? "",
    company: row[OFFER_COLUMNS.COMPANY] ?? "",
    ctcStipend: row[OFFER_COLUMNS.CTC_STIPEND] ?? "",
    offerType: row[OFFER_COLUMNS.OFFER_TYPE] ?? "",
    offerDate: row[OFFER_COLUMNS.OFFER_DATE] ?? "",
  }));
}

export async function fetchNoOfferCompanies(): Promise<NoOfferCompanyRow[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "No_Offers_Company!B2:D",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      company: row[0]?.trim() ?? "",
      visitDate: row[1]?.trim() ?? "",
      ctcStipend: row[2]?.trim() ?? "",
    }));
}

export async function fetchTotalCompanyCount(): Promise<number> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Company_Details!B6:B",
  });

  const rows = res.data.values ?? [];
  return rows.filter((row) => row[0]?.trim()).length;
}

// ─── Drive Handlers ─────────────────────────────────────

export async function fetchDriveHandlers(): Promise<
  { rowIndex: number; company: string; handler: string; role: string; notes: string }[]
> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Drive_Handlers!A2:D",
  });

  const rows = res.data.values ?? [];
  return rows.map((row, i) => ({
    rowIndex: i + 2, // 1-based sheet row (header is row 1)
    company: row[0]?.trim() ?? "",
    handler: row[1]?.trim() ?? "",
    role: row[2]?.trim() ?? "",
    notes: row[3]?.trim() ?? "",
  }));
}

export async function fetchDriveMeta(): Promise<
  { company: string; driveType: string; notes: string; countsOverride: string }[]
> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Drive_Meta!A2:D",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      company: row[0]?.trim() ?? "",
      driveType: row[1]?.trim() ?? "",
      notes: row[2]?.trim() ?? "",
      countsOverride: row[3]?.trim().toLowerCase() ?? "",
    }));
}

export async function appendDriveHandler(
  company: string,
  handler: string,
  role: string,
  notes: string,
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Drive_Handlers!A2:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[company, handler, role, notes]],
    },
  });
}

export async function deleteDriveHandlerRow(rowIndex: number): Promise<void> {
  const sheets = getSheets();

  // Fetch the sheetId for Drive_Handlers
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === "Drive_Handlers",
  );
  if (!sheet?.properties || sheet.properties.sheetId == null) {
    throw new Error("Drive_Handlers sheet not found");
  }
  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteRange: {
            range: {
              sheetId,
              startRowIndex: rowIndex - 1,
              endRowIndex: rowIndex,
            },
            shiftDimension: "ROWS",
          },
        },
      ],
    },
  });
}

export async function upsertDriveMeta(
  company: string,
  driveType: string,
): Promise<void> {
  const sheets = getSheets();
  const existing = await fetchDriveMeta();
  const idx = existing.findIndex((r) => r.company === company);

  if (idx !== -1) {
    // Row is (idx + 2): header is row 1, data starts at row 2, idx is 0-based
    const rowNumber = idx + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Drive_Meta!B${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[driveType]],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Drive_Meta!A2:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[company, driveType, ""]],
      },
    });
  }
}

export async function upsertDriveCountsOverride(
  company: string,
  override: "yes" | "no" | "",
): Promise<void> {
  const sheets = getSheets();
  const existing = await fetchDriveMeta();
  const idx = existing.findIndex((r) => r.company === company);

  if (idx !== -1) {
    const rowNumber = idx + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Drive_Meta!D${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[override]] },
    });
  } else {
    // Row doesn't exist yet — create it with empty drive type
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Drive_Meta!A2:D",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[company, "", "", override]] },
    });
  }
}

// ─── Visitor Logging ────────────────────────────────────

/**
 * Append a visitor's details to the Access sheet log section (row 23+).
 * Fire-and-forget — errors are logged but never block sign-in.
 */
export async function appendVisitorLog(
  email: string,
  name: string,
): Promise<void> {
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Access!A23:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[email, name, new Date().toISOString()]],
      },
    });
  } catch (error) {
    console.error("Failed to log visitor:", error);
  }
}
