import { Shield, Database, MapPin, Leaf, Bird, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const dataSources = [
  {
    icon: Shield,
    name: "FEMA",
    description: "Flood & Environmental Data",
    color: "text-blue-600"
  },
  {
    icon: MapPin,
    name: "Esri ArcGIS",
    description: "Geospatial Intelligence",
    color: "text-cyan-600"
  },
  {
    icon: Database,
    name: "TxDOT",
    description: "Transportation Infrastructure",
    color: "text-orange-600"
  },
  {
    icon: Leaf,
    name: "EPA",
    description: "Environmental Protection",
    color: "text-green-600"
  },
  {
    icon: Bird,
    name: "USFWS",
    description: "Wildlife & Conservation",
    color: "text-emerald-600"
  },
  {
    icon: Users,
    name: "U.S. Census",
    description: "Demographics & Population",
    color: "text-purple-600"
  }
];

export const TrustBadgesGrid = () => {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Verified Data Sources</h3>
            <p className="text-sm text-muted-foreground">
              All analysis powered by authoritative government and industry sources
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dataSources.map((source) => (
              <div
                key={source.name}
                className="flex flex-col items-center text-center p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <source.icon className={`w-8 h-8 mb-2 ${source.color}`} />
                <div className="font-medium text-sm">{source.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {source.description}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-center text-muted-foreground pt-2 border-t">
            <Shield className="inline w-3 h-3 mr-1" />
            Data verified from 20+ government and industry sources. 
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            Full citations available in PDF report.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
