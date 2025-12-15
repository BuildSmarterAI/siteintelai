import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Building2, Users, ShoppingCart, GraduationCap, Utensils, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmploymentCluster {
  name: string;
  jobs?: number;
  distance_mi?: number;
  type?: string;
}

interface NearbyPlace {
  name: string;
  type: string;
  distance_ft: number;
  address?: string;
}

interface EmploymentContextCardProps {
  submarketEnriched?: string | null;
  employmentClusters?: EmploymentCluster[] | null;
  nearbyPlaces?: NearbyPlace[] | null;
  className?: string;
}

const getPlaceIcon = (type: string) => {
  const typeMap: Record<string, React.ElementType> = {
    school: GraduationCap,
    restaurant: Utensils,
    shopping: ShoppingCart,
    hospital: Heart,
    office: Building2,
    default: MapPin
  };
  const normalizedType = type?.toLowerCase() || '';
  for (const [key, Icon] of Object.entries(typeMap)) {
    if (normalizedType.includes(key)) return Icon;
  }
  return MapPin;
};

const categorizePlace = (type: string): string => {
  const typeMap: Record<string, string> = {
    school: 'Education',
    university: 'Education',
    restaurant: 'Dining',
    cafe: 'Dining',
    shopping: 'Retail',
    store: 'Retail',
    mall: 'Retail',
    hospital: 'Healthcare',
    doctor: 'Healthcare',
    pharmacy: 'Healthcare',
    bank: 'Services',
    gas: 'Services',
    transit: 'Transit',
    bus: 'Transit',
    subway: 'Transit'
  };
  const normalizedType = type?.toLowerCase() || '';
  for (const [key, category] of Object.entries(typeMap)) {
    if (normalizedType.includes(key)) return category;
  }
  return 'Other';
};

export function EmploymentContextCard({
  submarketEnriched,
  employmentClusters,
  nearbyPlaces,
  className
}: EmploymentContextCardProps) {
  // Group nearby places by category
  const groupedPlaces = nearbyPlaces?.reduce((acc, place) => {
    const category = categorizePlace(place.type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(place);
    return acc;
  }, {} as Record<string, NearbyPlace[]>) || {};

  const hasData = employmentClusters?.length || nearbyPlaces?.length || submarketEnriched;

  if (!hasData) return null;

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4 border-l-[hsl(var(--data-cyan))]",
      className
    )}>
      {/* Header */}
      <CardHeader className="relative bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white pb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--data-cyan)/0.3)_50%,transparent_100%)] animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Briefcase className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
              Employment & Context
            </CardTitle>
            {submarketEnriched && (
              <Badge className="bg-[hsl(var(--data-cyan)/0.2)] border-[hsl(var(--data-cyan)/0.5)] text-white">
                {submarketEnriched}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Employment Clusters */}
        {employmentClusters && employmentClusters.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
              Major Employment Centers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employmentClusters.slice(0, 6).map((cluster, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-gradient-to-br from-[hsl(var(--data-cyan)/0.1)] to-transparent rounded-xl border border-[hsl(var(--data-cyan)/0.2)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{cluster.name}</p>
                      {cluster.jobs && (
                        <p className="text-2xl font-bold font-mono text-[hsl(var(--data-cyan))] mt-1">
                          {(cluster.jobs / 1000).toFixed(0)}K
                          <span className="text-xs font-normal ml-1">jobs</span>
                        </p>
                      )}
                      {cluster.type && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {cluster.type}
                        </Badge>
                      )}
                    </div>
                    {cluster.distance_mi && (
                      <Badge variant="secondary" className="font-mono text-xs shrink-0">
                        {cluster.distance_mi.toFixed(1)} mi
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Places by Category */}
        {Object.keys(groupedPlaces).length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Nearby Points of Interest
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedPlaces).slice(0, 4).map(([category, places]) => (
                <div key={category} className="p-4 bg-muted/20 rounded-xl border">
                  <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                    {(() => {
                      const Icon = getPlaceIcon(category);
                      return <Icon className="h-4 w-4 text-muted-foreground" />;
                    })()}
                    {category}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {places.length}
                    </Badge>
                  </h5>
                  <div className="space-y-2">
                    {places.slice(0, 3).map((place, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1 text-muted-foreground">{place.name}</span>
                        <span className="font-mono text-xs ml-2">
                          {(place.distance_ft / 5280).toFixed(1)} mi
                        </span>
                      </div>
                    ))}
                    {places.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{places.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Attribution */}
        <div className="pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>Source: Google Places API, Employment Data</span>
        </div>
      </CardContent>
    </Card>
  );
}
