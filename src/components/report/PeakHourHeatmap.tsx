/**
 * Peak Hour Heatmap
 * Time-based visualization of traffic congestion patterns
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface PeakHourHeatmapProps {
  peakHourVolume?: number;
  aadt?: number;
  congestionLevel?: string;
}

export function PeakHourHeatmap({ 
  peakHourVolume, 
  aadt = 10000,
  congestionLevel = "moderate" 
}: PeakHourHeatmapProps) {
  // Generate hourly pattern based on typical traffic distribution
  const hourlyData = useMemo(() => {
    // Typical traffic distribution percentages by hour (6 AM to 10 PM)
    const pattern = [
      { hour: 6, label: "6AM", factor: 0.4 },
      { hour: 7, label: "7AM", factor: 0.7 },
      { hour: 8, label: "8AM", factor: 0.95 }, // Morning peak
      { hour: 9, label: "9AM", factor: 0.8 },
      { hour: 10, label: "10AM", factor: 0.6 },
      { hour: 11, label: "11AM", factor: 0.55 },
      { hour: 12, label: "12PM", factor: 0.6 },
      { hour: 13, label: "1PM", factor: 0.55 },
      { hour: 14, label: "2PM", factor: 0.5 },
      { hour: 15, label: "3PM", factor: 0.6 },
      { hour: 16, label: "4PM", factor: 0.75 },
      { hour: 17, label: "5PM", factor: 1.0 }, // Evening peak
      { hour: 18, label: "6PM", factor: 0.85 },
      { hour: 19, label: "7PM", factor: 0.6 },
      { hour: 20, label: "8PM", factor: 0.4 },
      { hour: 21, label: "9PM", factor: 0.3 },
    ];
    
    return pattern;
  }, []);

  const getHeatColor = (factor: number) => {
    if (factor >= 0.9) return "bg-red-500";
    if (factor >= 0.7) return "bg-orange-500";
    if (factor >= 0.5) return "bg-yellow-500";
    if (factor >= 0.3) return "bg-green-500";
    return "bg-green-300";
  };

  const getOpacity = (factor: number) => {
    return 0.4 + factor * 0.6;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        Daily Traffic Pattern
      </div>
      
      {/* Heatmap grid */}
      <div className="flex gap-0.5">
        {hourlyData.map((hour, index) => (
          <motion.div
            key={hour.hour}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className="flex-1 group relative"
          >
            <div
              className={`h-12 rounded-sm ${getHeatColor(hour.factor)} transition-all hover:ring-2 hover:ring-foreground/20`}
              style={{ opacity: getOpacity(hour.factor) }}
            />
            
            {/* Tooltip on hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              <p className="font-medium">{hour.label}</p>
              <p className="text-muted-foreground">
                ~{Math.round(aadt * hour.factor / 16).toLocaleString()} vehicles
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>9 PM</span>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <div className="w-3 h-3 rounded-sm bg-red-500" />
          </div>
          <span className="text-[10px] text-muted-foreground">Low → High</span>
        </div>
        
        {peakHourVolume && (
          <div className="text-[10px] text-muted-foreground">
            Peak: <span className="font-mono font-medium text-foreground">{peakHourVolume.toLocaleString()}</span> VPH
          </div>
        )}
      </div>
    </div>
  );
}
