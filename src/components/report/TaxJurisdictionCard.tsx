import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Building2, Clock, TrendingUp, CheckCircle2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxJurisdictionCardProps {
  taxRateTotal?: number | null;
  taxableValue?: number | null;
  landVal?: number | null;
  imprvVal?: number | null;
  totApprVal?: number | null;
  totMarketVal?: number | null;
  taxingJurisdictions?: any[] | null;
  opportunityZone?: boolean | null;
  enterpriseZone?: boolean | null;
  foreignTradeZone?: boolean | null;
  averagePermitTimeMonths?: number | null;
  mudDistrict?: string | null;
  etjProvider?: string | null;
  wcidDistrict?: string | null;
  className?: string;
}

export function TaxJurisdictionCard({
  taxRateTotal,
  taxableValue,
  landVal,
  imprvVal,
  totApprVal,
  totMarketVal,
  taxingJurisdictions,
  opportunityZone,
  enterpriseZone,
  foreignTradeZone,
  averagePermitTimeMonths,
  mudDistrict,
  etjProvider,
  wcidDistrict,
  className
}: TaxJurisdictionCardProps) {
  const hasIncentives = opportunityZone || enterpriseZone || foreignTradeZone;
  const hasJurisdictions = taxingJurisdictions && Array.isArray(taxingJurisdictions) && taxingJurisdictions.length > 0;
  
  // Calculate estimated annual taxes
  const estimatedAnnualTax = taxRateTotal && taxableValue 
    ? (taxRateTotal / 100) * taxableValue 
    : null;

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-[hsl(var(--feasibility-orange))]",
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--feasibility-orange)/0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
              Tax & Incentives
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              CAD VERIFIED
            </Badge>
          </div>
          
          {/* Incentives Strip */}
          {hasIncentives && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {opportunityZone && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Opportunity Zone</span>
                </div>
              )}
              {enterpriseZone && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Enterprise Zone</span>
                </div>
              )}
              {foreignTradeZone && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Foreign Trade Zone</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Key Tax Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tax Rate */}
          {taxRateTotal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-[hsl(var(--feasibility-orange)/0.1)] to-transparent rounded-xl border border-[hsl(var(--feasibility-orange)/0.3)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
                <span className="text-sm text-muted-foreground">Combined Tax Rate</span>
              </div>
              <p className="text-3xl font-bold font-mono text-[hsl(var(--feasibility-orange))]">
                {taxRateTotal.toFixed(4)}%
              </p>
            </motion.div>
          )}

          {/* Taxable Value */}
          {taxableValue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Taxable Value</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                ${taxableValue.toLocaleString()}
              </p>
            </motion.div>
          )}

          {/* Estimated Annual Tax */}
          {estimatedAnnualTax && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Est. Annual Tax</span>
              </div>
              <p className="text-2xl font-bold font-mono">
                ${Math.round(estimatedAnnualTax).toLocaleString()}
              </p>
            </motion.div>
          )}
        </div>

        {/* Value Breakdown */}
        {(landVal || imprvVal || totApprVal || totMarketVal) && (
          <div className="p-4 bg-muted/20 rounded-xl border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Value Breakdown
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {landVal && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Land Value</p>
                  <p className="font-semibold font-mono">${landVal.toLocaleString()}</p>
                </div>
              )}
              {imprvVal && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Improvements</p>
                  <p className="font-semibold font-mono">${imprvVal.toLocaleString()}</p>
                </div>
              )}
              {totApprVal && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Total Appraised</p>
                  <p className="font-semibold font-mono">${totApprVal.toLocaleString()}</p>
                </div>
              )}
              {totMarketVal && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Market Value</p>
                  <p className="font-semibold font-mono">${totMarketVal.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Taxing Jurisdictions */}
        {hasJurisdictions && (
          <div className="p-4 bg-muted/20 rounded-xl border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Taxing Jurisdictions
            </h4>
            <div className="flex flex-wrap gap-2">
              {taxingJurisdictions.map((jurisdiction: any, i: number) => (
                <Badge key={i} variant="outline" className="font-mono text-xs">
                  {typeof jurisdiction === 'string' ? jurisdiction : jurisdiction.name || `Jurisdiction ${i + 1}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Special Districts & Permitting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Special Districts */}
          {(mudDistrict || etjProvider || wcidDistrict) && (
            <div className="p-4 bg-muted/20 rounded-xl border">
              <h4 className="font-semibold mb-3 text-sm">Special Districts</h4>
              <div className="space-y-2 text-sm">
                {mudDistrict && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MUD District:</span>
                    <span className="font-medium">{mudDistrict}</span>
                  </div>
                )}
                {etjProvider && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ETJ Provider:</span>
                    <span className="font-medium">{etjProvider}</span>
                  </div>
                )}
                {wcidDistrict && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WCID:</span>
                    <span className="font-medium">{wcidDistrict}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permitting Timeline */}
          {averagePermitTimeMonths && (
            <div className="p-4 bg-gradient-to-br from-[hsl(var(--data-cyan)/0.1)] to-transparent rounded-xl border border-[hsl(var(--data-cyan)/0.3)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
                <span className="text-sm text-muted-foreground">Avg Permit Timeline</span>
              </div>
              <p className="text-3xl font-bold font-mono text-[hsl(var(--data-cyan))]">
                {averagePermitTimeMonths} <span className="text-sm font-normal">months</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Based on jurisdiction data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
