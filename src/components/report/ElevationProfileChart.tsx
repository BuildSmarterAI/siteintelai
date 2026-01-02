import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ElevationPoint {
  distance_ft: number;
  elevation_ft: number;
}

interface ElevationProfileChartProps {
  data: ElevationPoint[];
  baseFloodElevation?: number | null;
  minElevation?: number;
  maxElevation?: number;
  isLoading?: boolean;
  className?: string;
}

export function ElevationProfileChart({
  data,
  baseFloodElevation,
  minElevation,
  maxElevation,
  isLoading,
  className
}: ElevationProfileChartProps) {
  // Calculate Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (!data.length) return [0, 100];
    
    const elevations = data.map(d => d.elevation_ft);
    const allValues = [...elevations];
    if (baseFloodElevation) allValues.push(baseFloodElevation);
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 5;
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data, baseFloodElevation]);

  // Format distance for X-axis
  const formatDistance = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const point = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium">
          Elevation: <span className="text-primary font-mono">{point.elevation_ft.toFixed(1)} ft</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Distance: {point.distance_ft.toLocaleString()} ft
        </p>
        {baseFloodElevation && (
          <p className={cn(
            "text-xs mt-1",
            point.elevation_ft >= baseFloodElevation ? "text-green-600" : "text-red-600"
          )}>
            {point.elevation_ft >= baseFloodElevation 
              ? `+${(point.elevation_ft - baseFloodElevation).toFixed(1)} ft above BFE`
              : `${(point.elevation_ft - baseFloodElevation).toFixed(1)} ft below BFE`
            }
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("w-full h-[200px]", className)}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn("w-full h-[200px] flex items-center justify-center bg-muted/30 rounded-lg", className)}>
        <p className="text-sm text-muted-foreground">No elevation data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--data-cyan))" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(var(--data-cyan))" stopOpacity={0.05} />
            </linearGradient>
            {baseFloodElevation && (
              <linearGradient id="belowBfeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
              </linearGradient>
            )}
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
          />
          
          <XAxis
            dataKey="distance_ft"
            tickFormatter={formatDistance}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(v) => `${v}′`}
            width={45}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* BFE Reference Line */}
          {baseFloodElevation && (
            <ReferenceLine
              y={baseFloodElevation}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `BFE: ${baseFloodElevation}′`,
                position: 'right',
                fill: 'hsl(var(--destructive))',
                fontSize: 11,
                fontWeight: 600
              }}
            />
          )}
          
          {/* Elevation Area */}
          <Area
            type="monotone"
            dataKey="elevation_ft"
            stroke="hsl(var(--data-cyan))"
            strokeWidth={2}
            fill="url(#elevationGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: 'hsl(var(--data-cyan))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
