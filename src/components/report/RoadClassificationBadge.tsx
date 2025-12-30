/**
 * Road Classification Badge
 * Visual badge with icon for road type
 */

import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Route, 
  MapPin,
  CircleDot
} from "lucide-react";

interface RoadClassificationBadgeProps {
  classification?: string;
  size?: "sm" | "md" | "lg";
}

export function RoadClassificationBadge({ 
  classification, 
  size = "md" 
}: RoadClassificationBadgeProps) {
  if (!classification) return null;
  
  const normalizedClass = classification.toLowerCase();
  
  const getClassificationDetails = () => {
    if (normalizedClass.includes("interstate") || normalizedClass.includes("freeway")) {
      return {
        icon: Navigation,
        label: "Interstate",
        variant: "default" as const,
        description: "High-capacity highway",
        color: "bg-blue-600",
      };
    }
    if (normalizedClass.includes("highway") || normalizedClass.includes("arterial") || normalizedClass.includes("principal")) {
      return {
        icon: Route,
        label: "Major Arterial",
        variant: "secondary" as const,
        description: "Primary traffic corridor",
        color: "bg-accent",
      };
    }
    if (normalizedClass.includes("collector") || normalizedClass.includes("minor")) {
      return {
        icon: CircleDot,
        label: "Collector",
        variant: "outline" as const,
        description: "Local traffic distribution",
        color: "bg-yellow-600",
      };
    }
    return {
      icon: MapPin,
      label: "Local Road",
      variant: "outline" as const,
      description: "Neighborhood access",
      color: "bg-muted-foreground",
    };
  };
  
  const details = getClassificationDetails();
  const Icon = details.icon;
  
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-3",
    lg: "text-base py-1.5 px-4",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant={details.variant}
        className={`${sizeClasses[size]} flex items-center gap-1.5 w-fit`}
      >
        <div className={`p-0.5 rounded ${details.color}`}>
          <Icon className={`${iconSizes[size]} text-white`} />
        </div>
        {details.label}
      </Badge>
      <p className="text-[10px] text-muted-foreground pl-1">
        {details.description}
      </p>
    </div>
  );
}
