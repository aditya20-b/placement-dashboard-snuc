import "server-only";
import type {
  StudentRecord,
  ClassStats,
  OverviewStats,
  CTCStats,
  BoxPlotStats,
  CompanyStats,
  TopOffer,
  MultipleOfferStudent,
  TimelineEntry,
  ClassSection,
  NoOfferCompanyRow,
} from "@/types";
import { VALID_CLASS_SECTIONS, CTC_BUCKETS, VALID_OFFER_TYPES } from "./constants";
import { parseCTC, parseOfferDate } from "./format";

function computeBoxPlot(sortedDesc: number[]): BoxPlotStats {
  const asc = [...sortedDesc].reverse();
  const n = asc.length;
  if (n === 0) return { min: 0, p25: 0, median: 0, p75: 0, max: 0, average: 0 };
  const percentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return asc[lo] + (asc[hi] - asc[lo]) * (idx - lo);
  };
  const average = asc.reduce((a, b) => a + b, 0) / n;
  return {
    min: asc[0],
    p25: percentile(25),
    median: percentile(50),
    p75: percentile(75),
    max: asc[n - 1],
    average,
  };
}

export function computeOverviewStats(students: StudentRecord[], noOfferCompanyCount = 0): OverviewStats {
  const totalStudents = students.length;
  const optedPlacement = students.filter((s) => s.choice === "Placement").length;
  const optedHigherStudies = students.filter(
    (s) => s.choice === "Higher Studies"
  ).length;
  const placementExempt = students.filter(
    (s) => s.choice === "Placement Exempt"
  ).length;
  const totalPlaced = students.filter(
    (s) => s.choice === "Placement" && s.status === "Placed"
  ).length;
  const totalOffers = students.reduce((sum, s) => sum + s.offers.length, 0);
  const uniqueCompanies =
    noOfferCompanyCount > 0
      ? noOfferCompanyCount
      : new Set(students.flatMap((s) => s.offers.map((o) => o.company))).size;
  const internshipOnly = students.filter(
    (s) =>
      s.offers.length > 0 && s.offers.every((o) => o.offerType === "Internship")
  ).length;
  const placementPercent =
    optedPlacement > 0 ? (totalPlaced / optedPlacement) * 100 : 0;

  const classwiseStats: ClassStats[] = VALID_CLASS_SECTIONS.map((cs) => {
    const group = students.filter((s) => s.classSection === cs);
    const total = group.length;
    const male = group.filter((s) => s.gender === "Male").length;
    const female = group.filter((s) => s.gender === "Female").length;
    const opted = group.filter((s) => s.choice === "Placement").length;
    const hs = group.filter((s) => s.choice === "Higher Studies").length;
    const exempt = group.filter((s) => s.choice === "Placement Exempt").length;
    const placementGroup = group.filter((s) => s.choice === "Placement");
    const placed = placementGroup.filter((s) => s.status === "Placed").length;
    const notPlaced = placementGroup.filter((s) => s.status === "Not Placed").length;
    const hold = placementGroup.filter((s) => s.status === "Hold").length;
    const dropped = placementGroup.filter((s) => s.status === "Dropped").length;
    const offers = group.reduce((sum, s) => sum + s.offers.length, 0);

    const malePlaced = group.filter(
      (s) => s.choice === "Placement" && s.gender === "Male" && s.status === "Placed"
    ).length;
    const femalePlaced = group.filter(
      (s) => s.choice === "Placement" && s.gender === "Female" && s.status === "Placed"
    ).length;
    const maleOpted = group.filter(
      (s) => s.gender === "Male" && s.choice === "Placement"
    ).length;
    const femaleOpted = group.filter(
      (s) => s.gender === "Female" && s.choice === "Placement"
    ).length;

    return {
      classSection: cs,
      total,
      male,
      female,
      optedPlacement: opted,
      optedHigherStudies: hs,
      placementExempt: exempt,
      placed,
      notPlaced,
      hold,
      dropped,
      offers,
      placementPercent: opted > 0 ? (placed / opted) * 100 : 0,
      malePlacedPercent: maleOpted > 0 ? (malePlaced / maleOpted) * 100 : 0,
      femalePlacedPercent:
        femaleOpted > 0 ? (femalePlaced / femaleOpted) * 100 : 0,
    };
  });

  const allOffers = students.flatMap((s) => s.offers);
  const offerTypeBreakdown = VALID_OFFER_TYPES.map((type) => ({
    offerType: type,
    count: allOffers.filter((o) => o.offerType === type).length,
  })).filter((d) => d.count > 0);

  const placedStudents = students.filter(
    (s) => s.choice === "Placement" && s.status === "Placed"
  );
  const malePlaced = placedStudents.filter((s) => s.gender === "Male").length;
  const femalePlaced = placedStudents.filter((s) => s.gender === "Female").length;
  const maleTotal = students.filter((s) => s.choice === "Placement" && s.gender === "Male").length;
  const femaleTotal = students.filter((s) => s.choice === "Placement" && s.gender === "Female").length;

  return {
    totalStudents,
    optedPlacement,
    optedHigherStudies,
    placementExempt,
    totalPlaced,
    totalOffers,
    uniqueCompanies,
    internshipOnly,
    placementPercent,
    classwiseStats,
    offerTypeBreakdown,
    genderPlacementSplit: { malePlaced, femalePlaced, maleTotal, femaleTotal },
  };
}

