import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Droplet, Waves, CloudRain } from "lucide-react";

interface UtilityLine {
  diameter: number | null;
  material: string | null;
  status?: string | null;
  install_date?: string | null;
  distance_ft?: number;
}

interface UtilityResultsProps {
  waterLines: UtilityLine[] | null;
  sewerLines: UtilityLine[] | null;
  stormLines: UtilityLine[] | null;
  dataFlags: string[];
}

export function UtilityResults({ waterLines, sewerLines, stormLines, dataFlags }: UtilityResultsProps) {
  const hasUtilitiesNotFound = dataFlags?.includes('utilities_not_found');
  const hasNoData = !waterLines?.length && !sewerLines?.length && !stormLines?.length;

  if (hasNoData && hasUtilitiesNotFound) {
    return (
      <Card className="border-2 border-yellow-500/30 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-headline text-lg font-bold text-charcoal mb-2">
                Utilities Not Published in City GIS
              </h4>
              <p className="font-body text-sm text-charcoal/70">
                Utility infrastructure data is not available in the city's public GIS system for this location. 
                This may indicate the property is served by a Municipal Utility District (MUD) or Water Control & Improvement District (WCID). 
                Contact the local public works department or MUD office for confirmation of available utilities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-headline text-2xl font-bold text-charcoal">
        Utility Infrastructure Analysis
      </h3>

      {/* Water Lines */}
      {waterLines && waterLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-600" />
              <span className="font-headline text-xl">Water Lines</span>
              <Badge variant="outline" className="ml-2">
                {waterLines.length} line{waterLines.length !== 1 ? 's' : ''} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waterLines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-bold text-blue-600 text-lg">
                        {line.diameter ? `${line.diameter}"` : 'N/A'}
                      </div>
                      <div className="text-xs text-charcoal/60">Diameter</div>
                    </div>
                    <div className="border-l border-blue-300 pl-4">
                      <div className="font-semibold text-charcoal">
                        {line.material || 'Unknown Material'}
                      </div>
                      {line.status && (
                        <div className="text-sm text-charcoal/70">
                          Status: {line.status}
                        </div>
                      )}
                    </div>
                  </div>
                  {line.distance_ft && (
                    <div className="text-sm text-charcoal/60">
                      {Math.round(line.distance_ft)} ft away
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sewer Lines */}
      {sewerLines && sewerLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-purple-600" />
              <span className="font-headline text-xl">Sewer Lines</span>
              <Badge variant="outline" className="ml-2">
                {sewerLines.length} line{sewerLines.length !== 1 ? 's' : ''} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sewerLines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-bold text-purple-600 text-lg">
                        {line.diameter ? `${line.diameter}"` : 'N/A'}
                      </div>
                      <div className="text-xs text-charcoal/60">Diameter</div>
                    </div>
                    <div className="border-l border-purple-300 pl-4">
                      <div className="font-semibold text-charcoal">
                        {line.material || 'Unknown Material'}
                      </div>
                      {line.status && (
                        <div className="text-sm text-charcoal/70">
                          Status: {line.status}
                        </div>
                      )}
                    </div>
                  </div>
                  {line.distance_ft && (
                    <div className="text-sm text-charcoal/60">
                      {Math.round(line.distance_ft)} ft away
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storm Lines */}
      {stormLines && stormLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-slate-600" />
              <span className="font-headline text-xl">Storm Drainage Lines</span>
              <Badge variant="outline" className="ml-2">
                {stormLines.length} line{stormLines.length !== 1 ? 's' : ''} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stormLines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-bold text-slate-600 text-lg">
                        {line.diameter ? `${line.diameter}"` : 'N/A'}
                      </div>
                      <div className="text-xs text-charcoal/60">Diameter</div>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                      <div className="font-semibold text-charcoal">
                        {line.material || 'Unknown Material'}
                      </div>
                      {line.status && (
                        <div className="text-sm text-charcoal/70">
                          Status: {line.status}
                        </div>
                      )}
                    </div>
                  </div>
                  {line.distance_ft && (
                    <div className="text-sm text-charcoal/60">
                      {Math.round(line.distance_ft)} ft away
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasNoData && !hasUtilitiesNotFound && (
        <Card className="border-2 border-slate-300 bg-slate-50">
          <CardContent className="p-6 text-center">
            <p className="font-body text-charcoal/70">
              Utility data is being processed. Please check back shortly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
