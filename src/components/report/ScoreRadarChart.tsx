import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { cn } from "@/lib/utils";

interface ScoreRadarChartProps {
  zoningScore: number;
  floodScore: number;
  utilitiesScore: number;
  trafficScore: number;
  environmentalScore: number;
  className?: string;
}

export function ScoreRadarChart({
  zoningScore,
  floodScore,
  utilitiesScore,
  trafficScore,
  environmentalScore,
  className
}: ScoreRadarChartProps) {
  const data = [
    { subject: 'Zoning', score: zoningScore, fullMark: 100 },
    { subject: 'Flood', score: floodScore, fullMark: 100 },
    { subject: 'Utilities', score: utilitiesScore, fullMark: 100 },
    { subject: 'Traffic', score: trafficScore, fullMark: 100 },
    { subject: 'Environment', score: environmentalScore, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].payload.subject;
      
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">{name}</p>
          <p className={cn(
            "text-lg font-bold",
            value >= 80 ? "text-green-600" :
            value >= 60 ? "text-amber-600" :
            value >= 40 ? "text-orange-600" : "text-red-600"
          )}>
            {value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: "hsl(var(--muted-foreground))", 
              fontSize: 11,
              fontWeight: 500
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ 
              fill: "hsl(var(--primary))", 
              strokeWidth: 0,
              r: 4
            }}
            activeDot={{
              fill: "hsl(var(--primary))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
              r: 6
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
