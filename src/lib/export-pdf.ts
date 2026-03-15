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

// ─── Brand Palette ─────────────────────────────────────
const BLUE: [number, number, number] = [0, 86, 162];
const BLUE_DARK: [number, number, number] = [0, 58, 107];
const GOLD: [number, number, number] = [212, 165, 22];
const LIGHT_BLUE: [number, number, number] = [230, 241, 250];
const WHITE: [number, number, number] = [255, 255, 255];
const GRAY: [number, number, number] = [108, 117, 125];
const DARK: [number, number, number] = [33, 37, 41];
const LIGHT_GRAY: [number, number, number] = [241, 243, 245];

const STATUS_COLORS: Record<string, [number, number, number]> = {
  Placed: [22, 163, 74],
  "Not Placed": [220, 38, 38],
  Hold: [217, 119, 6],
  Dropped: [108, 117, 125],
};

const CLASS_COLORS: [number, number, number][] = [
  [0, 86, 162],    // AIDS A
  [51, 135, 207],  // AIDS B
  [212, 165, 22],  // IOT A
  [243, 201, 72],  // IOT B
  [22, 163, 74],   // CS
];

// ─── Helpers ───────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** PDF-safe INR formatting — jsPDF default fonts lack the ₹ glyph */
function pdfINR(amount: number): string {
  return formatINRCompact(amount).replace("₹", "Rs.");
}

function getAutoTableFinalY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - 2 * MARGIN;

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 25) {
    doc.addPage();
    return 22;
  }
  return y;
}

async function loadLogoAsDataURL(): Promise<string | null> {
  try {
    const resp = await fetch("/logo_blue.png");
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Drawing Primitives ────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  y = checkPageBreak(doc, y, 16);
  doc.setFillColor(...GOLD);
  doc.rect(MARGIN, y, 36, 1.5, "F");
  y += 5;
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text(title, MARGIN, y);
  y += 7;
  return y;
}

/** Axis line with ticks and labels */
function drawXAxis(
  doc: jsPDF,
  x0: number, baseY: number, width: number,
  ticks: { pos: number; label: string }[],
) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(x0, baseY, x0 + width, baseY);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  for (const t of ticks) {
    doc.line(t.pos, baseY, t.pos, baseY + 2);
    doc.text(t.label, t.pos, baseY + 6, { align: "center" });
  }
}

function drawYAxis(
  doc: jsPDF,
  x0: number, y0: number, height: number,
  ticks: { pos: number; label: string }[],
) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(x0, y0, x0, y0 + height);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  for (const t of ticks) {
    doc.line(x0 - 2, t.pos, x0, t.pos);
    doc.text(t.label, x0 - 3, t.pos + 1, { align: "right" });
  }
}

function drawGridLines(doc: jsPDF, x0: number, width: number, yPositions: number[]) {
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.15);
  for (const yp of yPositions) {
    doc.line(x0, yp, x0 + width, yp);
  }
}

function drawLegend(
  doc: jsPDF,
  items: { label: string; color: [number, number, number] }[],
  x: number, y: number,
): number {
  doc.setFontSize(7);
  let lx = x;
  for (const item of items) {
    doc.setFillColor(...item.color);
    doc.roundedRect(lx, y - 2.5, 5, 5, 1, 1, "F");
    doc.setTextColor(60, 60, 60);
    const textW = doc.getTextWidth(item.label);
    doc.text(item.label, lx + 7, y + 1);
    lx += textW + 12;
  }
  return y + 8;
}

// ─── Highlight Card Grid (Executive Summary) ──────────

