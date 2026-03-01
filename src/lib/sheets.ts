import "server-only";
import { google } from "googleapis";
import type { MasterSheetRow, OfferDetailSheetRow } from "@/types";
import type { Role } from "@/types/auth";
import { MASTER_COLUMNS, OFFER_COLUMNS } from "./constants";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
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
    range: "Access!A2:B",
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
