import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle, XCircle, MapPin, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReEnrichApplication } from '@/hooks/useReEnrichApplication';

const TEST_COORDINATES = [
  { name: 'Houston (Downtown)', lat: 29.7604, lng: -95.3698 },
  { name: 'Sugar Land', lat: 29.6196, lng: -95.6349 },
  { name: 'The Woodlands', lat: 30.1658, lng: -95.4613 },
];

export default function AdminGeospatial() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [latestApp, setLatestApp] = useState<any>(null);
  const [fetchingApp, setFetchingApp] = useState(true);
  const { toast } = useToast();
  const { reEnrich, loading: reEnrichLoading } = useReEnrichApplication();

  useEffect(() => {
    fetchLatestApplication();
  }, []);

  const fetchLatestApplication = async () => {
    setFetchingApp(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, formatted_address, status, enrichment_status, created_at, water_lines, sewer_lines, storm_lines')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      setLatestApp(data);
    } catch (err: any) {
      console.error('Error fetching latest application:', err);
    } finally {
      setFetchingApp(false);
    }
  };

  const handleReEnrich = async () => {
    if (!latestApp) return;
    
    const result = await reEnrich(latestApp.id);
    if (result.success) {
      toast({
        title: 'Re-enrichment started',
        description: 'Check back in 30-60 seconds',
      });
      // Refresh after 5 seconds
      setTimeout(() => fetchLatestApplication(), 5000);
    }
  };

  const fetchGeospatialLayers = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'fetch-geospatial-layers',
        {
          method: 'POST'
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      setResults(data);
      toast({
        title: 'Success',
        description: 'Geospatial layers fetched successfully',
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch geospatial layers';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testGeospatialScore = async (location: { name: string; lat: number; lng: number }) => {
    setTestLoading(true);
    setTestError(null);
    setTestResults(null);

    try {
      console.log(`Testing compute-geospatial-score for ${location.name}...`);
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'compute-geospatial-score',
        {
          body: {
            parcel_id: `test_${Date.now()}`,
            lat: location.lat,
            lng: location.lng
          }
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      setTestResults({ ...data, location: location.name });
      toast({
        title: 'Test Successful',
        description: `Geospatial score computed for ${location.name}`,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to compute geospatial score';
      setTestError(errorMsg);
      toast({
        title: 'Test Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Re-enrich Latest Application */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Re-Enrich Latest Application
          </CardTitle>
          <CardDescription>
            Test the utility enrichment fixes on the most recent application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fetchingApp ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : latestApp ? (
            <>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Application ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{latestApp.id}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-xs">{latestApp.formatted_address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-xs">{latestApp.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enrichment:</span>
                  <span className="text-xs">{latestApp.enrichment_status || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Water Lines:</span>
                  <span className="text-xs">{latestApp.water_lines ? `${latestApp.water_lines.length} lines` : 'NULL'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sewer Lines:</span>
                  <span className="text-xs">{latestApp.sewer_lines ? `${latestApp.sewer_lines.length} lines` : 'NULL'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storm Lines:</span>
                  <span className="text-xs">{latestApp.storm_lines ? `${latestApp.storm_lines.length} lines` : 'NULL'}</span>
                </div>
              </div>

              <Button
                onClick={handleReEnrich}
                disabled={reEnrichLoading}
                size="lg"
                className="w-full"
              >
                {reEnrichLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-enriching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-Enrich This Application
                  </>
                )}
              </Button>

              <Button
                onClick={fetchLatestApplication}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Refresh Application Data
              </Button>
            </>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>No applications found</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test compute-geospatial-score */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Phase 1: Test Geospatial Score Computation
          </CardTitle>
          <CardDescription>
            Test on-demand FEMA queries and geospatial scoring with sample coordinates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Testing:</strong> This will call <code>compute-geospatial-score</code> which invokes <code>query-fema-by-point</code> to fetch real-time FEMA flood data, query TxDOT traffic segments, and compute a geospatial intelligence score.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Test Coordinates:</h3>
            {TEST_COORDINATES.map((location, index) => (
              <Button
                key={index}
                onClick={() => testGeospatialScore(location)}
                disabled={testLoading}
                variant="outline"
                className="w-full justify-start"
              >
                {testLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {location.name} ({location.lat}, {location.lng})
              </Button>
            ))}
          </div>

          {testError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {testResults && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Score computed for {testResults.location}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Geospatial Intelligence Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score Gauge */}
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {testResults.score || testResults.data?.geospatial_score?.overall_geospatial_score || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Geospatial Score</div>
                  </div>

                  {/* Score Components Grid */}
                  {testResults.data?.geospatial_score && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {testResults.data.geospatial_score.jurisdiction_confidence}
                        </div>
                        <div className="text-xs text-center text-muted-foreground mt-1">
                          Jurisdiction Confidence
                        </div>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {testResults.data.geospatial_score.flood_risk_index}
                        </div>
                        <div className="text-xs text-center text-muted-foreground mt-1">
                          Flood Risk Index
                        </div>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-accent/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {testResults.data.geospatial_score.traffic_visibility_index}
                        </div>
                        <div className="text-xs text-center text-muted-foreground mt-1">
                          Traffic Visibility
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scoring Notes */}
                  {testResults.data?.geospatial_score?.scoring_notes && (
                    <Alert>
                      <AlertDescription className="text-sm">
                        {testResults.data.geospatial_score.scoring_notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* FEMA Flood Data with Color-Coded Badge */}
                  {testResults.data?.fema_flood_risk && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">FEMA Flood Risk</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          testResults.data.fema_flood_risk.zone_code === 'X' || testResults.data.fema_flood_risk.zone_code === 'C'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : (testResults.data.fema_flood_risk.zone_code === 'A' || testResults.data.fema_flood_risk.zone_code === 'AE' || testResults.data.fema_flood_risk.zone_code === 'VE')
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          Zone {testResults.data.fema_flood_risk.zone_code}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>In Flood Zone:</strong> {testResults.data.fema_flood_risk.in_flood_zone ? 'Yes' : 'No'}</p>
                        {testResults.data.fema_flood_risk.bfe && (
                          <p><strong>Base Flood Elevation:</strong> {testResults.data.fema_flood_risk.bfe} ft</p>
                        )}
                        <p className="text-muted-foreground text-xs mt-2">
                          {testResults.data.fema_flood_risk.source} • Last updated: {new Date(testResults.data.fema_flood_risk.last_refreshed).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Traffic Data */}
                  {testResults.data?.traffic_exposure && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3">Traffic Exposure</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Roadway:</strong> {testResults.data.traffic_exposure.roadway_name}</p>
                        <p><strong>AADT:</strong> {testResults.data.traffic_exposure.aadt?.toLocaleString()} vehicles/day</p>
                        <p><strong>Distance:</strong> {testResults.data.traffic_exposure.distance_to_segment_ft} ft</p>
                      </div>
                    </div>
                  )}

                  {/* County */}
                  {testResults.data?.county_boundary && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">Jurisdiction</h4>
                      <p className="text-sm">{testResults.data.county_boundary.county_name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk geospatial data loading */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Geospatial Database Management
          </CardTitle>
          <CardDescription>
            Populate the database with county boundaries and TxDOT traffic segments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              This process will fetch data from:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Harris, Fort Bend, and Montgomery County boundaries</li>
                <li>TxDOT traffic segments with AADT data (up to 2,000 segments)</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong>Note:</strong> FEMA flood data is now queried on-demand per parcel using <code>query-fema-by-point</code>.
              </p>
            </AlertDescription>
          </Alert>

          <Button
            onClick={fetchGeospatialLayers}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Geospatial Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Populate Geospatial Database
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {results.message}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Results:</h3>
                {results.results?.map((result: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium capitalize">{result.type}</p>
                          {result.county_name && (
                            <p className="text-sm text-muted-foreground">
                              County: {result.county_name}
                            </p>
                          )}
                          {result.record_count !== undefined && (
                            <p className="text-sm text-muted-foreground">
                              Records: {result.record_count}
                            </p>
                          )}
                          {result.errors !== undefined && result.errors > 0 && (
                            <p className="text-sm text-destructive">
                              Errors: {result.errors}
                            </p>
                          )}
                          {result.source && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Source: {result.source}
                            </p>
                          )}
                        </div>
                        {result.error ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      {result.error && (
                        <p className="text-sm text-destructive mt-2">{result.error}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
