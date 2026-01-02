/**
 * SiteIntel™ Design Mode - Compare Mode
 * 
 * Side-by-side comparison of design variants with synchronized views.
 * Per PRD: Max 4 variants, metrics comparison, compliance status.
 */

import { useMemo } from "react";
import { useDesignStore, type DesignVariant } from "@/stores/useDesignStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Columns2
} from "lucide-react";

interface CompareModeProps {
  className?: string;
}

export function CompareMode({ className }: CompareModeProps) {
  const {
    variants,
    compareVariantIds,
    toggleCompareVariant,
    clearCompareSelection,
    envelope,
  } = useDesignStore();

  // Get selected variants for comparison
  const selectedVariants = useMemo(() => 
    variants.filter(v => compareVariantIds.includes(v.id)),
    [variants, compareVariantIds]
  );

  // Comparison metrics rows
  const metricsRows = useMemo(() => {
    if (selectedVariants.length === 0) return [];

    return [
      {
        label: "Gross Floor Area",
        key: "grossFloorAreaSf",
        unit: "SF",
        format: (v: number) => v?.toLocaleString() ?? "-",
      },
      {
        label: "FAR Used",
        key: "farUsedPct",
        unit: "%",
        format: (v: number) => v?.toFixed(1) ?? "-",
        compare: (v: number) => {
          return v > 100 ? "exceed" : v > 90 ? "warn" : "ok";
        },
      },
      {
        label: "Coverage",
        key: "coveragePct",
        unit: "%",
        format: (v: number) => v?.toFixed(1) ?? "-",
        compare: (v: number) => {
          const cap = envelope?.coverageCapPct || 100;
          return v > cap ? "exceed" : v > cap * 0.9 ? "warn" : "ok";
        },
      },
      {
        label: "Height",
        key: "heightUsedPct",
        unit: "%",
        format: (v: number) => v?.toFixed(1) ?? "-",
        compare: (v: number) => {
          return v > 100 ? "exceed" : v > 90 ? "warn" : "ok";
        },
      },
      {
        label: "Envelope Utilization",
        key: "envelopeUtilizationPct",
        unit: "%",
        format: (v: number) => v?.toFixed(1) ?? "-",
      },
      {
        label: "Violations",
        key: "violationCount",
        unit: "",
        format: (v: number) => v?.toString() ?? "0",
        compare: (v: number) => v > 0 ? "exceed" : "ok",
      },
    ];
  }, [selectedVariants, envelope]);

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "WARN":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getComparisonClass = (comparison?: string) => {
    switch (comparison) {
      case "exceed":
        return "text-red-600 font-medium";
      case "warn":
        return "text-amber-600";
      default:
        return "";
    }
  };

  if (variants.length < 2) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-4 max-w-md">
          <Columns2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Compare Design Variants</h3>
          <p className="text-muted-foreground">
            Create at least 2 design variants to use comparison mode.
            Each variant can have different footprints, heights, and configurations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Selection header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Select Variants to Compare</h3>
            <p className="text-sm text-muted-foreground">
              Choose up to 4 variants for side-by-side comparison
            </p>
          </div>
          {compareVariantIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCompareSelection}>
              Clear Selection
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => {
            const isSelected = compareVariantIds.includes(variant.id);
            const isDisabled = !isSelected && compareVariantIds.length >= 4;

            return (
              <button
                key={variant.id}
                onClick={() => !isDisabled && toggleCompareVariant(variant.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox checked={isSelected} />
                <span className="font-medium">{variant.name}</span>
                {getComplianceIcon(variant.complianceStatus)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selectedVariants.length >= 2 ? (
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Metric</TableHead>
                  {selectedVariants.map((variant) => (
                    <TableHead key={variant.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {variant.name}
                        {getComplianceIcon(variant.complianceStatus)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Compliance status row */}
                <TableRow>
                  <TableCell className="font-medium">Compliance Status</TableCell>
                  {selectedVariants.map((variant) => (
                    <TableCell key={variant.id} className="text-center">
                      <Badge
                        variant={
                          variant.complianceStatus === "PASS"
                            ? "default"
                            : variant.complianceStatus === "WARN"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {variant.complianceStatus}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Height row */}
                <TableRow>
                  <TableCell className="font-medium">Building Height</TableCell>
                  {selectedVariants.map((variant) => (
                    <TableCell key={variant.id} className="text-center">
                      {variant.heightFt}' ({variant.floors} floors)
                    </TableCell>
                  ))}
                </TableRow>

                {/* Metrics rows */}
                {metricsRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {selectedVariants.map((variant) => {
                      const value = variant.metrics?.[row.key as keyof typeof variant.metrics];
                      const comparison = row.compare?.(value as number);
                      
                      return (
                        <TableCell 
                          key={variant.id} 
                          className={cn("text-center", getComparisonClass(comparison))}
                        >
                          {row.format(value as number)}{row.unit && ` ${row.unit}`}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Preset type row */}
                <TableRow>
                  <TableCell className="font-medium">Preset Type</TableCell>
                  {selectedVariants.map((variant) => (
                    <TableCell key={variant.id} className="text-center">
                      {variant.presetType || "Custom"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>

            {/* Recommendation */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Quick Analysis
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {selectedVariants.some(v => v.complianceStatus === "FAIL") && (
                  <li>
                    ⚠️ Some variants exceed regulatory constraints and require adjustment
                  </li>
                )}
                {selectedVariants.every(v => v.complianceStatus === "PASS") && (
                  <li>
                    ✓ All selected variants are within regulatory envelope
                  </li>
                )}
                {selectedVariants.length > 0 && (() => {
                  const maxGFA = Math.max(
                    ...selectedVariants.map(v => v.metrics?.grossFloorAreaSf || 0)
                  );
                  const bestVariant = selectedVariants.find(
                    v => v.metrics?.grossFloorAreaSf === maxGFA && v.complianceStatus === "PASS"
                  );
                  if (bestVariant) {
                    return (
                      <li>
                        📊 "{bestVariant.name}" offers highest compliant GFA ({maxGFA.toLocaleString()} SF)
                      </li>
                    );
                  }
                  return null;
                })()}
              </ul>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select at least 2 variants to compare
        </div>
      )}
    </div>
  );
}
