import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, AlertTriangle, MapPin, Mountain, FileText, CheckCircle2, XCircle, Droplets, Building2, Info } from "lucide-react";
import { DataGauge } from "./DataGauge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Cowardin code decoder
const COWARDIN_CODES: Record<string, string> = {
  'P': 'Palustrine (freshwater wetlands)',
  'E': 'Estuarine (tidal wetlands)',
  'M': 'Marine (ocean-connected)',
  'R': 'Riverine (rivers/streams)',
  'L': 'Lacustrine (lake-associated)',
  'EM': 'Emergent (marsh grasses)',
  'SS': 'Scrub-Shrub',
  'FO': 'Forested',
  'AB': 'Aquatic Bed',
  'US': 'Unconsolidated Shore',
  'UB': 'Unconsolidated Bottom',
  'OW': 'Open Water',
};

function decodeCowardinCode(code: string | null | undefined): string | null {
  if (!code) return null;
  
  // Parse code like "PFO1A" -> Palustrine Forested
  const system = code.charAt(0);
  const systemName = COWARDIN_CODES[system] || 'Unknown System';
  
  // Get class (2-character after system)
  const classCode = code.substring(1, 3);
  const className = COWARDIN_CODES[classCode] || '';
  
  if (className) {
    return `${systemName.split('(')[0].trim()} - ${className}`;
  }
  return systemName;
}

interface EnvironmentalCardProps {
  score: number;
  wetlandsType?: string | null;
  wetlandsPercent?: number | null;
  wetlandCowardinCode?: string | null;
  soilSeries?: string | null;
  soilDrainage?: string | null;
  soilSlope?: number | null;
  // Enhanced SSURGO properties
  hydricSoilRating?: string | null;
  floodFrequencyUsda?: string | null;
  waterTableDepthCm?: number | null;
  bedrockDepthCm?: number | null;
  pondingFrequency?: string | null;
  erosionKFactor?: number | null;
  corrosionConcrete?: string | null;
  corrosionSteel?: string | null;
  septicSuitability?: string | null;
  buildingSiteRating?: string | null;
  // Other props
  environmentalSites?: any[] | null;
  epaFacilitiesCount?: number | null;
  elevation?: number | null;
  disasterDeclarations?: string | null;
  environmentalConstraints?: string[] | null;
  verdict?: string | null;
  className?: string;
}