function drawHighlightCards(doc: jsPDF, overview: OverviewStats, y: number): number {
  y = checkPageBreak(doc, y, 50);

  const cards = [
    { label: "Total Students", value: fmt(overview.totalStudents), accent: BLUE },
    { label: "Opted Placement", value: fmt(overview.optedPlacement), accent: BLUE },
    { label: "Total Placed", value: fmt(overview.totalPlaced), accent: STATUS_COLORS.Placed },
    { label: "Placement Rate", value: `${overview.placementPercent.toFixed(1)}%`, accent: STATUS_COLORS.Placed },
    { label: "Total Offers", value: fmt(overview.totalOffers), accent: GOLD },
    { label: "Companies", value: fmt(overview.uniqueCompanies), accent: GOLD },
    { label: "Higher Studies", value: fmt(overview.optedHigherStudies), accent: [124, 58, 237] as [number, number, number] },
    { label: "Opted Out Placement", value: fmt(overview.placementExempt), accent: GRAY },
    { label: "Internship Only", value: fmt(overview.internshipOnly), accent: GRAY },
  ];

  const cols = 3;
  const cardW = (CONTENT_W - (cols - 1) * 4) / cols;
  const cardH = 18;
  const rows = Math.ceil(cards.length / cols);

  for (let r = 0; r < rows; r++) {
    y = checkPageBreak(doc, y, cardH + 4);
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= cards.length) break;
      const card = cards[idx];
      const cx = MARGIN + c * (cardW + 4);

      // Card background
      doc.setFillColor(...LIGHT_GRAY);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, "F");

      // Left accent bar
      doc.setFillColor(...card.accent);
      doc.rect(cx, y + 3, 1.5, cardH - 6, "F");

      // Label
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(card.label, cx + 5, y + 6);

      // Value
      doc.setFontSize(13);
      doc.setTextColor(...DARK);
      doc.text(card.value, cx + 5, y + 14);
    }
    y += cardH + 3;
  }

  return y + 2;
}

// ─── Chart: Placement Rate by Class (Horizontal bars) ──

function drawPlacementBarChart(
  doc: jsPDF,
  stats: OverviewStats["classwiseStats"],
  y: number,
): number {
  y = checkPageBreak(doc, y, 14 + stats.length * 13 + 8);

  // Title
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Placement Rate by Class", MARGIN, y);
  y += 6;

  const chartX = MARGIN + 28;
  const chartW = CONTENT_W - 28;
  const barH = 8;
  const gap = 5;

  // Grid ticks at 0, 25, 50, 75, 100%
  const gridTicks = [0, 25, 50, 75, 100];
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.15);
  for (const pct of gridTicks) {
    const gx = chartX + (pct / 100) * chartW;
    doc.line(gx, y, gx, y + stats.length * (barH + gap) - gap);
  }

  for (let i = 0; i < stats.length; i++) {
    const cs = stats[i];
    const by = y + i * (barH + gap);
    const barW = Math.max(0, (cs.placementPercent / 100) * chartW);

    // Class label
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(cs.classSection, chartX - 3, by + barH / 2 + 1, { align: "right" });

    // Track background
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(chartX, by, chartW, barH, 1.5, 1.5, "F");

    // Value bar
    const color = CLASS_COLORS[i % CLASS_COLORS.length];
    doc.setFillColor(...color);
    if (barW > 3) doc.roundedRect(chartX, by, barW, barH, 1.5, 1.5, "F");

    // Value label
    const pctText = `${cs.placementPercent.toFixed(1)}%`;
    doc.setFontSize(7.5);
    if (barW > 30) {
      doc.setTextColor(...WHITE);
      doc.text(pctText, chartX + barW - 2, by + barH / 2 + 1, { align: "right" });
    } else {
      doc.setTextColor(60, 60, 60);
      doc.text(pctText, chartX + barW + 2, by + barH / 2 + 1);
    }

    // Student count annotation
    doc.setFontSize(6.5);
    doc.setTextColor(140, 140, 140);
    doc.text(`${cs.placed}/${cs.optedPlacement}`, chartX + chartW + 2, by + barH / 2 + 1);
  }

  // Bottom axis ticks
  const axisY = y + stats.length * (barH + gap);
  const axisTicks = gridTicks.map((pct) => ({
    pos: chartX + (pct / 100) * chartW,
    label: `${pct}%`,
  }));
  drawXAxis(doc, chartX, axisY, chartW, axisTicks);

  return axisY + 12;
}

