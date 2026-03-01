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
  /** Colors by class section */
  class: {
    "AIDS A": "#0056A2",
    "AIDS B": "#3387CF",
    "IOT A": "#D4A516",
    "IOT B": "#F3C948",
    CS: "#16A34A",
  } as Record<ClassSection, string>,

  /** Sequential palette */
  sequential: [
    "#0056A2",
    "#D4A516",
    "#16A34A",
    "#2563EB",
    "#D97706",
    "#7C3AED",
    "#DC2626",
    "#0891B2",
  ],

  /** Status colors */
  status: {
    Placed: "#16A34A",
    "Not Placed": "#DC2626",
    Hold: "#D97706",
    Dropped: "#6C757D",
    "LOR Issued": "#2563EB",
  } as Record<Status, string>,

  /** Offer type colors */
  offerType: {
    Regular: "#3387CF",
    Dream: "#0056A2",
    "Super Dream": "#D4A516",
    Marquee: "#16A34A",
    Internship: "#6C757D",
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
