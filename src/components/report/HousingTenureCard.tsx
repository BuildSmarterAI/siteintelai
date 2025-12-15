import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Building2, Calendar, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface HousingTenureCardProps {
  ownerOccupiedPct?: number | null;
  renterOccupiedPct?: number | null;
  totalHousingUnits?: number | null;
  populationBlockGroup?: number | null;
  singleFamilyPct?: number | null;
  multiFamilyPct?: number | null;
  medianYearBuilt?: number | null;
  avgHouseholdSize?: number | null;
}

const TENURE_COLORS = ["hsl(var(--primary))", "hsl(var(--data-cyan))"];
const STRUCTURE_COLORS = ["#22C55E", "#8B5CF6"];

export function HousingTenureCard({
  ownerOccupiedPct,
  renterOccupiedPct,
  totalHousingUnits,
  populationBlockGroup,
  singleFamilyPct,
  multiFamilyPct,
  medianYearBuilt,
  avgHouseholdSize,
}: HousingTenureCardProps) {
  const tenureData = [
    { name: "Owner Occupied", value: ownerOccupiedPct ?? 0 },
    { name: "Renter Occupied", value: renterOccupiedPct ?? 0 },
  ].filter(d => d.value > 0);

  const structureData = [
    { name: "Single Family", value: singleFamilyPct ?? 0 },
    { name: "Multi Family", value: multiFamilyPct ?? 0 },
  ].filter(d => d.value > 0);

  const hasTenureData = tenureData.length > 0;
  const hasStructureData = structureData.length > 0;
  
  // Check if ANY data exists
  const hasAnyData = ownerOccupiedPct != null || renterOccupiedPct != null ||
    singleFamilyPct != null || multiFamilyPct != null ||
    totalHousingUnits != null || populationBlockGroup != null || 
    medianYearBuilt != null || avgHouseholdSize != null;

  if (!hasAnyData) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Home className="h-5 w-5 text-primary" />
          Housing & Tenure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ownership */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Ownership</h4>
            {hasTenureData && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tenureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tenureData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={TENURE_COLORS[index % TENURE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TENURE_COLORS[0] }} />
                  <span className="text-muted-foreground">Owner Occupied</span>
                </div>
                <span className="font-medium">
                  {ownerOccupiedPct != null ? `${ownerOccupiedPct.toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TENURE_COLORS[1] }} />
                  <span className="text-muted-foreground">Renter Occupied</span>
                </div>
                <span className="font-medium">
                  {renterOccupiedPct != null ? `${renterOccupiedPct.toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Structure Type */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Structure Type</h4>
            {hasStructureData && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={structureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {structureData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STRUCTURE_COLORS[index % STRUCTURE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STRUCTURE_COLORS[0] }} />
                  <span className="text-muted-foreground">Single Family</span>
                </div>
                <span className="font-medium">
                  {singleFamilyPct != null ? `${singleFamilyPct.toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STRUCTURE_COLORS[1] }} />
                  <span className="text-muted-foreground">Multi Family</span>
                </div>
                <span className="font-medium">
                  {multiFamilyPct != null ? `${multiFamilyPct.toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Housing Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Housing Stats</h4>
            
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Units</span>
              </div>
              <span className="font-semibold">
                {totalHousingUnits != null ? totalHousingUnits.toLocaleString() : "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Block Group Pop.</span>
              </div>
              <span className="font-semibold">
                {populationBlockGroup != null ? populationBlockGroup.toLocaleString() : "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Avg Household Size</span>
              <span className="font-semibold">
                {avgHouseholdSize != null ? avgHouseholdSize.toFixed(2) : "—"}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Median Year Built</span>
              </div>
              <span className="font-semibold">
                {medianYearBuilt != null ? medianYearBuilt : "—"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}