// ─── Chart: Classwise Stacked Bars (Vertical) ─────────

function drawClasswiseStackedChart(
  doc: jsPDF,
  stats: OverviewStats["classwiseStats"],
  y: number,
): number {
  y = checkPageBreak(doc, y, 85);

  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Student Status Distribution by Class", MARGIN, y);
  y += 8;

  const chartX = MARGIN + 20;
  const chartW = CONTENT_W - 24;
  const chartH = 55;
  const baseY = y + chartH;
  const barGroupW = chartW / stats.length;

  const maxTotal = Math.max(...stats.map((cs) => cs.total));

  // Y-axis gridlines & ticks
  const ySteps = 5;
  const yTicks: { pos: number; label: string }[] = [];
  const gridYs: number[] = [];
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxTotal / ySteps) * i);
    const yPos = baseY - (val / maxTotal) * chartH;
    yTicks.push({ pos: yPos, label: fmt(val) });
    gridYs.push(yPos);
  }
  drawGridLines(doc, chartX, chartW, gridYs);
  drawYAxis(doc, chartX, y, chartH, yTicks);

  const statusKeys: { key: string; color: [number, number, number] }[] = [
    { key: "placed", color: STATUS_COLORS.Placed },
    { key: "notPlaced", color: STATUS_COLORS["Not Placed"] },
    { key: "hold", color: STATUS_COLORS.Hold },
    { key: "dropped", color: STATUS_COLORS.Dropped },
  ];

  for (let i = 0; i < stats.length; i++) {
    const cs = stats[i];
    const gx = chartX + i * barGroupW;
    const bx = gx + barGroupW * 0.2;
    const bw = barGroupW * 0.6;

    let segY = baseY;
    for (const sk of statusKeys) {
      const val = cs[sk.key as keyof typeof cs] as number;
      if (val === 0) continue;
      const h = (val / maxTotal) * chartH;
      segY -= h;
      doc.setFillColor(...sk.color);
      doc.rect(bx, segY, bw, h, "F");

      // Value inside segment if tall enough
      if (h > 6) {
        doc.setFontSize(6.5);
        doc.setTextColor(...WHITE);
        doc.text(String(val), bx + bw / 2, segY + h / 2 + 1, { align: "center" });
      }
    }

    // Class label below bar
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(cs.classSection, gx + barGroupW / 2, baseY + 5, { align: "center" });

    // Total above bar
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(String(cs.total), gx + barGroupW / 2, segY - 2, { align: "center" });
  }

  // X-axis line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(chartX, baseY, chartX + chartW, baseY);

  // Legend
  let ly = baseY + 10;
  ly = drawLegend(doc, statusKeys.map((sk) => ({ label: sk.key === "notPlaced" ? "Not Placed" : sk.key.charAt(0).toUpperCase() + sk.key.slice(1), color: sk.color })), chartX, ly);

  return ly + 2;
}

// ─── Chart: Placement Pipeline (Stacked horizontal) ───

