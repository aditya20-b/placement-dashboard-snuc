export type DriveRole = "End-to-End" | "Volunteering" | "Coordination" | "Support";

export type DriveType =
  | "On Campus"
  | "On Campus (Online)"
  | "Off Campus"
  | "PPO / Intern Conversion"
  | "Half Campus"
  | "Online Only";

export interface HandlerEntry {
  rowIndex: number; // 1-based sheet row — required for delete
  company: string;
  handler: string;
  role: DriveRole;
  notes: string;
}

export interface DriveMeta {
  company: string;
  driveType: DriveType | null;
  countsInDenominator: boolean; // false only for "Off Campus" | "PPO / Intern Conversion"
}

export interface CompanyDriveView {
  company: string;
  dates: string[];
  offersGiven: number;
  driveType: DriveType | null;
  countsInDenominator: boolean;
  countsOverride: "yes" | "no" | ""; // "" = derived from drive type
  handlers: HandlerEntry[];
}

export interface HandlerStats {
  name: string;
  drivesHandled: number;
  offersFromDrives: number;
  roleBreakdown: Record<DriveRole, number>;
  companies: string[];
}

export interface DriveSummary {
  total: number;
  inDenominator: number;
  withHandlers: number;
  unclassified: number;
}