export function EnvironmentalCard({
  score,
  wetlandsType,
  wetlandsPercent,
  wetlandCowardinCode,
  soilSeries,
  soilDrainage,
  soilSlope,
  hydricSoilRating,
  floodFrequencyUsda,
  waterTableDepthCm,
  bedrockDepthCm,
  pondingFrequency,
  erosionKFactor,
  corrosionConcrete,
  corrosionSteel,
  septicSuitability,
  buildingSiteRating,
  environmentalSites = [],
  epaFacilitiesCount,
  elevation,
  disasterDeclarations,
  environmentalConstraints,
  verdict,
  className
}: EnvironmentalCardProps) {
  const hasWetlands = wetlandsType && wetlandsType !== 'None detected' && !wetlandsType.includes('Error');
  const hasHydricSoil = hydricSoilRating && hydricSoilRating.toLowerCase().includes('yes');
  const hasEnvConcerns = hasWetlands || hasHydricSoil || (epaFacilitiesCount && epaFacilitiesCount > 0) || (soilSlope && soilSlope > 15);
  
  const decodedWetland = decodeCowardinCode(wetlandCowardinCode);

  return (
    <Card className={cn(
      "glass-card overflow-hidden border-l-4",
      hasEnvConcerns ? 'border-l-amber-500' : 'border-l-green-500',
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
              <Leaf className="h-5 w-5 text-green-400" />
              Environmental Analysis
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              EPA • USFWS • USDA
            </Badge>
          </div>
          
          {/* Status Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!hasEnvConcerns ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">No Major Constraints</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Review Required</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Score and Key Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <DataGauge value={score} label="Env Score" size="sm" />
            <span className="mt-2 text-sm font-medium text-muted-foreground">Environmental Score</span>
          </div>

          {/* Wetlands Status */}
          <div className={cn(
            "p-4 rounded-xl border-2",
            hasWetlands 
              ? "bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30"
              : "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className={cn("h-5 w-5", hasWetlands ? "text-red-500" : "text-green-500")} />
              <span className="text-sm font-medium">Wetlands</span>
            </div>
            <div className="flex items-center gap-2">
              {hasWetlands ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <span className={cn("font-semibold", hasWetlands ? "text-red-600" : "text-green-600")}>
                {hasWetlands ? 'Detected' : 'None Detected'}
              </span>
            </div>
            {wetlandsPercent && wetlandsPercent > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {wetlandsPercent.toFixed(1)}% of parcel
              </p>
            )}
          </div>

          {/* EPA Sites Nearby */}
          <div className={cn(
            "p-4 rounded-xl border",
            epaFacilitiesCount && epaFacilitiesCount > 0
              ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30"
              : "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                epaFacilitiesCount && epaFacilitiesCount > 0 ? "text-amber-500" : "text-green-500"
              )} />
              <span className="text-sm font-medium">EPA Facilities</span>
            </div>
            <p className="text-2xl font-bold font-mono">
              {epaFacilitiesCount || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Within 1 mile</p>
          </div>
        </div>

        {/* Wetlands Alert with Cowardin Code */}
        {hasWetlands && (
          <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border-2 border-red-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                  Section 404 CWA Permit Required
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {wetlandsType}
                </p>
                {wetlandCowardinCode && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs bg-red-500/10 border-red-500/30">
                      {wetlandCowardinCode}
                    </Badge>
                    {decodedWetland && (
                      <span className="text-xs text-muted-foreground">{decodedWetland}</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Wetland delineation and Army Corps of Engineers permit required. 
                  Expect 6-12 month permitting timeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hydric Soil Warning */}
        {hasHydricSoil && !hasWetlands && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-xl border-2 border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Droplets className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Hydric Soil Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  Soil indicates potential wetlands or flood-prone conditions. 
                  A wetland delineation study may be required during due diligence.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Soil Characteristics - Enhanced */}
        {(soilSeries || soilDrainage || soilSlope || hydricSoilRating || floodFrequencyUsda) && (
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Mountain className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold">Soil Characteristics</h4>
              <Badge variant="outline" className="text-[10px] ml-auto">USDA SSURGO</Badge>
            </div>
            
            {/* Primary soil info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {soilSeries && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Series</p>
                  <p className="font-medium">{soilSeries}</p>
                </div>
              )}
              {soilDrainage && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Drainage</p>
                  <p className="font-medium">{soilDrainage}</p>
                </div>
              )}
              {soilSlope !== null && soilSlope !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Slope</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-mono">{soilSlope}%</p>
                    {soilSlope > 15 && (
                      <Badge variant="destructive" className="text-xs">Steep</Badge>
                    )}
                    {soilSlope > 5 && soilSlope <= 15 && (
                      <Badge variant="secondary" className="text-xs">Moderate</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced SSURGO Properties */}
            {(hydricSoilRating || floodFrequencyUsda || waterTableDepthCm || pondingFrequency) && (
              <div className="pt-4 border-t border-amber-500/20">
                <p className="text-xs text-muted-foreground uppercase mb-3">Flood & Drainage Indicators</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {hydricSoilRating && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground">Hydric Soil</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground/50" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="text-xs">Indicates soil formed under saturated conditions - may indicate wetlands</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className={cn(
                        "font-medium text-sm",
                        hydricSoilRating.toLowerCase().includes('yes') ? "text-amber-600" : "text-green-600"
                      )}>
                        {hydricSoilRating}
                      </p>
                    </div>
                  )}
                  {floodFrequencyUsda && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground">Flood Freq.</span>
                      </div>
                      <p className={cn(
                        "font-medium text-sm",
                        floodFrequencyUsda.toLowerCase() !== 'none' ? "text-amber-600" : "text-green-600"
                      )}>
                        {floodFrequencyUsda}
                      </p>
                    </div>
                  )}
                  {waterTableDepthCm !== null && waterTableDepthCm !== undefined && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground">Water Table</span>
                      </div>
                      <p className={cn(
                        "font-medium text-sm font-mono",
                        waterTableDepthCm < 50 ? "text-amber-600" : "text-foreground"
                      )}>
                        {Math.round(waterTableDepthCm / 2.54)}" ({waterTableDepthCm} cm)
                      </p>
                    </div>
                  )}
                  {pondingFrequency && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground">Ponding</span>
                      </div>
                      <p className={cn(
                        "font-medium text-sm",
                        pondingFrequency.toLowerCase() !== 'none' ? "text-amber-600" : "text-green-600"
                      )}>
                        {pondingFrequency}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Construction-related soil properties */}
            {(erosionKFactor || bedrockDepthCm || corrosionConcrete || corrosionSteel || buildingSiteRating) && (
              <div className="pt-4 mt-4 border-t border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-muted-foreground uppercase">Construction Considerations</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {bedrockDepthCm !== null && bedrockDepthCm !== undefined && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <span className="text-[10px] text-muted-foreground block mb-1">Bedrock Depth</span>
                      <p className={cn(
                        "font-medium text-sm font-mono",
                        bedrockDepthCm < 100 ? "text-amber-600" : "text-foreground"
                      )}>
                        {Math.round(bedrockDepthCm / 2.54)}" ({bedrockDepthCm} cm)
                      </p>
                    </div>
                  )}
                  {erosionKFactor !== null && erosionKFactor !== undefined && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground">Erosion (K)</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground/50" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="text-xs">Soil erodibility factor (0-0.69). Higher values = more erosion-prone</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className={cn(
                        "font-medium text-sm font-mono",
                        erosionKFactor > 0.4 ? "text-amber-600" : "text-foreground"
                      )}>
                        {erosionKFactor.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {corrosionConcrete && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <span className="text-[10px] text-muted-foreground block mb-1">Concrete Corrosion</span>
                      <p className={cn(
                        "font-medium text-sm",
                        corrosionConcrete.toLowerCase().includes('high') ? "text-red-600" : 
                        corrosionConcrete.toLowerCase().includes('moderate') ? "text-amber-600" : "text-green-600"
                      )}>
                        {corrosionConcrete}
                      </p>
                    </div>
                  )}
                  {corrosionSteel && (
                    <div className="p-2 bg-background/50 rounded-lg">
                      <span className="text-[10px] text-muted-foreground block mb-1">Steel Corrosion</span>
                      <p className={cn(
                        "font-medium text-sm",
                        corrosionSteel.toLowerCase().includes('high') ? "text-red-600" : 
                        corrosionSteel.toLowerCase().includes('moderate') ? "text-amber-600" : "text-green-600"
                      )}>
                        {corrosionSteel}
                      </p>
                    </div>
                  )}
                  {buildingSiteRating && (
                    <div className="p-2 bg-background/50 rounded-lg col-span-2">
                      <span className="text-[10px] text-muted-foreground block mb-1">Building Suitability</span>
                      <p className="font-medium text-sm">{buildingSiteRating}</p>
                    </div>
                  )}
                  {septicSuitability && (
                    <div className="p-2 bg-background/50 rounded-lg col-span-2">
                      <span className="text-[10px] text-muted-foreground block mb-1">Septic Suitability</span>
                      <p className="font-medium text-sm">{septicSuitability}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Elevation */}
            {elevation && (
              <div className="mt-4 pt-4 border-t border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Site Elevation</span>
                  <span className="font-semibold font-mono">{elevation.toFixed(1)} ft</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Environmental Constraints */}
        {environmentalConstraints && environmentalConstraints.length > 0 && (
          <div className="p-4 bg-muted/20 rounded-xl border">
            <h4 className="font-semibold mb-3 text-sm">Environmental Constraints</h4>
            <div className="flex flex-wrap gap-2">
              {environmentalConstraints.map((constraint, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Disaster History */}
        {disasterDeclarations && (
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <h4 className="font-semibold text-sm">FEMA Disaster History</h4>
            </div>
            <p className="text-sm text-muted-foreground">{disasterDeclarations}</p>
          </div>
        )}

        {/* Environmental Sites */}
        {environmentalSites && environmentalSites.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-red-500" />
              <h4 className="font-semibold text-sm text-red-600">
                Nearby Environmental Sites ({environmentalSites.length})
              </h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {environmentalSites.slice(0, 5).map((site: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{site.site_name || site.name}</p>
                    {site.program && (
                      <p className="text-xs text-muted-foreground">{site.program}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {site.status && (
                      <Badge variant="outline" className="text-xs">{site.status}</Badge>
                    )}
                    {site.distance_mi && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {site.distance_mi} mi
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Phase I/II Environmental Assessment may be required
            </p>
          </div>
        )}

        {/* AI Verdict */}
        {verdict && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--data-cyan))] animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Analysis</span>
            </div>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: verdict }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
