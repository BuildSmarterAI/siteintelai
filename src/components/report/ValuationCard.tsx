import { motion } from "framer-motion";
import { DollarSign, Building2, Calendar, Layers, TrendingUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface ValuationCardProps {
  totApprVal?: number | null;
  totMarketVal?: number | null;
  landVal?: number | null;
  imprvVal?: number | null;
  taxableValue?: number | null;
  bldgSqft?: number | null;
  yearBuilt?: number | null;
  effectiveYr?: number | null;
  numStories?: number | null;
  stateClass?: string | null;
  propType?: string | null;
  landUseCode?: string | null;
  className?: string;
}

export function ValuationCard({
  totApprVal,
  totMarketVal,
  landVal,
  imprvVal,
  taxableValue,
  bldgSqft,
  yearBuilt,
  effectiveYr,
  numStories,
  stateClass,
  propType,
  landUseCode,
  className,
}: ValuationCardProps) {
  // Calculate $/SF if we have values
  const pricePerSqft = totMarketVal && bldgSqft ? Math.round(totMarketVal / bldgSqft) : null;

  // Pie chart data for Land vs Improvements
  const valuationData = [];
  if (landVal) valuationData.push({ name: "Land Value", value: landVal, color: "hsl(var(--data-cyan))" });
  if (imprvVal) valuationData.push({ name: "Improvements", value: imprvVal, color: "hsl(var(--feasibility-orange))" });

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  const totalValue = (landVal || 0) + (imprvVal || 0);

  return (
    <Card className={cn("glass-card border-l-4 border-l-[hsl(var(--feasibility-orange))] overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.03)] to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[hsl(var(--feasibility-orange))]" />
            Property Valuation & Building Characteristics
          </CardTitle>
          {propType && (
            <Badge variant="outline" className="font-mono">{propType}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Valuation Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Value Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {totMarketVal && (
              <div className="p-4 bg-gradient-to-br from-[hsl(var(--feasibility-orange)/0.1)] to-transparent rounded-lg border border-[hsl(var(--feasibility-orange)/0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Market Value</p>
                </div>
                <p className="text-3xl font-bold font-mono text-[hsl(var(--feasibility-orange))]">
                  {formatCurrency(totMarketVal)}
                </p>
              </div>
            )}

            {totApprVal && (
              <div className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Appraised Value</p>
                    <p className="text-xl font-bold font-mono">{formatCurrency(totApprVal)}</p>
                  </div>
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {taxableValue && (
              <div className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Taxable Value</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(taxableValue)}</p>
              </div>
            )}
          </motion.div>

          {/* Pie Chart */}
          {valuationData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Value Breakdown</p>
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={valuationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {valuationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-mono font-bold text-sm">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-2">
                {landVal && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--data-cyan))]" />
                    <span className="text-xs text-muted-foreground">Land ({Math.round((landVal / totalValue) * 100)}%)</span>
                  </div>
                )}
                {imprvVal && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--feasibility-orange))]" />
                    <span className="text-xs text-muted-foreground">Improvements ({Math.round((imprvVal / totalValue) * 100)}%)</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Building Characteristics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          {bldgSqft && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border text-center"
            >
              <Building2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold font-mono">{bldgSqft.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">SF</p>
            </motion.div>
          )}

          {yearBuilt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border text-center"
            >
              <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold font-mono">{yearBuilt}</p>
              <p className="text-xs text-muted-foreground">Year Built</p>
            </motion.div>
          )}

          {numStories && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border text-center"
            >
              <Layers className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold font-mono">{numStories}</p>
              <p className="text-xs text-muted-foreground">Stories</p>
            </motion.div>
          )}

          {pricePerSqft && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-3 bg-gradient-to-br from-[hsl(var(--status-success)/0.1)] to-transparent rounded-lg border border-[hsl(var(--status-success)/0.3)] text-center"
            >
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-[hsl(var(--status-success))]" />
              <p className="text-2xl font-bold font-mono text-[hsl(var(--status-success))]">${pricePerSqft}</p>
              <p className="text-xs text-muted-foreground">per SF</p>
            </motion.div>
          )}
        </div>

        {/* Additional Details */}
        {(stateClass || landUseCode || effectiveYr) && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {stateClass && (
              <Badge variant="outline" className="font-mono">
                Class: {stateClass}
              </Badge>
            )}
            {landUseCode && (
              <Badge variant="outline" className="font-mono">
                Use Code: {landUseCode}
              </Badge>
            )}
            {effectiveYr && (
              <Badge variant="outline">
                Effective Year: {effectiveYr}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