function drawPipelineBar(
  doc: jsPDF,
  overview: OverviewStats,
  y: number,
): number {
  y = checkPageBreak(doc, y, 35);

  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Placement Pipeline", MARGIN, y);
  y += 6;

  const barX = MARGIN;
  const barW = CONTENT_W;
  const barH = 14;

  const segments = [
    { label: "Placed", value: overview.totalPlaced, color: STATUS_COLORS.Placed },
    { label: "Not Placed", value: overview.classwiseStats.reduce((s, c) => s + c.notPlaced, 0), color: STATUS_COLORS["Not Placed"] },
    { label: "Hold", value: overview.classwiseStats.reduce((s, c) => s + c.hold, 0), color: STATUS_COLORS.Hold },
    { label: "Dropped", value: overview.classwiseStats.reduce((s, c) => s + c.dropped, 0), color: STATUS_COLORS.Dropped },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return y + barH + 10;

  // Rounded background
  doc.setFillColor(235, 235, 235);
  doc.roundedRect(barX, y, barW, barH, 3, 3, "F");

  // Stacked segments
  let sx = barX;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const w = (seg.value / total) * barW;
    doc.setFillColor(...seg.color);

    // First and last get rounded corners; middle get square
    if (i === 0 && segments.length === 1) {
      doc.roundedRect(sx, y, w, barH, 3, 3, "F");
    } else if (i === 0) {
      // Left-rounded only — draw rounded, then patch right edge
      doc.roundedRect(sx, y, w + 3, barH, 3, 3, "F");
      doc.rect(sx + w - 1, y, 4, barH, "F");
    } else if (i === segments.length - 1) {
      doc.roundedRect(sx - 3, y, w + 3, barH, 3, 3, "F");
      doc.rect(sx - 1, y, 4, barH, "F");
    } else {
      doc.rect(sx, y, w, barH, "F");
    }

    // Label + value inside if wide enough
    if (w > 18) {
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      const pct = ((seg.value / total) * 100).toFixed(0);
      doc.text(`${seg.label}`, sx + w / 2, y + 5.5, { align: "center" });
      doc.setFontSize(8);
      doc.text(`${seg.value} (${pct}%)`, sx + w / 2, y + 11, { align: "center" });
    }
    sx += w;
  }

  // Legend row below
  y += barH + 4;
  y = drawLegend(doc, segments.map((s) => ({ label: `${s.label}: ${s.value}`, color: s.color })), barX, y);

  return y + 2;
}

// ─── Chart: CTC Distribution (Vertical bars) ──────────

function drawCTCDistribution(
  doc: jsPDF,
  buckets: CTCStats["bucketDistribution"],
  y: number,
): number {
  if (buckets.length === 0) return y;
  y = checkPageBreak(doc, y, 80);

  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("CTC Distribution (Offer Count by Range)", MARGIN, y);
  y += 8;

  const chartX = MARGIN + 16;
  const chartW = CONTENT_W - 20;
  const chartH = 50;
  const baseY = y + chartH;
  const barGroupW = chartW / buckets.length;

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  // Y-axis gridlines
  const steps = 4;
  const yTicks: { pos: number; label: string }[] = [];
  const gridYs: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxCount / steps) * i);
    const yPos = baseY - (val / maxCount) * chartH;
    yTicks.push({ pos: yPos, label: String(val) });
    gridYs.push(yPos);
  }
  drawGridLines(doc, chartX, chartW, gridYs);
  drawYAxis(doc, chartX, y, chartH, yTicks);

  // Y-axis title
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Offers", chartX - 14, y + chartH / 2, { angle: 90 });

  const blueGradient: [number, number, number][] = [
    [179, 212, 240],
    [128, 182, 226],
    [77, 149, 210],
    [38, 118, 191],
    [0, 86, 162],
    [0, 58, 107],
  ];

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const gx = chartX + i * barGroupW;
    const bx = gx + barGroupW * 0.15;
    const bw = barGroupW * 0.7;
    const h = (b.count / maxCount) * chartH;

    const color = blueGradient[i % blueGradient.length];
    doc.setFillColor(...color);
    if (h > 1) doc.roundedRect(bx, baseY - h, bw, h, 1, 1, "F");

    // Count above bar
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(String(b.count), bx + bw / 2, baseY - h - 2, { align: "center" });

    // Bucket label below
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(b.bucket, gx + barGroupW / 2, baseY + 5, { align: "center" });
  }

  // X-axis line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(chartX, baseY, chartX + chartW, baseY);

  // X-axis title
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("CTC Range", chartX + chartW / 2, baseY + 11, { align: "center" });

  return baseY + 16;
}

// ─── Chart: Gender Comparison (Grouped bars) ──────────

