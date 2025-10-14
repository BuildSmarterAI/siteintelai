import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Gauge } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";

interface GeospatialIntelligenceCardProps {
  applicationId: string;
  reportCreatedAt: string;
}

interface GeospatialData {
  geospatial_score: {
    overall_geospatial_score: number;
    jurisdiction_confidence: number;
    flood_risk_index: number;
    traffic_visibility_index: number;
    scoring_notes: string;
  };
  fema_flood_risk: {
    zone_code: string;
    in_flood_zone: boolean;
    bfe?: number;
    source: string;
  };
  traffic_exposure: {
    roadway_name: string;
    aadt: number;
    distance_to_segment_ft: number;
    year: number;
  };
  county_boundary: {
    county_name: string;
  };
}

export function GeospatialIntelligenceCard({ applicationId, reportCreatedAt }: GeospatialIntelligenceCardProps) {
  const [geoData, setGeoData] = useState<GeospatialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGeospatialData() {
      try {
        const { data, error } = await supabase
          .from('feasibility_geospatial')
          .select('*')
          .eq('application_id', applicationId)
          .single();

        if (!error && data) {
          setGeoData(data as unknown as GeospatialData);
        }
      } catch (err) {
        console.error('Failed to load geospatial data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGeospatialData();
  }, [applicationId]);

  if (loading) return null;
  if (!geoData) return null;

  const score = geoData.geospatial_score?.overall_geospatial_score || 0;
  const scoreBand = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : score >= 40 ? 'text-orange-600' : 'text-red-600';
  const scoreBg = score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : score >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';

  const floodZone = geoData.fema_flood_risk?.zone_code || 'Unknown';
  const floodRisk = floodZone === 'Zone X' ? 'Low Risk' : floodZone.includes('A') || floodZone.includes('V') ? 'High Risk' : 'Moderate Risk';
  const floodColor = floodZone === 'Zone X' ? 'text-green-600' : floodZone.includes('A') || floodZone.includes('V') ? 'text-red-600' : 'text-yellow-600';

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geospatial Intelligence
        </CardTitle>
        <DataSourceBadge 
          datasetName="Multi-Source Geospatial Analysis" 
          timestamp={reportCreatedAt}
        />
      </CardHeader>
      <CardContent>
        {/* Overall Score Gauge */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32">
              <svg className="transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/20"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={`${(score / 100) * 314} 314`}
                  className={scoreColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${scoreColor}`}>{Math.round(score)}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{scoreBand}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Jurisdiction Confidence */}
          <div className={`p-4 rounded-lg border ${geoData.geospatial_score.jurisdiction_confidence >= 90 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">Jurisdiction</span>
              <Badge variant="outline" className="text-xs">
                {geoData.geospatial_score.jurisdiction_confidence}%
              </Badge>
            </div>
            <p className="text-sm font-semibold">{geoData.county_boundary?.county_name || 'Unknown County'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {geoData.geospatial_score.jurisdiction_confidence >= 90 ? '✓ Confirmed Match' : '⚠ Boundary Proximity'}
            </p>
          </div>

          {/* Flood Risk Index */}
          <div className={`p-4 rounded-lg border ${scoreBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">Flood Risk</span>
              <Badge variant="outline" className="text-xs">
                Index: {geoData.geospatial_score.flood_risk_index}
              </Badge>
            </div>
            <p className={`text-sm font-semibold ${floodColor}`}>{floodZone}</p>
            <p className="text-xs text-muted-foreground mt-1">{floodRisk}</p>
          </div>

          {/* Traffic Visibility Index */}
          <div className={`p-4 rounded-lg border ${geoData.geospatial_score.traffic_visibility_index >= 0.7 ? 'bg-green-50 border-green-200' : geoData.geospatial_score.traffic_visibility_index >= 0.4 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">Traffic Exposure</span>
              <Badge variant="outline" className="text-xs">
                Index: {geoData.geospatial_score.traffic_visibility_index.toFixed(2)}
              </Badge>
            </div>
            <p className="text-sm font-semibold">
              {geoData.traffic_exposure?.roadway_name || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {geoData.traffic_exposure?.aadt ? `AADT: ${geoData.traffic_exposure.aadt.toLocaleString()}` : 'No data'}
            </p>
          </div>
        </div>

        {/* Scoring Analysis */}
        {geoData.geospatial_score?.scoring_notes && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase mb-1">Analysis</p>
            <p className="text-sm leading-relaxed">{geoData.geospatial_score.scoring_notes}</p>
          </div>
        )}

        {/* Data Sources */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Data Sources:</span>
          <Badge variant="outline" className="text-xs">FEMA NFHL</Badge>
          <Badge variant="outline" className="text-xs">TxDOT Traffic</Badge>
          <Badge variant="outline" className="text-xs">County Boundaries</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
