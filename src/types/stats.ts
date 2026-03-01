import type { ClassSection, OfferType } from "./student";

export interface ClassStats {
  classSection: ClassSection;
  total: number;
  male: number;
  female: number;
  optedPlacement: number;
  optedHigherStudies: number;
  placementExempt: number;
  placed: number;
  notPlaced: number;
  hold: number;
  dropped: number;
  placementPercent: number;
  malePlacedPercent: number;
  femalePlacedPercent: number;
  offers: number;
}

export interface OverviewStats {
  totalStudents: number;
  optedPlacement: number;
  optedHigherStudies: number;
  placementExempt: number;
  totalPlaced: number;
  totalOffers: number;
  uniqueCompanies: number;
  internshipOnly: number;
  placementPercent: number;
  classwiseStats: ClassStats[];
}

export interface CTCStats {
  count: number;
  highest: number;
  lowest: number;
  average: number;
  median: number;
  topPercentiles: { percent: number; average: number }[];
  topNAverages: { n: number; average: number }[];
  percentileValues: { n: number; value: number }[];
  bucketDistribution: { bucket: string; count: number }[];
}

export interface CompanyStats {
  company: string;
  offerCount: number;
  offerDates: string[];
  ctcValues: number[];
  percentage: number;
}

export interface TopOffer {
  company: string;
  ctc: number;
  offerType: OfferType;
}

export interface MultipleOfferStudent {
  rollNo: string;
  name: string;
  companies: string[];
}

export interface TimelineEntry {
  date: string;
  company: string;
  count: number;
  ctc: number;
}
