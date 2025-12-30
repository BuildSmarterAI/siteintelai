/**
 * Access Distance Visual
 * Radial diagram showing distances to key infrastructure
 */

import { motion } from "framer-motion";
import { MapPin, Navigation, TrafficCone, Train } from "lucide-react";

interface AccessDistanceVisualProps {
  distanceHighwayFt?: number;
  distanceTransitFt?: number;
  nearestSignalDistanceFt?: number;
}

export function AccessDistanceVisual({
  distanceHighwayFt,
  distanceTransitFt,
  nearestSignalDistanceFt,
}: AccessDistanceVisualProps) {
  const feetToMiles = (ft: number) => (ft / 5280).toFixed(2);
  
  // Define max distance for scaling (2 miles = 10560 ft)
  const maxDistance = 10560;
  
  const items = [
    {
      label: "Highway",
      distance: distanceHighwayFt,
      icon: Navigation,
      angle: -45,
      color: "hsl(var(--accent))",
    },
    {
      label: "Transit",
      distance: distanceTransitFt,
      icon: Train,
      angle: 45,
      color: "hsl(217, 91%, 60%)",
    },
    {
      label: "Signal",
      distance: nearestSignalDistanceFt,
      icon: TrafficCone,
      angle: 135,
      color: "hsl(25, 95%, 53%)",
    },
  ].filter(item => item.distance != null);

  const getDistanceRing = (distance: number) => {
    // Returns which ring (1-4) the distance falls into
    if (distance <= 1320) return 1; // 0.25 mi
    if (distance <= 2640) return 2; // 0.5 mi
    if (distance <= 5280) return 3; // 1 mi
    return 4; // > 1 mi
  };

  const getQualityColor = (distance: number) => {
    const ring = getDistanceRing(distance);
    if (ring === 1) return "text-green-500";
    if (ring === 2) return "text-yellow-500";
    if (ring === 3) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="relative w-full max-w-[280px] mx-auto aspect-square">
      {/* SVG Container */}
      <svg viewBox="0 0 280 280" className="w-full h-full">
        {/* Concentric circles */}
        {[1, 2, 3, 4].map((ring) => (
          <circle
            key={ring}
            cx="140"
            cy="140"
            r={ring * 30}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray={ring === 4 ? "4 4" : "none"}
            opacity={0.5}
          />
        ))}
        
        {/* Distance labels */}
        <text x="175" y="143" fontSize="8" fill="hsl(var(--muted-foreground))">0.25mi</text>
        <text x="205" y="143" fontSize="8" fill="hsl(var(--muted-foreground))">0.5mi</text>
        <text x="235" y="143" fontSize="8" fill="hsl(var(--muted-foreground))">1mi</text>
        
        {/* Center point (parcel) */}
        <circle cx="140" cy="140" r="8" fill="hsl(var(--primary))" />
        <text x="140" y="160" fontSize="9" fill="hsl(var(--foreground))" textAnchor="middle">Site</text>
      </svg>
      
      {/* Access point markers */}
      {items.map((item, index) => {
        if (!item.distance) return null;
        
        const ring = getDistanceRing(item.distance);
        const radius = ring * 30 + 10; // offset from ring
        const angleRad = (item.angle * Math.PI) / 180;
        const x = 140 + radius * Math.cos(angleRad);
        const y = 140 + radius * Math.sin(angleRad);
        
        const Icon = item.icon;
        
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
            className="absolute flex flex-col items-center"
            style={{
              left: `${(x / 280) * 100}%`,
              top: `${(y / 280) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="p-1.5 rounded-full shadow-md"
              style={{ backgroundColor: item.color }}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="mt-1 text-center bg-background/80 rounded px-1.5 py-0.5">
              <p className="text-[9px] font-medium">{item.label}</p>
              <p className={`text-[10px] font-mono font-bold ${getQualityColor(item.distance)}`}>
                {feetToMiles(item.distance)} mi
              </p>
            </div>
          </motion.div>
        );
      })}
      
      {/* No data message */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No access data available</p>
        </div>
      )}
    </div>
  );
}
