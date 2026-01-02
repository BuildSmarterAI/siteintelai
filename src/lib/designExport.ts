/**
 * SiteIntel™ Design Mode - Export Functions
 * 
 * Per PRD: Only allowed exports are PNG, PDF snapshots, and metrics CSV.
 * All exports MUST include disclaimer footer.
 * 
 * BLOCKED: CAD, BIM, DWG, IFC, Revit, or any construction-grade formats.
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { DesignVariant, RegulatoryEnvelope } from "@/stores/useDesignStore";
import type { DesignMetrics } from "@/lib/designMetrics";

// Legal disclaimer required on all exports
const DISCLAIMER_TEXT = 
  "CONCEPTUAL DESIGN ONLY. Not architectural drawings. " +
  "Not for construction, permitting, or bidding. " +
  "Design scenarios are illustrative and subject to professional verification.";

const DISCLAIMER_SHORT = "Conceptual Design Only - Not for Construction";

// Blocked export formats (per PRD section 8)
const BLOCKED_FORMATS = [
  "dwg", "dxf", "dgn", // CAD formats
  "ifc", "rvt", "rfa", // BIM formats
  "obj", "fbx", "3ds", // 3D model formats
  "step", "iges",      // Engineering formats
] as const;

export type AllowedExportFormat = "png" | "pdf" | "csv";

export interface ExportOptions {
  format: AllowedExportFormat;
  variants: DesignVariant[];
  envelope: RegulatoryEnvelope;
  includeMetrics?: boolean;
  includeCompliance?: boolean;
  fileName?: string;
}

/**
 * Check if a format is blocked (construction-grade)
 */
export function isBlockedFormat(format: string): boolean {
  return BLOCKED_FORMATS.includes(format.toLowerCase() as typeof BLOCKED_FORMATS[number]);
}

/**
 * Export design snapshot as PNG
 */
export async function exportAsPNG(
  elementId: string,
  fileName: string = "design-snapshot"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Export element not found");
  }

  // Create canvas from element
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2, // High resolution
    useCORS: true,
  });

  // Add disclaimer footer
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const footerHeight = 40;
    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height + footerHeight;
    
    const newCtx = newCanvas.getContext("2d");
    if (newCtx) {
      // Draw original content
      newCtx.drawImage(canvas, 0, 0);
      
      // Draw footer background
      newCtx.fillStyle = "#f5f5f5";
      newCtx.fillRect(0, canvas.height, newCanvas.width, footerHeight);
      
      // Draw disclaimer text
      newCtx.fillStyle = "#666666";
      newCtx.font = "12px Arial";
      newCtx.textAlign = "center";
      newCtx.fillText(DISCLAIMER_SHORT, newCanvas.width / 2, canvas.height + 25);
      
      // Download
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = newCanvas.toDataURL("image/png");
      link.click();
    }
  }
}

/**
 * Export design summary as PDF
 */
export async function exportAsPDF(options: ExportOptions): Promise<void> {
  const { variants, envelope, fileName = "design-summary" } = options;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("SiteIntel™ Design Summary", margin, y);
  y += 10;

  // Conceptual badge
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150);
  pdf.text("CONCEPTUAL DESIGN - NOT FOR CONSTRUCTION", margin, y);
  pdf.setTextColor(0);
  y += 15;

  // Envelope constraints section
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Regulatory Envelope", margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`FAR Cap: ${envelope.farCap}`, margin, y);
  y += 6;
  pdf.text(`Height Cap: ${envelope.heightCapFt}'`, margin, y);
  y += 6;
  pdf.text(`Coverage Cap: ${envelope.coverageCapPct}%`, margin, y);
  y += 15;

  // Variants section
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Design Variants", margin, y);
  y += 10;

  for (const variant of variants) {
    // Variant header
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${variant.name} (${variant.complianceStatus})`, margin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    if (variant.metrics) {
      pdf.text(`Height: ${variant.heightFt}' (${variant.floors} floors)`, margin + 5, y);
      y += 5;
      pdf.text(`GFA: ${variant.metrics.grossFloorAreaSf.toLocaleString()} SF`, margin + 5, y);
      y += 5;
      pdf.text(`FAR Used: ${variant.metrics.farUsedPct.toFixed(1)}%`, margin + 5, y);
      y += 5;
      pdf.text(`Coverage: ${variant.metrics.coveragePct.toFixed(1)}%`, margin + 5, y);
      y += 5;
      pdf.text(`Violations: ${variant.metrics.violationCount}`, margin + 5, y);
      y += 10;
    } else {
      pdf.text("No footprint defined", margin + 5, y);
      y += 10;
    }

    // Add page break if needed
    if (y > 250) {
      pdf.addPage();
      y = margin;
    }
  }

  // Footer disclaimer on every page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(
      DISCLAIMER_TEXT,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center", maxWidth: pageWidth - 40 }
    );
    
    // Page number
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  pdf.save(`${fileName}.pdf`);
}

/**
 * Export metrics comparison as CSV
 */
export function exportAsCSV(options: ExportOptions): void {
  const { variants, envelope, fileName = "design-metrics" } = options;

  const headers = [
    "Variant Name",
    "Compliance Status",
    "Height (ft)",
    "Floors",
    "GFA (SF)",
    "FAR Used (%)",
    "FAR Cap (%)",
    "Coverage (%)",
    "Coverage Cap (%)",
    "Envelope Utilization (%)",
    "Violations",
    "Preset Type",
  ];

  const rows = variants.map((variant) => [
    variant.name,
    variant.complianceStatus,
    variant.heightFt,
    variant.floors,
    variant.metrics?.grossFloorAreaSf || 0,
    variant.metrics?.farUsedPct?.toFixed(2) || 0,
    envelope.farCap,
    variant.metrics?.coveragePct?.toFixed(2) || 0,
    envelope.coverageCapPct,
    variant.metrics?.envelopeUtilizationPct?.toFixed(2) || 0,
    variant.metrics?.violationCount || 0,
    variant.presetType || "Custom",
  ]);

  // Add disclaimer row
  rows.push([]);
  rows.push([DISCLAIMER_SHORT]);
  rows.push([DISCLAIMER_TEXT]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
}

/**
 * Main export function - validates format and routes to appropriate handler
 */
export async function exportDesign(options: ExportOptions): Promise<void> {
  // Block forbidden formats
  if (isBlockedFormat(options.format)) {
    throw new Error(
      `Export format "${options.format}" is not available for conceptual designs. ` +
      "This tool produces conceptual designs only, not construction documents."
    );
  }

  switch (options.format) {
    case "pdf":
      await exportAsPDF(options);
      break;
    case "csv":
      exportAsCSV(options);
      break;
    case "png":
      // PNG requires element ID, handled separately
      throw new Error("Use exportAsPNG() for PNG exports with element reference");
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
