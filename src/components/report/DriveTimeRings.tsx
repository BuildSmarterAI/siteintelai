/**
 * Drive Time Rings
 * Visual representation of population reach by drive time
 */

import { motion } from "framer-motion";
import { Users, Car } from "lucide-react";

interface DriveTimeData {
  minutes: number;
  population?: number;
  households?: number;
}

interface DriveTimeRingsProps {
  driveTimeData?: DriveTimeData[] | Record<string, unknown>;
}

export function DriveTimeRings({ driveTimeData }: DriveTimeRingsProps) {
  // Parse drive time data into consistent format
  const parsedData: DriveTimeData[] = [];
  
  if (Array.isArray(driveTimeData)) {
    parsedData.push(...driveTimeData);
  } else if (driveTimeData && typeof driveTimeData === 'object') {
    // Handle object format like { "5min": {...}, "10min": {...} }
    Object.entries(driveTimeData).forEach(([key, value]) => {
      const minutes = parseInt(key.replace(/\D/g, ''));
      if (!isNaN(minutes) && typeof value === 'object' && value !== null) {
        const data = value as Record<string, unknown>;
        parsedData.push({
          minutes,
          population: typeof data.population === 'number' ? data.population : undefined,
          households: typeof data.households === 'number' ? data.households : undefined,
        });
      }
    });
  }
  
  // Sort by minutes
  parsedData.sort((a, b) => a.minutes - b.minutes);
  
  if (parsedData.length === 0) {
    return null;
  }
  
  const maxPopulation = Math.max(...parsedData.map(d => d.population || 0));
  
  const ringColors = [
    "bg-accent/80",
    "bg-accent/60",
    "bg-accent/40",
    "bg-accent/20",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Car className="h-4 w-4" />
        Population by Drive Time
      </div>
      
      {/* Nested rings visualization */}
      <div className="relative h-32 flex items-center justify-center">
        {parsedData.map((data, index) => {
          const size = 100 - (index * 20);
          const colorClass = ringColors[index] || ringColors[ringColors.length - 1];
          
          return (
            <motion.div
              key={data.minutes}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: (parsedData.length - index) * 0.1 }}
              className={`absolute rounded-full ${colorClass} flex items-center justify-center`}
              style={{
                width: `${size}%`,
                height: `${size}%`,
              }}
            >
              {index === 0 && (
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">{data.minutes} min</p>
                  {data.population && (
                    <p className="text-lg font-bold font-mono text-foreground">
                      {(data.population / 1000).toFixed(0)}k
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend / Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {parsedData.map((data, index) => (
          <div 
            key={data.minutes}
            className="flex items-center gap-2 p-2 rounded bg-muted/50"
          >
            <div className={`w-3 h-3 rounded-full ${ringColors[index]}`} />
            <div>
              <p className="font-medium">{data.minutes} min drive</p>
              {data.population && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {data.population.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
