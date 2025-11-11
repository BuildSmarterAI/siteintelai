import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Droplet, Waves, CloudRain } from "lucide-react";

interface UtilityLine {
  diameter: number | null;
  material: string | null;
  status?: string | null;
  install_date?: string | null;
  distance_ft?: number;
  source?: string;
}

interface UtilityResultsProps {
  waterLines: UtilityLine[] | null;
  sewerLines: UtilityLine[] | null;
  stormLines: UtilityLine[] | null;
  dataFlags: string[];
}

function UtilityTable({ 
  lines, 
  type, 
  icon: Icon, 
  color,
  dataFlags
}: { 
  lines: UtilityLine[] | null; 
  type: string; 
  icon: any; 
  color: string;
  dataFlags: string[];
}) {
  const hasData = lines && lines.length > 0;
  const isOsmData = lines?.[0]?.source === "OSM_DATA" || lines?.[0]?.material === "OSM_DATA";

  return (
    <Card className={hasData ? '' : 'border-yellow-500/30 bg-yellow-50/50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="font-headline text-xl">{type} Lines</span>
          {hasData && (
            <>
              <Badge variant="outline" className="ml-2">
                {lines.length} line{lines.length !== 1 ? 's' : ''} found
              </Badge>
              {isOsmData && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                  OSM Data
                </Badge>
              )}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOsmData && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-body text-sm text-charcoal mb-2">
                  ⚠️ <strong>Community-Contributed Data (OpenStreetMap)</strong>
                </p>
                <p className="font-body text-xs text-charcoal/70 mb-2">
                  This utility data comes from OpenStreetMap and may not be city-verified. 
                  Please confirm with the local public works department or utility provider before making design decisions.
                </p>
                <p className="font-body text-xs text-charcoal/70">
                  <strong>Recommended:</strong> Request manual verification with city records.
                </p>
              </div>
            </div>
          </div>
        )}
        {hasData && !isOsmData ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-charcoal/10">
                  <th className="text-left py-3 px-4 font-headline text-sm font-bold text-charcoal">
                    Diameter
                  </th>
                  <th className="text-left py-3 px-4 font-headline text-sm font-bold text-charcoal">
                    Material
                  </th>
                  <th className="text-left py-3 px-4 font-headline text-sm font-bold text-charcoal">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-headline text-sm font-bold text-charcoal">
                    Distance (ft)
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const distanceFt = line.distance_ft ? Math.round(line.distance_ft) : null;
                  const getDistanceColor = (dist: number | null) => {
                    if (!dist) return 'text-charcoal/70';
                    if (dist <= 250) return 'text-emerald-600 font-semibold';
                    if (dist <= 500) return 'text-blue-600 font-semibold';
                    if (dist <= 1000) return 'text-amber-600 font-semibold';
                    return 'text-orange-600 font-semibold';
                  };
                  
                  return (
                    <tr key={idx} className="border-b border-charcoal/5 hover:bg-charcoal/5">
                      <td className="py-3 px-4 font-body text-charcoal">
                        {line.diameter ? `${line.diameter}"` : '—'}
                      </td>
                      <td className="py-3 px-4 font-body text-charcoal">
                        {line.material || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 font-body text-charcoal">
                        {line.status || '—'}
                      </td>
                      <td className={`py-3 px-4 font-body ${getDistanceColor(distanceFt)}`}>
                        {distanceFt ? `${distanceFt} ft` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : hasData && isOsmData ? (
          <p className="font-body text-sm text-charcoal/70">
            Utility infrastructure detected in OpenStreetMap within 800 ft of the property.
            Exact specifications not available from community data.
          </p>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body text-sm text-charcoal">
                ⚠️ No {type.toLowerCase()} lines returned in city GIS. Please confirm with MUD/Public Works.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UtilityResults({ waterLines, sewerLines, stormLines, dataFlags }: UtilityResultsProps) {
  const hasPartialDataFlags = 
    dataFlags?.includes('utilities_enrichment_partial') || 
    dataFlags?.includes('utilities_water_laterals_unavailable') ||
    dataFlags?.includes('utilities_storm_unavailable');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline text-2xl font-bold text-charcoal">
          Utilities Overview
        </h3>
        {dataFlags?.includes('utilities_not_supported') && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            City Not Supported
          </Badge>
        )}
      </div>

      {/* Partial Data Info Banner */}
      {hasPartialDataFlags && (
        <Card className="border-2 border-cyan-500/30 bg-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-headline text-base font-semibold text-charcoal mb-1">
                  Partial Utility Data Available
                </h4>
                <p className="font-body text-sm text-charcoal/80">
                  Some detailed utility layers were unavailable (water laterals, storm manholes), 
                  but main water and sewer infrastructure data is shown below. 
                  This is sufficient for initial feasibility assessment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Water Lines */}
      <UtilityTable 
        lines={waterLines} 
        type="Water" 
        icon={Droplet} 
        color="text-blue-600"
        dataFlags={dataFlags}
      />

      {/* Sewer Lines */}
      <UtilityTable 
        lines={sewerLines} 
        type="Sewer" 
        icon={Waves} 
        color="text-purple-600"
        dataFlags={dataFlags}
      />

      {/* Storm Drain Lines */}
      <UtilityTable 
        lines={stormLines} 
        type="Storm Drain" 
        icon={CloudRain} 
        color="text-slate-600"
        dataFlags={dataFlags}
      />

      {/* Additional Context */}
      {dataFlags?.includes('utilities_from_osm') && (
        <Card className="border-2 border-amber-500/30 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-headline text-lg font-bold text-charcoal mb-2">
                  Using OpenStreetMap Data
                </h4>
                <p className="font-body text-sm text-charcoal/70 mb-3">
                  City utility GIS returned no results, so this report includes community-contributed data from OpenStreetMap as a fallback. 
                  This data is not city-verified and may be incomplete or outdated.
                </p>
                <p className="font-body text-sm text-charcoal/70">
                  <strong>Recommended Action:</strong> Contact the local public works department to verify utility availability and obtain official infrastructure maps before proceeding with design.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {dataFlags?.includes('utilities_api_unreachable') && (
        <Card className="border-2 border-red-500/30 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-headline text-lg font-bold text-charcoal mb-2">
                  Utility Data Temporarily Unavailable
                </h4>
                <p className="font-body text-sm text-charcoal/70 mb-3">
                  The city's utility GIS servers are currently unreachable. This is typically a temporary issue with the city's API infrastructure.
                </p>
                <p className="font-body text-sm text-charcoal/70">
                  <strong>Recommended Action:</strong> Try refreshing the data in a few minutes, or contact the local public works department directly for utility information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {dataFlags?.includes('utilities_not_found') && !dataFlags?.includes('utilities_api_unreachable') && (
        <Card className="border-2 border-yellow-500/30 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-headline text-lg font-bold text-charcoal mb-2">
                  Utilities Information Not Available
                </h4>
                <p className="font-body text-sm text-charcoal/70 mb-3">
                  Utility infrastructure data is not available in the city's public GIS system for this location.
                  This may indicate the property is served by a Municipal Utility District (MUD) or Water Control & Improvement District (WCID).
                </p>
                <p className="font-body text-sm text-charcoal/70">
                  <strong>Recommended Action:</strong> Contact the local public works department or MUD office to confirm available utilities and infrastructure capacity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
