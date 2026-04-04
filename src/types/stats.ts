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
  offerTypeBreakdown: { offerType: string; count: number }[];
  genderPlacementSplit: { malePlaced: number; femalePlaced: number; maleTotal: number; femaleTotal: number };
}

export interface BoxPlotStats {
  min: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  p99: number;
  max: number;
  average: number;
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
  boxPlot: BoxPlotStats;
  ctcByOfferType: { offerType: string; average: number; median: number; count: number }[];
  ctcByClass: { classSection: string; average: number; median: number; count: number }[];
}

export interface CompanyStats {
  company: string;
  offerCount: number;
  offerDates: string[];
  ctcValues: number[];
  percentage: number;
  companyType: string;
  companyDescription: string;
  visitedOnly?: boolean;
  offCampus?: boolean;
}

export interface TopOffer {
  company: string;
  ctc: number;
  offerType: OfferType;
  companyType: string;
  companyDescription: string;
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
