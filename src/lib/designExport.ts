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
import type { DesignVariant, RegulatoryEnvelope, DesignMeasurementResult } from "@/stores/useDesignStore";
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

export interface MeasurementData {
  mode: "distance" | "area" | "height" | null;
  result: DesignMeasurementResult | null;
  points: [number, number][];
}

export interface ExportOptions {
  format: AllowedExportFormat;
  variants: DesignVariant[];
  envelope: RegulatoryEnvelope;
  includeMetrics?: boolean;
  includeCompliance?: boolean;
  includeMeasurements?: boolean;
  measurements?: MeasurementData;
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
 * Export design summary as PDF with measurements, variants, and compliance
 */
export async function exportAsPDF(options: ExportOptions): Promise<void> {
  const { 
    variants, 
    envelope, 
    measurements,
    includeMeasurements = true,
    fileName = "design-summary" 
  } = options;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Helper to check page break
  const checkPageBreak = (neededSpace: number = 30) => {
    if (y > 250 - neededSpace) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("SiteIntel™ Design Report", margin, y);
  y += 10;

  // Conceptual badge
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150);
  pdf.text("CONCEPTUAL DESIGN - NOT FOR CONSTRUCTION", margin, y);
  pdf.setTextColor(0);
  y += 8;

  // Date
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, y);
  y += 15;

  // Envelope constraints section
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Regulatory Envelope Constraints", margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  
  // Draw constraint table
  const constraintData = [
    ["Constraint", "Value", "Status"],
    ["FAR Cap", envelope.farCap.toString(), "—"],
    ["Height Cap", `${envelope.heightCapFt}'`, "—"],
    ["Coverage Cap", `${envelope.coverageCapPct}%`, "—"],
    ["Front Setback", `${envelope.setbacks.front}'`, "—"],
    ["Rear Setback", `${envelope.setbacks.rear}'`, "—"],
    ["Side Setbacks", `${envelope.setbacks.left}' / ${envelope.setbacks.right}'`, "—"],
  ];
  
  constraintData.forEach((row, idx) => {
    const isHeader = idx === 0;
    pdf.setFont("helvetica", isHeader ? "bold" : "normal");
    pdf.setFontSize(isHeader ? 10 : 9);
    pdf.text(row[0], margin, y);
    pdf.text(row[1], margin + 50, y);
    y += 5;
  });
  y += 10;

  // Measurements section (if available)
  if (includeMeasurements && measurements?.result) {
    checkPageBreak(40);
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Site Measurements", margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    if (measurements.mode === "distance" && measurements.result.feet !== undefined) {
      pdf.text(`Distance: ${measurements.result.feet.toFixed(2)} ft`, margin, y);
      y += 5;
      if (measurements.result.miles !== undefined) {
        pdf.text(`           (${measurements.result.miles.toFixed(4)} miles)`, margin, y);
        y += 5;
      }
    }
    
    if (measurements.mode === "area" && measurements.result.sqft !== undefined) {
      pdf.text(`Area: ${measurements.result.sqft.toLocaleString()} sq ft`, margin, y);
      y += 5;
      if (measurements.result.acres !== undefined) {
        pdf.text(`      (${measurements.result.acres.toFixed(3)} acres)`, margin, y);
        y += 5;
      }
    }
    
    if (measurements.mode === "height" && measurements.result.heightFt !== undefined) {
      pdf.text(`Height Difference: ${measurements.result.heightFt.toFixed(2)} ft`, margin, y);
      y += 5;
    }

    if (measurements.points.length > 0) {
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Measurement points: ${measurements.points.length}`, margin, y);
      pdf.setTextColor(0);
      y += 5;
    }
    y += 10;
  }

  // Variants section
  checkPageBreak(50);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Design Variants (${variants.length})`, margin, y);
  y += 10;

  for (const variant of variants) {
    checkPageBreak(45);
    
    // Variant header with status badge
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    
    const statusColor = variant.complianceStatus === "PASS" ? [34, 139, 34] : 
                        variant.complianceStatus === "WARN" ? [255, 165, 0] :
                        variant.complianceStatus === "FAIL" ? [220, 20, 60] : [128, 128, 128];
    
    pdf.text(variant.name, margin, y);
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(`[${variant.complianceStatus}]`, margin + 60, y);
    pdf.setTextColor(0);
    y += 7;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    if (variant.metrics) {
      // Two-column layout for metrics
      const col1X = margin + 5;
      const col2X = margin + 80;
      
      pdf.text(`Height: ${variant.heightFt}' (${variant.floors} floors)`, col1X, y);
      pdf.text(`GFA: ${variant.metrics.grossFloorAreaSf.toLocaleString()} SF`, col2X, y);
      y += 5;
      
      pdf.text(`FAR Used: ${variant.metrics.farUsedPct.toFixed(1)}%`, col1X, y);
      pdf.text(`Coverage: ${variant.metrics.coveragePct.toFixed(1)}%`, col2X, y);
      y += 5;
      
      pdf.text(`Envelope Util: ${variant.metrics.envelopeUtilizationPct?.toFixed(1) || "—"}%`, col1X, y);
      pdf.text(`Violations: ${variant.metrics.violationCount}`, col2X, y);
      y += 5;

      // Compliance details if available
      if (variant.complianceResult) {
        const violations = variant.complianceResult.violations || [];
        if (Array.isArray(violations) && violations.length > 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(220, 20, 60);
          const violationText = violations.map((v: unknown) => 
            typeof v === 'object' && v !== null && 'rule' in v ? (v as { rule: string }).rule : String(v)
          ).join(", ");
          pdf.text(`Violations: ${violationText}`, col1X, y);
          pdf.setTextColor(0);
          y += 5;
        }
      }
    } else {
      pdf.text("No footprint defined", margin + 5, y);
      y += 5;
    }

    if (variant.notes) {
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Notes: ${variant.notes.substring(0, 80)}${variant.notes.length > 80 ? "..." : ""}`, margin + 5, y);
      pdf.setTextColor(0);
      y += 5;
    }

    y += 8;
  }

  // Compliance Summary section
  checkPageBreak(40);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Compliance Summary", margin, y);
  y += 8;

  const passCount = variants.filter(v => v.complianceStatus === "PASS").length;
  const warnCount = variants.filter(v => v.complianceStatus === "WARN").length;
  const failCount = variants.filter(v => v.complianceStatus === "FAIL").length;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  
  pdf.setTextColor(34, 139, 34);
  pdf.text(`✓ Passing: ${passCount}`, margin, y);
  pdf.setTextColor(255, 165, 0);
  pdf.text(`⚠ Warnings: ${warnCount}`, margin + 50, y);
  pdf.setTextColor(220, 20, 60);
  pdf.text(`✗ Failing: ${failCount}`, margin + 100, y);
  pdf.setTextColor(0);
  y += 15;

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
