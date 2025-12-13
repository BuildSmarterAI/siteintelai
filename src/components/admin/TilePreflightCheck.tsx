import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Globe,
  Key,
  ArrowRight,
  Loader2,
  Copy,
} from "lucide-react";

interface LayerCheck {
  layer: string;
  table: string;
  record_count: number;
  has_geometry: boolean;
  ready_for_tiles: boolean;
  issues: string[];
}

interface PreflightResult {
  timestamp: string;
  overall_ready: boolean;
  layers: LayerCheck[];
  cdn_status: {
    url: string;
    reachable: boolean;
    error?: string;
  };
  github_secrets_checklist: {
    name: string;
    description: string;
    required: boolean;
  }[];
  next_steps: string[];
}

export default function TilePreflightCheck() {
  const [isRunning, setIsRunning] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tile-preflight-check"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("tile-preflight-check");
      if (error) throw error;
      return data as PreflightResult;
    },
    enabled: false, // Only run when triggered
    staleTime: 0,
  });

  const handleRunCheck = async () => {
    setIsRunning(true);
    try {
      await refetch();
      toast.success("Pre-flight check complete");
    } catch (err: any) {
      toast.error("Check failed: " + (err.message || "Unknown error"));
    } finally {
      setIsRunning(false);
    }
  };

  const copyGithubCommand = () => {
    navigator.clipboard.writeText("gh workflow run generate-tiles.yml");
    toast.success("Command copied to clipboard");
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Tile Generation Pre-flight Check
            </CardTitle>
            <CardDescription>
              Verify data readiness before running tile generation pipeline
            </CardDescription>
          </div>
          <Button onClick={handleRunCheck} disabled={isRunning || isLoading} size="sm">
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Run Check
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Click "Run Check" to verify tile generation readiness</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              {data.overall_ready ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
              <div>
                <div className="font-semibold">
                  {data.overall_ready ? "Ready for Tile Generation" : "Action Required"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.layers.filter((l) => l.ready_for_tiles).length} of {data.layers.length} layers ready
                </div>
              </div>
            </div>

            {/* Layer Status */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Canonical Layers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.layers.map((layer) => (
                  <div
                    key={layer.layer}
                    className={`p-3 rounded-lg border ${
                      layer.ready_for_tiles
                        ? "border-green-500/30 bg-green-500/5"
                        : layer.record_count > 0
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{layer.layer}</span>
                      {layer.ready_for_tiles ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                        </Badge>
                      ) : layer.record_count > 0 ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Issues
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" /> Empty
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Records: {layer.record_count.toLocaleString()}</div>
                      <div>Geometry: {layer.has_geometry ? "✓" : "✗"}</div>
                      {layer.issues.length > 0 && (
                        <div className="text-xs text-yellow-500 mt-1">
                          {layer.issues[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CDN Status */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                CDN Status
              </h4>
              <div
                className={`p-3 rounded-lg border ${
                  data.cdn_status.reachable
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  {data.cdn_status.reachable ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-mono text-sm">{data.cdn_status.url}</span>
                </div>
                {data.cdn_status.error && (
                  <div className="text-sm text-red-400 mt-1">{data.cdn_status.error}</div>
                )}
              </div>
            </div>

            {/* GitHub Secrets Checklist */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Required GitHub Secrets
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.github_secrets_checklist.map((secret) => (
                  <div key={secret.name} className="flex items-start gap-2 text-sm">
                    <Badge
                      variant={secret.required ? "default" : "secondary"}
                      className="font-mono text-xs shrink-0"
                    >
                      {secret.name}
                    </Badge>
                    <span className="text-muted-foreground">{secret.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            {data.next_steps.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Next Steps
                </h4>
                <ul className="space-y-2 text-sm">
                  {data.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                {data.overall_ready && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-background rounded font-mono text-sm flex-1">
                        gh workflow run generate-tiles.yml
                      </code>
                      <Button size="sm" variant="outline" onClick={copyGithubCommand}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground text-right">
              Last checked: {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
