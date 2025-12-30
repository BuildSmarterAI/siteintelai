/**
 * Traffic Volume Chart
 * Horizontal bar chart comparing site AADT to regional benchmarks
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

interface TrafficVolumeChartProps {
  siteAadt: number;
  countyAverage?: number;
  stateAverage?: number;
}

export function TrafficVolumeChart({ 
  siteAadt, 
  countyAverage = 15000, 
  stateAverage = 12000 
}: TrafficVolumeChartProps) {
  const data = [
    { name: "This Site", value: siteAadt, fill: "hsl(var(--accent))" },
    { name: "County Avg", value: countyAverage, fill: "hsl(var(--muted-foreground))" },
    { name: "State Avg", value: stateAverage, fill: "hsl(var(--muted-foreground) / 0.6)" },
  ];

  const maxValue = Math.max(siteAadt, countyAverage, stateAverage);
  const sitePercentage = ((siteAadt / countyAverage) * 100 - 100).toFixed(0);
  const isAboveAverage = siteAadt > countyAverage;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Traffic Volume Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, maxValue * 1.1]}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString() + " VPD", "Traffic"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {isAboveAverage ? (
            <span className="text-accent font-medium">+{sitePercentage}%</span>
          ) : (
            <span className="text-muted-foreground">{sitePercentage}%</span>
          )}{" "}
          vs county average
        </p>
      </CardContent>
    </Card>
  );
}
