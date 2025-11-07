import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiMetadata {
  api: string;
  url: string;
  status: number;
  elapsed_ms: number;
  timestamp: string;
  error?: string;
  error_body?: any;
}

interface DiagnosticResult {
  success: boolean;
  water_lines?: any[];
  sewer_lines?: any[];
  storm_lines?: any[];
  api_metadata?: ApiMetadata[];
  data_flags?: string[];
  error?: string;
}

export default function UtilitiesDiagnostic() {
  const [address, setAddress] = useState('4703 Merwin St, Houston, TX 77027');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // First geocode the address
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-intersection', {
        body: { intersection: address }
      });

      if (geocodeError) throw geocodeError;

      const { lat, lng } = geocodeData;

      // Call enrich-utilities with coordinates
      const { data, error } = await supabase.functions.invoke('enrich-utilities', {
        body: { 
          geo_lat: lat, 
          geo_lng: lng,
          property_address: address 
        }
      });

      if (error) throw error;

      setResult(data);
      toast.success('Diagnostic completed');
    } catch (err) {
      console.error('Diagnostic error:', err);
      toast.error('Diagnostic failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status >= 400 && status < 500) return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Utilities Enrichment Diagnostic Tool</h1>
        <p className="text-muted-foreground">
          Test utilities enrichment for any address and view detailed API call results
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Address</CardTitle>
          <CardDescription>Enter an address to test utilities enrichment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter address (e.g., 4703 Merwin St, Houston, TX 77027)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && runDiagnostic()}
              className="flex-1"
            />
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Run Diagnostic
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Water Lines</div>
                  <div className="text-2xl font-bold">{result.water_lines?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Sewer Lines</div>
                  <div className="text-2xl font-bold">{result.sewer_lines?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Storm Lines</div>
                  <div className="text-2xl font-bold">{result.storm_lines?.length || 0}</div>
                </div>
              </div>

              {result.data_flags && result.data_flags.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Data Flags</div>
                  <div className="flex flex-wrap gap-2">
                    {result.data_flags.map((flag, idx) => (
                      <Badge key={idx} variant="secondary">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Calls */}
          {result.api_metadata && result.api_metadata.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>API Call Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of all API calls made during enrichment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.api_metadata.map((api, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(api.status)}
                          <span className="font-semibold">{api.api}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {api.elapsed_ms}ms
                          </div>
                          <Badge className={getStatusColor(api.status)}>
                            HTTP {api.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">URL</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {api.url}
                          </div>
                        </div>

                        {api.error && (
                          <Alert variant="destructive">
                            <AlertDescription className="text-xs">
                              <div className="font-semibold mb-1">Error:</div>
                              {api.error}
                            </AlertDescription>
                          </Alert>
                        )}

                        {api.error_body && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Error Response Body</div>
                            <pre className="text-xs bg-destructive/10 p-3 rounded overflow-x-auto">
                              {JSON.stringify(api.error_body, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {new Date(api.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparative Analysis */}
          {result.api_metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Comparative Analysis</CardTitle>
                <CardDescription>
                  Compare successful vs failed API calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-green-600 mb-2">✅ Successful APIs</div>
                    {result.api_metadata.filter(a => a.status >= 200 && a.status < 300).map((api, idx) => (
                      <div key={idx} className="text-xs mb-1">
                        • {api.api} ({api.elapsed_ms}ms)
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-600 mb-2">❌ Failed APIs</div>
                    {result.api_metadata.filter(a => a.status >= 400 || a.error).map((api, idx) => (
                      <div key={idx} className="text-xs mb-1">
                        • {api.api} - HTTP {api.status}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