function drawGenderChart(
  doc: jsPDF,
  stats: OverviewStats["classwiseStats"],
  y: number,
): number {
  y = checkPageBreak(doc, y, 80);

  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Gender-Wise Placement Rate", MARGIN, y);
  y += 8;

  const chartX = MARGIN + 20;
  const chartW = CONTENT_W - 24;
  const chartH = 48;
  const baseY = y + chartH;
  const groupW = chartW / stats.length;

  // Y-axis 0-100%
  const yTicks: { pos: number; label: string }[] = [];
  const gridYs: number[] = [];
  for (let pct = 0; pct <= 100; pct += 25) {
    const yPos = baseY - (pct / 100) * chartH;
    yTicks.push({ pos: yPos, label: `${pct}%` });
    gridYs.push(yPos);
  }
  drawGridLines(doc, chartX, chartW, gridYs);
  drawYAxis(doc, chartX, y, chartH, yTicks);

  const maleColor: [number, number, number] = [0, 86, 162];
  const femaleColor: [number, number, number] = [212, 165, 22];

  for (let i = 0; i < stats.length; i++) {
    const cs = stats[i];
    const gx = chartX + i * groupW;
    const halfBar = groupW * 0.3;

    // Male bar
    const mH = (cs.malePlacedPercent / 100) * chartH;
    doc.setFillColor(...maleColor);
    if (mH > 1) doc.roundedRect(gx + groupW * 0.1, baseY - mH, halfBar, mH, 1, 1, "F");
    if (mH > 5) {
      doc.setFontSize(6);
      doc.setTextColor(...WHITE);
      doc.text(`${cs.malePlacedPercent.toFixed(0)}%`, gx + groupW * 0.1 + halfBar / 2, baseY - mH + 5, { align: "center" });
    }

    // Female bar
    const fH = (cs.femalePlacedPercent / 100) * chartH;
    doc.setFillColor(...femaleColor);
    if (fH > 1) doc.roundedRect(gx + groupW * 0.1 + halfBar + 1, baseY - fH, halfBar, fH, 1, 1, "F");
    if (fH > 5) {
      doc.setFontSize(6);
      doc.setTextColor(...DARK);
      doc.text(`${cs.femalePlacedPercent.toFixed(0)}%`, gx + groupW * 0.1 + halfBar + 1 + halfBar / 2, baseY - fH + 5, { align: "center" });
    }

    // Class label
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(cs.classSection, gx + groupW / 2, baseY + 5, { align: "center" });
  }

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(chartX, baseY, chartX + chartW, baseY);

  let ly = baseY + 10;
  ly = drawLegend(doc, [
    { label: "Male Placed %", color: maleColor },
    { label: "Female Placed %", color: femaleColor },
  ], chartX, ly);

  return ly + 2;
}

// ─── Table Styling ─────────────────────────────────────

function getTableStyles() {
  const headFill: [number, number, number] = [BLUE[0], BLUE[1], BLUE[2]];
  const headText: [number, number, number] = [WHITE[0], WHITE[1], WHITE[2]];
  const altRowFill: [number, number, number] = [LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2]];
  return {
    theme: "striped" as const,
    headStyles: {
      fillColor: headFill,
      textColor: headText,
      fontStyle: "bold" as const,
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: altRowFill },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: MARGIN, right: MARGIN },
  };
}

// ─── Main Export Function ──────────────────────────────

