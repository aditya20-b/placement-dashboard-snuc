import "server-only";
import type {
  StudentRecord,
  ClassStats,
  OverviewStats,
  CTCStats,
  CompanyStats,
  TopOffer,
  MultipleOfferStudent,
  ClassSection,
} from "@/types";
import { VALID_CLASS_SECTIONS, CTC_BUCKETS } from "./constants";

export function computeOverviewStats(students: StudentRecord[]): OverviewStats {
  const totalStudents = students.length;
  const optedPlacement = students.filter((s) => s.choice === "Placement").length;
  const optedHigherStudies = students.filter(
    (s) => s.choice === "Higher Studies"
  ).length;
  const placementExempt = students.filter(
    (s) => s.choice === "Placement Exempt"
  ).length;
  const totalPlaced = students.filter((s) => s.status === "Placed").length;
  const totalOffers = students.reduce((sum, s) => sum + s.offers.length, 0);
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
    const placed = group.filter((s) => s.status === "Placed").length;
    const notPlaced = group.filter((s) => s.status === "Not Placed").length;
    const hold = group.filter((s) => s.status === "Hold").length;
    const dropped = group.filter((s) => s.status === "Dropped").length;

    const malePlaced = group.filter(
      (s) => s.gender === "Male" && s.status === "Placed"
    ).length;
    const femalePlaced = group.filter(
      (s) => s.gender === "Female" && s.status === "Placed"
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
      placementPercent: opted > 0 ? (placed / opted) * 100 : 0,
      malePlacedPercent: maleOpted > 0 ? (malePlaced / maleOpted) * 100 : 0,
      femalePlacedPercent:
        femaleOpted > 0 ? (femalePlaced / femaleOpted) * 100 : 0,
    };
  });

  return {
    totalStudents,
    optedPlacement,
    optedHigherStudies,
    placementExempt,
    totalPlaced,
    totalOffers,
    placementPercent,
    classwiseStats,
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
  };
}

export function computeCompanyStats(
  students: StudentRecord[]
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

  return Array.from(companyMap.entries())
    .map(([company, data]) => ({
      company,
      offerCount: data.offers,
      offerDates: Array.from(data.dates).sort(),
      ctcValues: data.ctcs.sort((a, b) => b - a),
      percentage: totalOffers > 0 ? (data.offers / totalOffers) * 100 : 0,
    }))
    .sort((a, b) => b.offerCount - a.offerCount);
}

export function computeTopOffers(
  students: StudentRecord[],
  limit = 10
): TopOffer[] {
  const allOffers: TopOffer[] = [];
  for (const student of students) {
    for (const offer of student.offers) {
      if (offer.offerType === "Internship") continue;
      allOffers.push({
        studentName: student.name,
        company: offer.company,
        ctc: offer.ctc,
        offerType: offer.offerType,
      });
    }
  }
  return allOffers.sort((a, b) => b.ctc - a.ctc).slice(0, limit);
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
