import "server-only";
import type {
  MasterSheetRow,
  OfferDetailSheetRow,
  StudentRecord,
  AnonymizedStudentRecord,
  Offer,
  Gender,
  Class,
  Section,
  ClassSection,
  Choice,
  Status,
  OfferType,
} from "@/types";
import { OFFER_TYPE_RANK, VALID_OFFER_TYPES } from "./constants";
import { parseCTC, parseOfferDate } from "./format";

function toClassSection(cls: Class, section: Section): ClassSection {
  if (cls === "CS") return "CS";
  return `${cls} ${section}` as ClassSection;
}

function parseGender(raw: string): Gender {
  return raw.trim() === "Female" ? "Female" : "Male";
}

function parseClass(raw: string): Class {
  const val = raw.trim().toUpperCase();
  if (val === "IOT") return "IOT";
  if (val === "CS") return "CS";
  return "AIDS";
}

function parseSection(raw: string): Section {
  const val = raw.trim().toUpperCase();
  if (val === "A") return "A";
  if (val === "B") return "B";
  return "";
}

function parseChoice(raw: string): Choice {
  const val = raw.trim();
  if (val.includes("Higher")) return "Higher Studies";
  if (val.includes("Exempt")) return "Placement Exempt";
  return "Placement";
}

function parseStatus(raw: string): Status {
  const val = raw.trim();
  if (val.includes("Not")) return "Not Placed";
  if (val.includes("Hold")) return "Hold";
  if (val.includes("Dropped")) return "Dropped";
  if (val.includes("LOR")) return "LOR Issued";
  if (val.includes("Placed")) return "Placed";
  return "Not Placed";
}

function normalizeCompanyName(raw: string): string {
  return raw
    .replace(/\b(PPO|Hackathon|Internship)\b/gi, "")
    .replace(/\(\s*(off\s*campus|Ninja|Digital)\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseOfferType(raw: string): OfferType {
  const val = raw.trim();
  const match = VALID_OFFER_TYPES.find(
    (t) => t.toLowerCase() === val.toLowerCase()
  );
  return match ?? "Regular";
}

function getBestOffer(offers: Offer[]): Offer | null {
  if (offers.length === 0) return null;
  return offers.reduce((best, curr) => {
    const bestRank = OFFER_TYPE_RANK[best.offerType] ?? 0;
    const currRank = OFFER_TYPE_RANK[curr.offerType] ?? 0;
    if (currRank > bestRank) return curr;
    if (currRank === bestRank && curr.ctc > best.ctc) return curr;
    return best;
  });
}

export function joinStudentRecords(
  master: MasterSheetRow[],
  offerDetails: OfferDetailSheetRow[]
): StudentRecord[] {
  // Group offers by roll number
  const offersByRoll = new Map<string, Offer[]>();
  for (const row of offerDetails) {
    const rollNo = row.rollNo.trim();
    if (!rollNo) continue;
    const offer: Offer = {
      company: normalizeCompanyName(row.company),
      ctc: parseCTC(row.ctcStipend),
      offerType: parseOfferType(row.offerType),
      offerDate: parseOfferDate(row.offerDate),
    };
    const existing = offersByRoll.get(rollNo) ?? [];
    existing.push(offer);
    offersByRoll.set(rollNo, existing);
  }

  return master.map((row) => {
    const rollNo = row.rollNo.trim();
    const cls = parseClass(row.class);
    const section = parseSection(row.section);
    const offers = offersByRoll.get(rollNo) ?? [];
    const companies = row.company
      ? row.company
          .split(",")
          .map((c) => normalizeCompanyName(c))
          .filter(Boolean)
      : [];

    return {
      rollNo,
      regNo: row.regNo.trim(),
      name: row.name.trim(),
      gender: parseGender(row.gender),
      class: cls,
      section,
      classSection: toClassSection(cls, section),
      choice: parseChoice(row.choice),
      status: parseStatus(row.status),
      companies,
      offers,
      bestOffer: getBestOffer(offers),
    };
  });
}

export function anonymizeRecord(
  record: StudentRecord
): AnonymizedStudentRecord {
  return {
    gender: record.gender,
    class: record.class,
    section: record.section,
    classSection: record.classSection,
    choice: record.choice,
    status: record.status,
    offers: record.offers,
    bestOffer: record.bestOffer,
  };
}
