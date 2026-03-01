import { format, parse } from "date-fns";

/** Format number as INR with full precision: ₹12,00,000 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format INR in compact form: ₹12L, ₹1Cr */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return formatINR(amount);
}

/** Parse CTC string (Indian format with commas) to number */
export function parseCTC(value: string): number {
  const cleaned = value.replace(/[₹,\s]/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse offer date string to ISO date string or null */
export function parseOfferDate(value: string): string | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = parse(value.trim(), "dd-MMM-yyyy", new Date());
    if (isNaN(parsed.getTime())) return null;
    return format(parsed, "yyyy-MM-dd");
  } catch {
    return null;
  }
}

/** Format ISO date to display format: "30 Jul 2025" */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  try {
    return format(new Date(isoDate), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

/** Convert string to title case */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Format a decimal as percentage: 0.6792 → "67.92%" */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
