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
} from "lucide-react";
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

const StatusBadge = ({ status, label }: { status: ValidationStatus; label: string }) => {
  const variants: Record<ValidationStatus, string> = {
    success: 'bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)]',
    warning: 'bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)]',
    error: 'bg-[hsl(var(--status-error)/0.1)] text-[hsl(var(--status-error))] border-[hsl(var(--status-error)/0.3)]',
    pending: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge variant="outline" className={`text-xs ${variants[status]}`}>
      <StatusIcon status={status} />
      <span className="ml-1">{label}</span>
    </Badge>
  );
};

export function ParcelValidationCards({
  candidate,
  validations,
  assumptions,
}: ParcelValidationCardsProps) {
  const validationItems = [
    { key: 'geometryIntegrity', label: 'Geometry Integrity', icon: ShieldCheck, result: validations.geometryIntegrity },
    { key: 'addressMatch', label: 'Address Match', icon: Target, result: validations.addressMatch },
    { key: 'countyAlignment', label: 'County Data', icon: Building2, result: validations.countyAlignment },
    { key: 'parcelUniqueness', label: 'Parcel Uniqueness', icon: Hash, result: validations.parcelUniqueness },
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
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  CAD/APN
                </span>
                <p className="font-mono tabular-nums text-foreground text-sm">
                  {candidate.parcel_id}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  County
                </span>
                <p className="text-foreground text-sm">{candidate.county}</p>
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
          {validationItems.map(({ key, label, icon: Icon, result }) => (
            <div 
              key={key}
              className="flex items-start gap-3 p-2 rounded-md bg-muted/30"
            >
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <StatusBadge 
                    status={result.status} 
                    label={result.status === 'success' ? 'Pass' : result.status === 'pending' ? 'Checking' : result.status}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{result.message}</p>
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