export async function generatePDFReport(
  data: ExportData,
  sections: ExportSections,
): Promise<jsPDF> {
  const doc = new jsPDF();
  let y = 0;

  const logoDataUrl = await loadLogoAsDataURL();
  const ts = getTableStyles();

  // ━━━ COVER HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, PAGE_W, 1.5, "F");

  if (logoDataUrl) {
    doc.setFillColor(...WHITE);
    doc.roundedRect(11, 5, 22, 22, 2, 2, "F");
    doc.addImage(logoDataUrl, "PNG", 12, 6, 20, 20);
  }

  const textX = logoDataUrl ? 40 : MARGIN;
  doc.setFontSize(17);
  doc.setTextColor(...WHITE);
  doc.text("SNU Chennai — Placement Report", textX, 16);
  doc.setFontSize(10);
  doc.setTextColor(200, 220, 240);
  doc.text("B.Tech Batch 2022–26", textX, 23);
  doc.setFontSize(7.5);
  doc.text(`Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, PAGE_W - MARGIN, 23, { align: "right" });

  y = 42;

  // ━━━ 1. EXECUTIVE SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.executiveSummary) {
    y = drawSectionHeader(doc, "Executive Summary", y);
    y = drawHighlightCards(doc, data.overview, y);
    y += 2;
    y = drawPlacementBarChart(doc, data.overview.classwiseStats, y);
    y = drawPipelineBar(doc, data.overview, y);
  }

  // ━━━ 2. CLASSWISE BREAKDOWN ━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.classwiseBreakdown) {
    y = checkPageBreak(doc, y, 60);
    y = drawSectionHeader(doc, "Class-Wise Breakdown", y);

    // Full table matching the dashboard: all 14 columns
    const classwiseHead = [
      "Class", "Total", "M", "F", "Opted", "HS", "Opted Out",
      "Placed", "Not Pl.", "Hold", "Drop", "Pl. %", "M %", "F %",
    ];

    const classwiseBody = data.overview.classwiseStats.map((cs) => [
      cs.classSection,
      fmt(cs.total),
      fmt(cs.male),
      fmt(cs.female),
      fmt(cs.optedPlacement),
      fmt(cs.optedHigherStudies),
      fmt(cs.placementExempt),
      fmt(cs.placed),
      fmt(cs.notPlaced),
      fmt(cs.hold),
      fmt(cs.dropped),
      `${cs.placementPercent.toFixed(1)}%`,
      `${cs.malePlacedPercent.toFixed(1)}%`,
      `${cs.femalePlacedPercent.toFixed(1)}%`,
    ]);

    // Totals row
    const t = data.overview.classwiseStats.reduce(
      (a, cs) => ({
        total: a.total + cs.total,
        male: a.male + cs.male,
        female: a.female + cs.female,
        opted: a.opted + cs.optedPlacement,
        hs: a.hs + cs.optedHigherStudies,
        exempt: a.exempt + cs.placementExempt,
        placed: a.placed + cs.placed,
        notPlaced: a.notPlaced + cs.notPlaced,
        hold: a.hold + cs.hold,
        dropped: a.dropped + cs.dropped,
      }),
      { total: 0, male: 0, female: 0, opted: 0, hs: 0, exempt: 0, placed: 0, notPlaced: 0, hold: 0, dropped: 0 },
    );
    const totalPct = t.opted > 0 ? ((t.placed / t.opted) * 100).toFixed(1) : "0.0";
    classwiseBody.push([
      "TOTAL", fmt(t.total), fmt(t.male), fmt(t.female),
      fmt(t.opted), fmt(t.hs), fmt(t.exempt),
      fmt(t.placed), fmt(t.notPlaced), fmt(t.hold), fmt(t.dropped),
      `${totalPct}%`, "–", "–",
    ]);

    autoTable(doc, {
      startY: y,
      head: [classwiseHead],
      body: classwiseBody,
      ...ts,
      styles: { ...ts.styles, fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: "bold" },
        11: { fontStyle: "bold" },
      },
      didParseCell: (hookData) => {
        // Bold + border the TOTAL row
        if (hookData.section === "body" && hookData.row.index === classwiseBody.length - 1) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [210, 225, 240];
        }
      },
    });

    y = getAutoTableFinalY(doc) + 8;

    // Stacked chart
    y = drawClasswiseStackedChart(doc, data.overview.classwiseStats, y);
  }

  // ━━━ 3. CTC ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.ctcAnalysis) {
    y = checkPageBreak(doc, y, 50);
    y = drawSectionHeader(doc, "CTC Analysis", y);

    // Key CTC stats as a compact 2×2 card grid
    const ctcCards = [
      { label: "Highest CTC", value: pdfINR(data.ctc.highest) },
      { label: "Lowest CTC", value: pdfINR(data.ctc.lowest) },
      { label: "Average CTC", value: pdfINR(Math.round(data.ctc.average)) },
      { label: "Median CTC", value: pdfINR(data.ctc.median) },
    ];

    const cardW = (CONTENT_W - 6) / 2;
    const cardH = 15;
    for (let r = 0; r < 2; r++) {
      y = checkPageBreak(doc, y, cardH + 4);
      for (let c = 0; c < 2; c++) {
        const card = ctcCards[r * 2 + c];
        const cx = MARGIN + c * (cardW + 6);
        doc.setFillColor(...LIGHT_GRAY);
        doc.roundedRect(cx, y, cardW, cardH, 2, 2, "F");
        doc.setFillColor(...GOLD);
        doc.rect(cx, y + 3, 1.5, cardH - 6, "F");
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(card.label, cx + 5, y + 5.5);
        doc.setFontSize(12);
        doc.setTextColor(...DARK);
        doc.text(card.value, cx + 5, y + 12.5);
      }
      y += cardH + 3;
    }
    y += 2;

    // Top percentile table
    if (data.ctc.topPercentiles.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Top %", "Average CTC"]],
        body: data.ctc.topPercentiles.map((p) => [
          `Top ${p.percent}%`,
          pdfINR(Math.round(p.average)),
        ]),
        ...ts,
      });
      y = getAutoTableFinalY(doc) + 8;
    }

    // CTC distribution chart
    y = drawCTCDistribution(doc, data.ctc.bucketDistribution, y);
  }

  // ━━━ 4. TOP OFFERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.topOffers) {
    y = checkPageBreak(doc, y, 50);
    y = drawSectionHeader(doc, "Top Offers", y);

    autoTable(doc, {
      startY: y,
      head: [["#", "Company", "CTC", "Type"]],
      body: data.topOffers.map((o, i) => [
        String(i + 1),
        o.company,
        pdfINR(o.ctc),
        o.offerType,
      ]),
      ...ts,
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { halign: "right", fontStyle: "bold" },
        3: { cellWidth: 26 },
      },
    });

    y = getAutoTableFinalY(doc) + 10;
  }

  // ━━━ 5. COMPANY DIRECTORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.companyDirectory) {
    y = checkPageBreak(doc, y, 50);
    y = drawSectionHeader(doc, "Company Directory", y);

    autoTable(doc, {
      startY: y,
      head: [["#", "Company", "Offers", "CTC Range", "Share"]],
      body: data.companies.map((c, i) => [
        String(i + 1),
        c.company,
        fmt(c.offerCount),
        c.ctcValues.length > 0
          ? c.ctcValues.length === 1
            ? pdfINR(c.ctcValues[0])
            : `${pdfINR(c.ctcValues[c.ctcValues.length - 1])} – ${pdfINR(c.ctcValues[0])}`
          : "—",
        `${c.percentage.toFixed(1)}%`,
      ]),
      ...ts,
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    y = getAutoTableFinalY(doc) + 10;
  }

  // ━━━ 6. GENDER STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (sections.genderStats) {
    y = checkPageBreak(doc, y, 50);
    y = drawSectionHeader(doc, "Gender Diversity", y);

    // Table
    autoTable(doc, {
      startY: y,
      head: [["Class", "Male Placed %", "Female Placed %"]],
      body: data.overview.classwiseStats.map((cs) => [
        cs.classSection,
        `${cs.malePlacedPercent.toFixed(1)}%`,
        `${cs.femalePlacedPercent.toFixed(1)}%`,
      ]),
      ...ts,
    });

    y = getAutoTableFinalY(doc) + 8;

    // Chart
    y = drawGenderChart(doc, data.overview.classwiseStats, y);
  }

  // ━━━ FOOTER ON ALL PAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Gold line
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN, PAGE_H - 15, CONTENT_W, 0.5, "F");

    // Institutional name
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text("Shiv Nadar University Chennai  |  Placement Cell", MARGIN, PAGE_H - 9);

    // Page number
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" });
  }

  return doc;
}

export function generateCSV(
  data: { headers: string[]; rows: string[][] },
  filename: string,
) {
  const csvContent = [
    data.headers.join(","),
    ...data.rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
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
