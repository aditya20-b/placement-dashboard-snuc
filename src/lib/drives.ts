import "server-only";
import {
  fetchDriveHandlers,
  fetchDriveMeta,
  fetchOfferDetails,
  fetchNoOfferCompanies,
} from "./sheets";
import { EXCLUDED_FROM_DENOMINATOR, VALID_DRIVE_ROLES } from "./constants";
import type {
  CompanyDriveView,
  DriveSummary,
  HandlerEntry,
  HandlerStats,
  DriveRole,
  DriveType,
} from "@/types/drives";

export interface DriveData {
  companies: CompanyDriveView[];
  handlerStats: HandlerStats[];
  summary: DriveSummary;
}

export async function fetchAndComputeDrives(): Promise<DriveData> {
  const [handlers, metaRows, offerDetails, noOfferCompanies] =
    await Promise.all([
      fetchDriveHandlers(),
      fetchDriveMeta(),
      fetchOfferDetails(),
      fetchNoOfferCompanies(),
    ]);

  // Build company → offers count + dates from Offer_Details
  const offersByCompany = new Map<
    string,
    { count: number; dates: Set<string> }
  >();
  for (const row of offerDetails) {
    const company = row.company.trim();
    if (!company) continue;
    const existing = offersByCompany.get(company) ?? {
      count: 0,
      dates: new Set(),
    };
    existing.count++;
    if (row.offerDate) existing.dates.add(row.offerDate.trim());
    offersByCompany.set(company, existing);
  }

  // Build company set from No_Offers_Company
  const noOfferCompanySet = new Set<string>();
  const noOfferDates = new Map<string, Set<string>>();
  for (const row of noOfferCompanies) {
    const company = row.company.trim();
    if (!company) continue;
    noOfferCompanySet.add(company);
    const existing = noOfferDates.get(company) ?? new Set();
    if (row.visitDate) existing.add(row.visitDate.trim());
    noOfferDates.set(company, existing);
  }

  // All companies = union of Offer_Details companies + No_Offers_Company
  const allCompanies = new Set<string>([
    ...offersByCompany.keys(),
    ...noOfferCompanySet,
  ]);

  // Build Drive_Meta lookup
  const metaByCompany = new Map<
    string,
    { driveType: string; notes: string; countsOverride: string }
  >();
  for (const row of metaRows) {
    metaByCompany.set(row.company, {
      driveType: row.driveType,
      notes: row.notes,
      countsOverride: row.countsOverride ?? "",
    });
  }

  // Build handlers grouped by company
  const handlersByCompany = new Map<string, HandlerEntry[]>();
  for (const h of handlers) {
    if (!h.company) continue;
    const role = VALID_DRIVE_ROLES.includes(h.role as DriveRole)
      ? (h.role as DriveRole)
      : "Support";
    const entry: HandlerEntry = {
      rowIndex: h.rowIndex,
      company: h.company,
      handler: h.handler,
      role,
      notes: h.notes,
    };
    const existing = handlersByCompany.get(h.company) ?? [];
    existing.push(entry);
    handlersByCompany.set(h.company, existing);
  }

  // Build CompanyDriveView for each company
  const companies: CompanyDriveView[] = [];
  for (const company of allCompanies) {
    const meta = metaByCompany.get(company);
    const rawDriveType = meta?.driveType ?? "";
    const driveType = rawDriveType as DriveType | null;
    const validDriveType =
      rawDriveType &&
      [
        "On Campus",
        "On Campus (Online)",
        "Off Campus",
        "PPO / Intern Conversion",
        "Half Campus",
        "Online Only",
      ].includes(rawDriveType)
        ? (rawDriveType as DriveType)
        : null;

    const rawOverride = meta?.countsOverride ?? "";
    const countsOverride = (rawOverride === "yes" || rawOverride === "no" ? rawOverride : "") as "yes" | "no" | "";
    const derived = validDriveType ? !EXCLUDED_FROM_DENOMINATOR.has(validDriveType) : true;
    const countsInDenominator = countsOverride === "yes" ? true : countsOverride === "no" ? false : derived;

    const offerData = offersByCompany.get(company);
    const offersGiven = offerData?.count ?? 0;

    // Dates: from offer dates or no-offer visit dates
    const dateSet = new Set<string>([
      ...(offerData?.dates ?? []),
      ...(noOfferDates.get(company) ?? []),
    ]);
    const dates = [...dateSet].filter(Boolean).sort();

    companies.push({
      company,
      dates,
      offersGiven,
      driveType: validDriveType,
      countsInDenominator,
      countsOverride,
      handlers: handlersByCompany.get(company) ?? [],
    });

    void driveType; // suppress unused warning
  }

  // Sort companies alphabetically
  companies.sort((a, b) => a.company.localeCompare(b.company));

  // Compute HandlerStats
  const handlerMap = new Map<
    string,
    {
      companies: Set<string>;
      offersFromDrives: number;
      roleBreakdown: Record<DriveRole, number>;
    }
  >();

  for (const h of handlers) {
    if (!h.handler || !h.company) continue;
    const role = VALID_DRIVE_ROLES.includes(h.role as DriveRole)
      ? (h.role as DriveRole)
      : "Support";

    const existing = handlerMap.get(h.handler) ?? {
      companies: new Set(),
      offersFromDrives: 0,
      roleBreakdown: {
        "End-to-End": 0,
        Volunteering: 0,
        Coordination: 0,
        Support: 0,
      },
    };

    existing.companies.add(h.company);
    existing.roleBreakdown[role]++;

    // Sum offers from this company
    const companyOffers = offersByCompany.get(h.company)?.count ?? 0;
    // Only add once per company (avoid double-counting for multiple handlers of same company)
    if (!existing.companies.has(h.company)) {
      existing.offersFromDrives += companyOffers;
    }

    handlerMap.set(h.handler, existing);
  }

  // Recalculate offersFromDrives properly (sum offers per unique company per handler)
  const handlerStats: HandlerStats[] = [];
  for (const [name, data] of handlerMap.entries()) {
    let offersFromDrives = 0;
    for (const company of data.companies) {
      offersFromDrives += offersByCompany.get(company)?.count ?? 0;
    }

    handlerStats.push({
      name,
      drivesHandled: data.companies.size,
      offersFromDrives,
      roleBreakdown: data.roleBreakdown,
      companies: [...data.companies].sort(),
    });
  }

  handlerStats.sort((a, b) => b.drivesHandled - a.drivesHandled);

  // Compute summary
  const summary: DriveSummary = {
    total: companies.length,
    inDenominator: companies.filter((c) => c.countsInDenominator).length,
    withHandlers: companies.filter((c) => c.handlers.length > 0).length,
    unclassified: companies.filter((c) => c.driveType === null).length,
  };

  return { companies, handlerStats, summary };
}
