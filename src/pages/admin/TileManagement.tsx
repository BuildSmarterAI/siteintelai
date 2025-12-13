import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useTilesets, useTileJobs, useTilesetFreshness, Tileset, TileJob } from "@/hooks/useTilesets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import TilePreflightCheck from "@/components/admin/TilePreflightCheck";
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  HardDrive,
  ExternalLink,
  Play,
  AlertTriangle,
  Zap,
  Loader2,
  Sprout,
} from "lucide-react";

interface CanonicalCounts {
  parcels: number;
  utilities: number;
  zoning: number;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
        </Badge>
      );
    case "running":
    case "fetching":
    case "tiling":
    case "uploading":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {status}
        </Badge>
      );
    case "error":
    case "failed":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" /> Error
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getFreshnessBadge(tileset: Tileset) {
  if (!tileset.generated_at) {
    return <Badge variant="destructive">Never Generated</Badge>;
  }

  const generatedAt = new Date(tileset.generated_at);
  const refreshHours = tileset.refresh_frequency_hours || 24;
  const ageHours = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);

  if (ageHours < refreshHours) {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Fresh
      </Badge>
    );
  } else if (tileset.expires_at && new Date() > new Date(tileset.expires_at)) {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" /> Expired
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="w-3 h-3 mr-1" /> Stale
      </Badge>
    );
  }
}

export default function TileManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { data: tilesets, isLoading: tilesetsLoading, refetch: refetchTilesets } = useTilesets();
  const { data: tileJobs, isLoading: jobsLoading, refetch: refetchJobs } = useTileJobs({ limit: 20 });
  const freshness = useTilesetFreshness();
  const [triggeringRefresh, setTriggeringRefresh] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const [canonicalCounts, setCanonicalCounts] = useState<CanonicalCounts>({ parcels: 0, utilities: 0, zoning: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  const fetchCanonicalCounts = useCallback(async () => {
    try {
      const [parcelsRes, utilitiesRes, zoningRes] = await Promise.all([
        supabase.from("canonical_parcels").select("id", { count: "exact", head: true }),
        supabase.from("utilities_canonical").select("id", { count: "exact", head: true }),
        supabase.from("zoning_canonical").select("id", { count: "exact", head: true }),
      ]);
      setCanonicalCounts({
        parcels: parcelsRes.count || 0,
        utilities: utilitiesRes.count || 0,
        zoning: zoningRes.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch canonical counts:", err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCanonicalCounts();
  }, [fetchCanonicalCounts]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleSeedData = async () => {
    setSeedingData(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-houston-canonical", {
        body: { layers: ["houston_parcels"] },
      });

      if (error) throw error;

      const inserted = data?.total_inserted || 0;
      toast.success(`Seeded ${inserted} parcel records successfully`);
      await fetchCanonicalCounts();
    } catch (err: any) {
      console.error("Seeding error:", err);
      toast.error("Seeding failed: " + (err.message || "Unknown error"));
    } finally {
      setSeedingData(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchTilesets(), refetchJobs()]);
    toast.success("Data refreshed");
  };

  const handleTriggerGeneration = async () => {
    setTriggeringRefresh(true);
    try {
      // In a real implementation, this would trigger the GitHub Actions workflow
      // via the GitHub API or a webhook endpoint
      toast.info("Tile generation workflow triggered. Check GitHub Actions for progress.", {
        action: {
          label: "View Actions",
          onClick: () => window.open("https://github.com/your-org/siteintel/actions", "_blank"),
        },
      });
    } catch (error) {
      toast.error("Failed to trigger tile generation");
    } finally {
      setTriggeringRefresh(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" />
              Tile Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage vector tile generation pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleTriggerGeneration}
              disabled={triggeringRefresh}
              size="sm"
            >
              {triggeringRefresh ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Generate Tiles
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Active Tilesets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tilesets?.length || 0}</div>
              <p className="text-muted-foreground text-sm">
                {freshness.fresh} fresh, {freshness.stale} stale
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Total Records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tilesets?.reduce((sum, t) => sum + (t.record_count || 0), 0).toLocaleString() || 0}
              </div>
              <p className="text-muted-foreground text-sm">Across all layers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Total Size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatBytes(tilesets?.reduce((sum, t) => sum + (t.size_bytes || 0), 0) || 0)}
              </div>
              <p className="text-muted-foreground text-sm">S3 storage</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Sprout className="w-4 h-4" />
                Canonical Tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {countsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Parcels:</span>
                    <Badge variant={canonicalCounts.parcels > 0 ? "default" : "destructive"} className="font-mono">
                      {canonicalCounts.parcels.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilities:</span>
                    <Badge variant={canonicalCounts.utilities > 0 ? "default" : "secondary"} className="font-mono">
                      {canonicalCounts.utilities.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Zoning:</span>
                    <Badge variant={canonicalCounts.zoning > 0 ? "default" : "secondary"} className="font-mono">
                      {canonicalCounts.zoning.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              )}
              <Button
                onClick={handleSeedData}
                disabled={seedingData}
                size="sm"
                className="w-full mt-3"
                variant={canonicalCounts.parcels === 0 ? "default" : "outline"}
              >
                {seedingData ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                {seedingData ? "Seeding..." : "Seed Parcels"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tilesets Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Active Tilesets</CardTitle>
            <CardDescription>
              Vector tile layers available for map rendering
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tilesetsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tilesets?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Tilesets Found</h3>
                <p className="mb-4 max-w-md mx-auto">
                  Vector tiles are generated from canonical tables. First, run data ingestion to populate source data.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/functions/seed-houston-canonical/logs", "_blank")}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Run Data Ingestion
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTriggerGeneration}
                    disabled={triggeringRefresh}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generate Tiles
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Layer</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Zoom Range</TableHead>
                    <TableHead>Last Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tilesets?.map((tileset) => (
                    <TableRow key={tileset.id}>
                      <TableCell>
                        <div className="font-medium">{tileset.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {tileset.tileset_key}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tileset.jurisdiction.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{tileset.record_count?.toLocaleString() || "—"}</TableCell>
                      <TableCell>{formatBytes(tileset.size_bytes)}</TableCell>
                      <TableCell>
                        z{tileset.min_zoom}–{tileset.max_zoom}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tileset.generated_at
                          ? formatDistanceToNow(new Date(tileset.generated_at), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell>{getFreshnessBadge(tileset)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(
                              tileset.tile_url_template.replace("{z}", "12").replace("{x}", "0").replace("{y}", "0"),
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Tile Jobs</CardTitle>
            <CardDescription>History of tile generation runs</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tileJobs?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Recorded</h3>
                <p className="max-w-md mx-auto">
                  Tile generation jobs will appear here after running the GitHub Actions workflow or triggering manually.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tileset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Tiles</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Triggered By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tileJobs?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.tileset_key}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.job_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.input_records?.toLocaleString() || "—"}</TableCell>
                      <TableCell>{job.output_tiles?.toLocaleString() || "—"}</TableCell>
                      <TableCell>
                        {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {job.triggered_by || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pre-flight Check */}
        <TilePreflightCheck />
      </div>
    </div>
  );
}
