import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Database, 
  Zap,
  Clock,
  Server
} from "lucide-react";

interface ScraperTestResult {
  success: boolean;
  layer_key: string;
  feature_count: number;
  source: 'direct' | 'scraper' | 'cache';
  response_time_ms: number;
  api_credits_used: number;
  error?: string;
}

interface UsageLogEntry {
  id: string;
  url: string;
  endpoint_type: string;
  scraper_mode: string;
  response_time_ms: number;
  cache_hit: boolean;
  api_credits_used: number;
  response_status: number;
  error_message: string | null;
  created_at: string;
}

interface CacheEntry {
  id: string;
  url_hash: string;
  source_type: string;
  api_credits_used: number;
  expires_at: string;
  created_at: string;
}

const TEST_LAYERS = [
  { key: 'houston_water_lines', name: 'Water Lines', bbox: '-95.375,29.755,-95.365,29.765' },
  { key: 'houston_hcad_parcels', name: 'HCAD Parcels', bbox: '-95.375,29.755,-95.365,29.765' },
];

export function ScraperApiTab() {
  const [usageLogs, setUsageLogs] = useState<UsageLogEntry[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<ScraperTestResult[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch usage logs
      const { data: logs } = await supabase
        .from('scraper_usage_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch cache entries
      const { data: cache } = await supabase
        .from('scraper_cache')
        .select('id, url_hash, source_type, api_credits_used, expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      setUsageLogs(logs || []);
      setCacheEntries(cache || []);
    } catch (error) {
      console.error('Error fetching scraper data:', error);
      toast.error('Failed to load scraper data');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (layerKey: string, bbox: string) => {
    setTesting(layerKey);
    try {
      const { data, error } = await supabase.functions.invoke('scraper-gis-fetch', {
        body: {
          layer_key: layerKey,
          bbox: bbox,
          max_records: 25
        }
      });

      if (error) throw error;

      const result: ScraperTestResult = {
        success: data.success,
        layer_key: layerKey,
        feature_count: data.meta?.feature_count || 0,
        source: data.meta?.source || 'unknown',
        response_time_ms: data.meta?.response_time_ms || 0,
        api_credits_used: data.meta?.api_credits_used || 0,
        error: data.error
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      
      if (data.success) {
        toast.success(`Fetched ${result.feature_count} features via ${result.source}`);
      } else {
        toast.error(data.error || 'Test failed');
      }

      // Refresh data to see new logs
      fetchData();
    } catch (error) {
      console.error('Test error:', error);
      const result: ScraperTestResult = {
        success: false,
        layer_key: layerKey,
        feature_count: 0,
        source: 'direct',
        response_time_ms: 0,
        api_credits_used: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTesting(null);
    }
  };

  // Calculate stats
  const totalCreditsUsed = usageLogs.reduce((sum, log) => sum + (log.api_credits_used || 0), 0);
  const cacheHits = usageLogs.filter(log => log.cache_hit).length;
  const cacheHitRate = usageLogs.length > 0 ? Math.round((cacheHits / usageLogs.length) * 100) : 0;
  const avgResponseTime = usageLogs.length > 0 
    ? Math.round(usageLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / usageLogs.length)
    : 0;
  const successRate = usageLogs.length > 0
    ? Math.round((usageLogs.filter(log => log.response_status >= 200 && log.response_status < 300).length / usageLogs.length) * 100)
    : 0;

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'cache':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cache</Badge>;
      case 'scraper':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Scraper</Badge>;
      case 'direct':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Direct</Badge>;
      default:
        return <Badge variant="secondary">{source}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              API Credits Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCreditsUsed}</div>
            <p className="text-muted-foreground text-sm">Recent requests</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Cache Hit Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cacheHitRate}%</div>
            <p className="text-muted-foreground text-sm">{cacheHits} of {usageLogs.length} requests</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Response Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResponseTime}ms</div>
            <p className="text-muted-foreground text-sm">All sources</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Success Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <p className="text-muted-foreground text-sm">{cacheEntries.length} cached</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Panel */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test ScraperAPI Integration
          </CardTitle>
          <CardDescription>
            Run test fetches against Houston GIS endpoints to verify cache and scraper functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TEST_LAYERS.map(layer => (
              <Button
                key={layer.key}
                variant="outline"
                size="sm"
                onClick={() => runTest(layer.key, layer.bbox)}
                disabled={testing !== null}
              >
                {testing === layer.key ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Test {layer.name}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Test Results</h4>
              <div className="space-y-2">
                {testResults.map((result, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-mono text-sm">{result.layer_key}</span>
                        {getSourceBadge(result.source)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{result.feature_count} features</span>
                        <span>{result.response_time_ms}ms</span>
                        <span>{result.api_credits_used} credits</span>
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-red-400 text-sm mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Log */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Usage Log</CardTitle>
          <CardDescription>Recent ScraperAPI and cache activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : usageLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No usage logs yet. Run a test to generate data.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{getSourceBadge(log.scraper_mode)}</TableCell>
                    <TableCell className="font-mono text-sm">{log.endpoint_type}</TableCell>
                    <TableCell>
                      {log.response_status >= 200 && log.response_status < 300 ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {log.response_status}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <XCircle className="w-3 h-3 mr-1" /> {log.response_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{log.response_time_ms}ms</TableCell>
                    <TableCell>{log.api_credits_used}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cache Entries */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Cache Entries</CardTitle>
          <CardDescription>Cached GIS responses (24h TTL)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : cacheEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No cached entries yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL Hash</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">{entry.url_hash.substring(0, 16)}...</TableCell>
                    <TableCell>{entry.source_type}</TableCell>
                    <TableCell>{entry.api_credits_used}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(entry.expires_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
