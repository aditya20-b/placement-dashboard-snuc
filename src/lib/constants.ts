import type { Class, ClassSection, Choice, OfferType, Section, Status } from "@/types";

// ─── Validation allowlists ──────────────────────────────

export const VALID_CLASSES: Class[] = ["AIDS", "IOT", "CS"];

export const VALID_SECTIONS: Section[] = ["A", "B", ""];

export const VALID_CLASS_SECTIONS: ClassSection[] = [
  "AIDS A",
  "AIDS B",
  "IOT A",
  "IOT B",
  "CS",
];

export const VALID_STATUSES: Status[] = [
  "Placed",
  "Not Placed",
  "Hold",
  "Dropped",
  "LOR Issued",
];

export const VALID_CHOICES: Choice[] = [
  "Placement",
  "Higher Studies",
  "Placement Exempt",
];

export const VALID_OFFER_TYPES: OfferType[] = [
  "Regular",
  "Dream",
  "Super Dream",
  "Marquee",
  "Internship",
];

/** Rank for "best offer" computation (higher = better) */
export const OFFER_TYPE_RANK: Record<OfferType, number> = {
  Internship: 0,
  Regular: 1,
  Dream: 2,
  "Super Dream": 3,
  Marquee: 4,
};

// ─── Caching ────────────────────────────────────────────

export const CACHE_KEYS = {
  MASTER_SHEET: "sheets:master",
  OFFER_DETAILS: "sheets:offers",
  OVERVIEW_STATS: "stats:overview",
  CTC_STATS: "stats:ctc",
  COMPANY_STATS: "stats:companies",
  STUDENT_RECORDS: "data:students",
} as const;

/** Cache TTL in seconds */
export const CACHE_TTL = 300; // 5 minutes

// ─── CTC Histogram Buckets ──────────────────────────────

export const CTC_BUCKETS = [
  { label: "3-5L", min: 300000, max: 500000 },
  { label: "5-8L", min: 500000, max: 800000 },
  { label: "8-12L", min: 800000, max: 1200000 },
  { label: "12-20L", min: 1200000, max: 2000000 },
  { label: "20-50L", min: 2000000, max: 5000000 },
  { label: "50L+", min: 5000000, max: Infinity },
] as const;

// ─── Chart Colors ───────────────────────────────────────

export const CHART_COLORS = {
  /** Colors by class section — each adjacent color uses a distinct hue */
  class: {
    "AIDS A": "#2563EB",
    "AIDS B": "#06B6D4",
    "IOT A": "#F59E0B",
    "IOT B": "#EF4444",
    CS: "#10B981",
  } as Record<ClassSection, string>,

  /** Colors when grouped by class (no section split) */
  classGrouped: {
    AIDS: "#2563EB",
    IOT: "#F59E0B",
    CS: "#10B981",
  } as Record<string, string>,

  /** Sequential palette — vibrant, high-contrast */
  sequential: [
    "#2563EB",
    "#F59E0B",
    "#10B981",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
  ],

  /** Status colors */
  status: {
    Placed: "#10B981",
    "Not Placed": "#EF4444",
    Hold: "#F59E0B",
    Dropped: "#6B7280",
    "LOR Issued": "#3B82F6",
  } as Record<Status, string>,

  /** Offer type colors */
  offerType: {
    Regular: "#3B82F6",
    Dream: "#8B5CF6",
    "Super Dream": "#F59E0B",
    Marquee: "#10B981",
    Internship: "#6B7280",
  } as Record<OfferType, string>,
};

// ─── Sheet Column Mappings ──────────────────────────────

/** Master sheet column indices (0-based) */
export const MASTER_COLUMNS = {
  ROLL_NO: 0,
  REG_NO: 1,
  NAME: 2,
  GENDER: 3,
  CLASS: 4,
  SECTION: 5,
  CHOICE: 6,
  STATUS: 7,
  COMPANY: 8,
} as const;

/** Offer Details sheet column indices (0-based) */
export const OFFER_COLUMNS = {
  ROLL_NO: 0,
  NAME: 1,
  COMPANY: 2,
  CTC_STIPEND: 3,
  OFFER_TYPE: 4,
  OFFER_DATE: 5,
} as const;
