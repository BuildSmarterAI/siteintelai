import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Car, Bus, Bike, Home, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface WorkforceCommuteCardProps {
  whiteCollarPct?: number | null;
  blueCollarPct?: number | null;
  serviceSectorPct?: number | null;
  workFromHomePct?: number | null;
  meanCommuteTimeMin?: number | null;
  driveAlonePct?: number | null;
  publicTransitPct?: number | null;
  walkBikePct?: number | null;
}

const SECTOR_COLORS = ["#3B82F6", "#F97316", "#8B5CF6", "#22C55E"];

export function WorkforceCommuteCard({
  whiteCollarPct,
  blueCollarPct,
  serviceSectorPct,
  workFromHomePct,
  meanCommuteTimeMin,
  driveAlonePct,
  publicTransitPct,
  walkBikePct,
}: WorkforceCommuteCardProps) {
  const sectorData = [
    { name: "White Collar", value: whiteCollarPct ?? 0 },
    { name: "Blue Collar", value: blueCollarPct ?? 0 },
    { name: "Service Sector", value: serviceSectorPct ?? 0 },
    { name: "Work From Home", value: workFromHomePct ?? 0 },
  ].filter(d => d.value > 0);

  const hasSectorData = sectorData.length > 0;
  const hasCommuteData = meanCommuteTimeMin != null || driveAlonePct != null || publicTransitPct != null || walkBikePct != null;

  if (!hasSectorData && !hasCommuteData) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5 text-primary" />
          Workforce & Commute
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasSectorData && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Employment Sectors</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sectorData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sectorData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: SECTOR_COLORS[index] }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                    <span className="font-medium ml-auto">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCommuteData && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Commute Patterns</h4>
              
              {meanCommuteTimeMin != null && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Mean Commute Time</span>
                  </div>
                  <p className="text-2xl font-bold">{meanCommuteTimeMin.toFixed(0)} min</p>
                </div>
              )}
              
              <div className="space-y-2">
                {driveAlonePct != null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Drive Alone</span>
                    </div>
                    <span className="font-medium">{driveAlonePct.toFixed(1)}%</span>
                  </div>
                )}
                
                {publicTransitPct != null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Public Transit</span>
                    </div>
                    <span className="font-medium">{publicTransitPct.toFixed(1)}%</span>
                  </div>
                )}
                
                {walkBikePct != null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Walk/Bike</span>
                    </div>
                    <span className="font-medium">{walkBikePct.toFixed(1)}%</span>
                  </div>
                )}
                
                {workFromHomePct != null && !hasSectorData && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Work From Home</span>
                    </div>
                    <span className="font-medium">{workFromHomePct.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
