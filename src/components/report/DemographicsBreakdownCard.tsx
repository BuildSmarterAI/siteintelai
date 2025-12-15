import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface DemographicsBreakdownCardProps {
  under18Pct?: number | null;
  workingAgePct?: number | null;
  over65Pct?: number | null;
  whitePct?: number | null;
  blackPct?: number | null;
  asianPct?: number | null;
  hispanicPct?: number | null;
}

const AGE_COLORS = ["hsl(var(--data-cyan))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"];
const ETHNICITY_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export function DemographicsBreakdownCard({
  under18Pct,
  workingAgePct,
  over65Pct,
  whitePct,
  blackPct,
  asianPct,
  hispanicPct,
}: DemographicsBreakdownCardProps) {
  const ageData = [
    { name: "Under 18", value: under18Pct ?? 0 },
    { name: "Working Age", value: workingAgePct ?? 0 },
    { name: "Over 65", value: over65Pct ?? 0 },
  ].filter(d => d.value > 0);

  const ethnicityData = [
    { name: "White", value: whitePct ?? 0 },
    { name: "Black", value: blackPct ?? 0 },
    { name: "Asian", value: asianPct ?? 0 },
    { name: "Hispanic", value: hispanicPct ?? 0 },
  ].filter(d => d.value > 0);

  const hasAgeData = ageData.length > 0;
  const hasEthnicityData = ethnicityData.length > 0;

  if (!hasAgeData && !hasEthnicityData) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Demographics Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasAgeData && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Age Distribution</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      labelLine={false}
                    >
                      {ageData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {ageData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: AGE_COLORS[index] }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasEthnicityData && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Race & Ethnicity</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ethnicityData} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {ethnicityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ETHNICITY_COLORS[index % ETHNICITY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
