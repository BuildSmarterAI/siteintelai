/**
 * Parcel Validation Cards
 * Phase 3 of Parcel Selection: Validation before commitment.
 * Shows identity card + validation checks with status badges.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Ruler, 
  Hash,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ShieldCheck,
  Target,
  Building2,
  Loader2,
  User,
} from "lucide-react";
import { useMemo } from "react";
import type { CandidateParcel } from "@/types/parcelSelection";

type ValidationStatus = 'success' | 'warning' | 'error' | 'pending';

interface ValidationResult {
  status: ValidationStatus;
  message: string;
  detail?: string;
}

interface ParcelValidationCardsProps {
  candidate: CandidateParcel;
  validations: {
    geometryIntegrity: ValidationResult;
    addressMatch: ValidationResult;
    countyAlignment: ValidationResult;
    parcelUniqueness: ValidationResult;
  };
  assumptions: string[];
  onAcknowledgeWarning?: (key: string) => void;
  acknowledgedWarnings?: string[];
}

const StatusIcon = ({ status }: { status: ValidationStatus }) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-success))]" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-[hsl(var(--status-error))]" />;
    case 'pending':
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
  }
};

const StatusBadge = ({ status }: { status: ValidationStatus }) => {
  // Simplified: just show status icon, no text label for cleaner UX
  return (
    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
      status === 'success' ? 'bg-[hsl(var(--status-success)/0.1)]' :
      status === 'warning' ? 'bg-[hsl(var(--status-warning)/0.1)]' :
      status === 'error' ? 'bg-[hsl(var(--status-error)/0.1)]' :
      'bg-muted'
    }`}>
      <StatusIcon status={status} />
    </div>
  );
};

export function ParcelValidationCards({
  candidate,
  validations,
  assumptions,
}: ParcelValidationCardsProps) {
  // County-specific CAD label
  const cadLabel = useMemo(() => {
    const labels: Record<string, string> = {
      harris: 'HCAD Account #',
      'fort bend': 'FBCAD Prop #',
      montgomery: 'MCAD Prop #',
    };
    return labels[candidate.county?.toLowerCase()] || 'Parcel ID';
  }, [candidate.county]);

  // Trust signal labels (user-facing) instead of technical labels
  const validationItems = [
    { 
      key: 'geometryIntegrity', 
      label: 'Boundary Verified', 
      icon: ShieldCheck, 
      result: validations.geometryIntegrity,
      successMessage: `Official ${candidate.county} CAD geometry`
    },
    { 
      key: 'addressMatch', 
      label: 'Address Confirmed', 
      icon: Target, 
      result: validations.addressMatch,
      successMessage: 'Matches county property records'
    },
    { 
      key: 'countyAlignment', 
      label: 'Data Source Validated', 
      icon: Building2, 
      result: validations.countyAlignment,
      successMessage: `${candidate.county} Appraisal District`
    },
    { 
      key: 'parcelUniqueness', 
      label: 'Exact Match Confirmed', 
      icon: Hash, 
      result: validations.parcelUniqueness,
      successMessage: 'Single parcel found for this address'
    },
  ];

  const hasErrors = Object.values(validations).some(v => v.status === 'error');
  const hasWarnings = Object.values(validations).some(v => v.status === 'warning');

  return (
    <div className="space-y-4">
      {/* Parcel Identity Card - Neutral, no CTA */}
      <Card className="border-border/50 bg-background/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">
            Selected Parcel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[hsl(var(--data-cyan))] mt-0.5 shrink-0" />
            <p className="text-base font-heading font-semibold text-foreground leading-tight">
              {candidate.situs_address || 'No address on file'}
            </p>
          </div>

          {/* Key-value grid */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {cadLabel}
                </span>
                <p className="font-mono tabular-nums text-foreground text-sm">
                  {candidate.parcel_id}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  County
                </span>
                <p className="text-foreground text-sm">
                  {candidate.county.charAt(0).toUpperCase() + candidate.county.slice(1).toLowerCase()} County
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Last sync: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            {candidate.acreage && (
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Acreage
                </span>
                <p className="flex items-center gap-1 font-mono tabular-nums text-foreground text-sm">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  {candidate.acreage.toFixed(2)} ac
                </p>
              </div>
            )}

            {candidate.centroid && (
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Centroid
                </span>
                <p className="font-mono tabular-nums text-foreground text-xs">
                  {candidate.centroid.lat.toFixed(6)}°, {candidate.centroid.lng.toFixed(6)}°
                </p>
              </div>
            )}

            {candidate.owner_name && (
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Owner of Record
                </span>
                <p className="flex items-center gap-1.5 text-foreground text-sm">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">{candidate.owner_name}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Blocks */}
      <Card className="border-border/50 bg-background/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Validation Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {validationItems.map(({ key, label, icon: Icon, result, successMessage }) => (
            <div 
              key={key}
              className={`flex items-start gap-3 p-2.5 rounded-md ${
                result.status === 'success' 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20' 
                  : 'bg-muted/30'
              }`}
            >
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <StatusBadge status={result.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.status === 'success' ? successMessage : result.message}
                </p>
                {result.detail && result.status !== 'success' && (
                  <p className="text-xs text-muted-foreground/70 italic">{result.detail}</p>
                )}
              </div>
            </div>
          ))}

          {/* Summary badge */}
          <div className="pt-2 border-t border-border/50">
            {hasErrors ? (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-error))]">
                <XCircle className="h-4 w-4" />
                <span>Cannot proceed - resolve errors above</span>
              </div>
            ) : hasWarnings ? (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-warning))]">
                <AlertTriangle className="h-4 w-4" />
                <span>Review warnings before continuing</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-success))]">
                <CheckCircle2 className="h-4 w-4" />
                <span>All checks passed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Panel - Non-dismissible info alert */}
      {assumptions.length > 0 && (
        <Alert className="bg-[hsl(var(--status-info)/0.05)] border-[hsl(var(--status-info)/0.2)]">
          <Info className="h-4 w-4 text-[hsl(var(--status-info))]" />
          <AlertDescription className="text-xs space-y-1">
            <span className="font-medium">Assumptions applied:</span>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {assumptions.map((assumption, i) => (
                <li key={i}>{assumption}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
