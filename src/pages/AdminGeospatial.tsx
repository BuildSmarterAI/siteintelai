import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminGeospatial() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Geospatial Database Management
          </CardTitle>
          <CardDescription>
            Populate the database with FEMA flood zones, TxDOT traffic segments, and county boundaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              This process will fetch data from:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Harris, Fort Bend, and Montgomery County boundaries</li>
                <li>FEMA National Flood Hazard Layer (up to 2,000 zones)</li>
                <li>TxDOT traffic segments with AADT data (up to 2,000 segments)</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                This operation takes approximately 2-3 minutes to complete.
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