export function computeCTCStats(students: StudentRecord[]): CTCStats {
  // Exclude internship offers
  const allOffers = students.flatMap((s) =>
    s.offers.filter((o) => o.offerType !== "Internship")
  );
  const ctcValues = allOffers.map((o) => o.ctc).filter((v) => v > 0);
  ctcValues.sort((a, b) => b - a); // descending

  const count = ctcValues.length;
  if (count === 0) {
    return {
      count: 0,
      highest: 0,
      lowest: 0,
      average: 0,
      median: 0,
      topPercentiles: [],
      topNAverages: [],
      percentileValues: [],
      bucketDistribution: [],
      boxPlot: { min: 0, p25: 0, median: 0, p75: 0, max: 0, average: 0 },
      ctcByOfferType: [],
      ctcByClass: [],
    };
  }

  const highest = ctcValues[0];
  const lowest = ctcValues[count - 1];
  const sum = ctcValues.reduce((a, b) => a + b, 0);
  const average = sum / count;
  const median =
    count % 2 === 0
      ? (ctcValues[count / 2 - 1] + ctcValues[count / 2]) / 2
      : ctcValues[Math.floor(count / 2)];

  // Top N% averages
  const percentages = [10, 25, 50, 75, 100];
  const topPercentiles = percentages.map((p) => {
    const n = Math.ceil((p / 100) * count);
    const topN = ctcValues.slice(0, n);
    const avg = topN.reduce((a, b) => a + b, 0) / topN.length;
    return { percent: p, average: avg };
  });

  // Top N averages (by count)
  const topCounts = [10, 25, 50, 75, 100];
  const topNAverages = topCounts
    .filter((n) => n <= count)
    .map((n) => {
      const topN = ctcValues.slice(0, n);
      const avg = topN.reduce((a, b) => a + b, 0) / topN.length;
      return { n, average: avg };
    });

  // Percentile values
  const percentilesForValues = [1, 10, 25, 50, 75, 100];
  const ascending = [...ctcValues].reverse();
  const percentileValues = percentilesForValues.map((p) => {
    const index = Math.ceil((p / 100) * ascending.length) - 1;
    return { n: p, value: ascending[Math.max(0, index)] };
  });

  // Bucket distribution
  const bucketDistribution = CTC_BUCKETS.map((bucket) => {
    const bucketCount = ctcValues.filter(
      (v) => v >= bucket.min && v < bucket.max
    ).length;
    return { bucket: bucket.label, count: bucketCount };
  });

  const boxPlot = computeBoxPlot(ctcValues);

  // CTC by offer type
  const offerTypeNames = VALID_OFFER_TYPES.filter((t) => t !== "Internship");
  const ctcByOfferType = offerTypeNames.map((type) => {
    const vals = allOffers
      .filter((o) => o.offerType === type && o.ctc > 0)
      .map((o) => o.ctc)
      .sort((a, b) => b - a);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const med = vals.length % 2 === 0
      ? (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
      : vals[Math.floor(vals.length / 2)];
    return { offerType: type, average: avg, median: med, count: vals.length };
  }).filter(Boolean) as { offerType: string; average: number; median: number; count: number }[];

  // CTC by class section
  const ctcByClass = VALID_CLASS_SECTIONS.map((cs) => {
    const vals = students
      .filter((s) => s.classSection === cs)
      .flatMap((s) => s.offers.filter((o) => o.offerType !== "Internship" && o.ctc > 0))
      .map((o) => o.ctc)
      .sort((a, b) => b - a);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const med = vals.length % 2 === 0
      ? (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
      : vals[Math.floor(vals.length / 2)];
    return { classSection: cs, average: avg, median: med, count: vals.length };
  }).filter(Boolean) as { classSection: string; average: number; median: number; count: number }[];

  return {
    count,
    highest,
    lowest,
    average,
    median,
    topPercentiles,
    topNAverages,
    percentileValues,
    bucketDistribution,
    boxPlot,
    ctcByOfferType,
    ctcByClass,
  };
}

export function computeCompanyStats(
  students: StudentRecord[],
  noOfferCompanies: NoOfferCompanyRow[] = []
): CompanyStats[] {
  const companyMap = new Map<
    string,
    { offers: number; dates: Set<string>; ctcs: number[] }
  >();

  const totalOffers = students.reduce((sum, s) => sum + s.offers.length, 0);

  for (const student of students) {
    for (const offer of student.offers) {
      const company = offer.company;
      const existing = companyMap.get(company) ?? {
        offers: 0,
        dates: new Set<string>(),
        ctcs: [],
      };
      existing.offers++;
      if (offer.offerDate) existing.dates.add(offer.offerDate);
      if (offer.ctc > 0) existing.ctcs.push(offer.ctc);
      companyMap.set(company, existing);
    }
  }

  // Append no-offer companies (only if not already present from offers)
  const noOfferSet = new Set<string>();
  for (const row of noOfferCompanies) {
    if (!companyMap.has(row.company)) {
      const ctc = parseCTC(row.ctcStipend);
      const date = parseOfferDate(row.visitDate);
      companyMap.set(row.company, {
        offers: 0,
        dates: date ? new Set([date]) : new Set(),
        ctcs: ctc > 0 ? [ctc] : [],
      });
      noOfferSet.add(row.company);
    }
  }

  return Array.from(companyMap.entries())
    .map(([company, data]) => ({
      company,
      offerCount: data.offers,
      offerDates: Array.from(data.dates).sort(),
      ctcValues: data.ctcs.sort((a, b) => b - a),
      percentage: totalOffers > 0 ? (data.offers / totalOffers) * 100 : 0,
      visitedOnly: noOfferSet.has(company),
    }))
    .sort((a, b) => b.offerCount - a.offerCount);
}

export function computeTopOffers(
  students: StudentRecord[],
  limit = 10
): TopOffer[] {
  // Deduplicate by company+ctc: keep only the highest CTC per company
  const seen = new Map<string, TopOffer>();
  for (const student of students) {
    for (const offer of student.offers) {
      if (offer.offerType === "Internship") continue;
      const key = `${offer.company}::${offer.ctc}`;
      if (!seen.has(key)) {
        seen.set(key, {
          company: offer.company,
          ctc: offer.ctc,
          offerType: offer.offerType,
        });
      }
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => b.ctc - a.ctc)
    .slice(0, limit);
}

export function computeMultipleOfferStudents(
  students: StudentRecord[]
): MultipleOfferStudent[] {
  return students
    .filter((s) => s.offers.length > 1)
    .map((s) => ({
      rollNo: s.rollNo,
      name: s.name,
      companies: s.offers.map((o) => o.company),
    }));
}

/** Compute offer count per company per classSection for stacked bar */
export function computeCompanyClassBreakdown(
  students: StudentRecord[]
): Record<string, Record<ClassSection | "total", number>> {
  const result: Record<string, Record<string, number>> = {};

  for (const student of students) {
    for (const offer of student.offers) {
      if (!result[offer.company]) {
        result[offer.company] = { total: 0 };
      }
      result[offer.company][student.classSection] =
        (result[offer.company][student.classSection] ?? 0) + 1;
      result[offer.company].total++;
    }
  }

  return result as Record<string, Record<ClassSection | "total", number>>;
}

export function computeTimelineStats(
  students: StudentRecord[]
): TimelineEntry[] {
  const grouped = new Map<string, { count: number; maxCtc: number }>();

  for (const student of students) {
    for (const offer of student.offers) {
      if (!offer.offerDate) continue;
      const key = `${offer.offerDate}|${offer.company}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
        existing.maxCtc = Math.max(existing.maxCtc, offer.ctc);
      } else {
        grouped.set(key, { count: 1, maxCtc: offer.ctc });
      }
    }
  }

  const entries: TimelineEntry[] = [];
  for (const [key, val] of grouped) {
    const [date, company] = key.split("|");
    entries.push({ date, company, count: val.count, ctc: val.maxCtc });
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
