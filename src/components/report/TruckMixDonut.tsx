/**
 * Truck Mix Donut Chart
 * Shows breakdown of vehicle types
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Truck } from "lucide-react";

interface TruckMixDonutProps {
  totalAadt: number;
  truckPercent?: number;
  singleUnitPercent?: number;
  combinationPercent?: number;
}

export function TruckMixDonut({
  totalAadt,
  truckPercent = 0,
  singleUnitPercent,
  combinationPercent,
}: TruckMixDonutProps) {
  const passengerPercent = 100 - truckPercent;
  
  // Calculate truck breakdown
  const singleUnit = singleUnitPercent ?? truckPercent * 0.6;
  const combination = combinationPercent ?? truckPercent * 0.4;
  
  const data = [
    { name: "Passenger Vehicles", value: passengerPercent, color: "hsl(var(--muted-foreground) / 0.4)" },
    { name: "Single-Unit Trucks", value: singleUnit, color: "hsl(var(--accent))" },
    { name: "Combination Trucks", value: combination, color: "hsl(25, 95%, 53%)" },
  ].filter(d => d.value > 0);

  const truckCount = Math.round((truckPercent / 100) * totalAadt);

  return (
    <div className="relative w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <Truck className="h-5 w-5 mx-auto text-accent mb-1" />
          <p className="text-lg font-bold font-mono">{truckPercent.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">Commercial</p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px]">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
