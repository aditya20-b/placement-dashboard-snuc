"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OverviewStats, CTCStats, CompanyStats, TopOffer } from "@/types";
import { formatINRCompact } from "./format";

interface ExportSections {
  executiveSummary: boolean;
  classwiseBreakdown: boolean;
  ctcAnalysis: boolean;
  topOffers: boolean;
  companyDirectory: boolean;
  genderStats: boolean;
}

interface ExportData {
  overview: OverviewStats;
  ctc: CTCStats;
  companies: CompanyStats[];
  topOffers: TopOffer[];
}

export function generatePDFReport(
  data: ExportData,
  sections: ExportSections
): jsPDF {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 86, 162); // blue-500
  doc.text("SNU Chennai Placement Report", 105, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(108, 117, 125); // gray-500
  doc.text("Batch 2021-25", 105, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 105, y, {
    align: "center",
  });
  y += 12;

  // Executive Summary
  if (sections.executiveSummary) {
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("Executive Summary", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Students", String(data.overview.totalStudents)],
        ["Opted Placement", String(data.overview.optedPlacement)],
        ["Total Placed", String(data.overview.totalPlaced)],
        [
          "Placement Rate",
          `${data.overview.placementPercent.toFixed(1)}%`,
        ],
        ["Total Offers", String(data.overview.totalOffers)],
        ["Higher Studies", String(data.overview.optedHigherStudies)],
        ["Placement Exempt", String(data.overview.placementExempt)],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;
  }

  // Class-wise Breakdown
  if (sections.classwiseBreakdown) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("Class-Wise Breakdown", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [
        [
          "Class",
          "Total",
          "Male",
          "Female",
          "Placed",
          "Not Placed",
          "Placement %",
        ],
      ],
      body: data.overview.classwiseStats.map((cs) => [
        cs.classSection,
        String(cs.total),
        String(cs.male),
        String(cs.female),
        String(cs.placed),
        String(cs.notPlaced),
        `${cs.placementPercent.toFixed(1)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;
  }

  // CTC Analysis
  if (sections.ctcAnalysis) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("CTC Analysis", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Highest CTC", formatINRCompact(data.ctc.highest)],
        ["Lowest CTC", formatINRCompact(data.ctc.lowest)],
        ["Average CTC", formatINRCompact(Math.round(data.ctc.average))],
        ["Median CTC", formatINRCompact(data.ctc.median)],
        ["Total Offers (excl. Internship)", String(data.ctc.count)],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

    if (data.ctc.topPercentiles.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Top %", "Average CTC"]],
        body: data.ctc.topPercentiles.map((p) => [
          `Top ${p.percent}%`,
          formatINRCompact(Math.round(p.average)),
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 86, 162] },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 12;
    }
  }

  // Top Offers
  if (sections.topOffers) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("Top Offers", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "Student", "Company", "CTC", "Type"]],
      body: data.topOffers.map((o, i) => [
        String(i + 1),
        o.studentName,
        o.company,
        formatINRCompact(o.ctc),
        o.offerType,
      ]),
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;
  }

  // Company Directory
  if (sections.companyDirectory) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("Company Directory", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "Company", "Offers", "CTC Range", "%"]],
      body: data.companies.slice(0, 30).map((c, i) => [
        String(i + 1),
        c.company,
        String(c.offerCount),
        c.ctcValues.length > 0
          ? `${formatINRCompact(c.ctcValues[c.ctcValues.length - 1])} - ${formatINRCompact(c.ctcValues[0])}`
          : "—",
        `${c.percentage.toFixed(1)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;
  }

  // Gender Stats
  if (sections.genderStats) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 86, 162);
    doc.text("Gender Diversity Stats", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Class", "Male Placed %", "Female Placed %"]],
      body: data.overview.classwiseStats.map((cs) => [
        cs.classSection,
        `${cs.malePlacedPercent.toFixed(1)}%`,
        `${cs.femalePlacedPercent.toFixed(1)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [0, 86, 162] },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text(
      "Generated from SNU Placement Portal",
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    );
  }

  return doc;
}

export function generateCSV(
  data: { headers: string[]; rows: string[][] },
  filename: string
) {
  const csvContent = [
    data.headers.join(","),
    ...data.rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
