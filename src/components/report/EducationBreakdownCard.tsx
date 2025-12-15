import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface EducationBreakdownCardProps {
  highSchoolOnlyPct?: number | null;
  someCollegePct?: number | null;
  bachelorsPct?: number | null;
  graduateDegreePct?: number | null;
  collegeAttainmentPct?: number | null;
}

const COLORS = ["#94A3B8", "#60A5FA", "#34D399", "#A78BFA"];

export function EducationBreakdownCard({
  highSchoolOnlyPct,
  someCollegePct,
  bachelorsPct,
  graduateDegreePct,
  collegeAttainmentPct,
}: EducationBreakdownCardProps) {
  const educationData = [
    { name: "High School", value: highSchoolOnlyPct ?? 0, shortName: "HS" },
    { name: "Some College", value: someCollegePct ?? 0, shortName: "Some" },
    { name: "Bachelor's", value: bachelorsPct ?? 0, shortName: "BA/BS" },
    { name: "Graduate", value: graduateDegreePct ?? 0, shortName: "Grad" },
  ].filter(d => d.value > 0);

  const hasData = educationData.length > 0 || collegeAttainmentPct != null;

  if (!hasData) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          Education Attainment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {educationData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Education Levels</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={educationData} margin={{ left: 0, right: 10 }}>
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 'auto']} 
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {educationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {collegeAttainmentPct != null && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Total College Attainment</p>
                <p className="text-3xl font-bold text-primary">{collegeAttainmentPct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Bachelor's degree or higher</p>
              </div>
            )}

            <div className="space-y-2">
              {educationData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
