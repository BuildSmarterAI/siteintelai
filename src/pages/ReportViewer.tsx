import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MapCanvas } from "@/components/MapCanvas";
import { Loader2, Download, FileText, MapPin, Zap, Car, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  feasibility_score: number;
  score_band: string;
  json_data: any;
  pdf_url: string | null;
  created_at: string;
  applications: {
    formatted_address: string;
    geo_lat: number;
    geo_lng: number;
    parcel_id: string;
    zoning_code: string;
    floodplain_zone: string;
    traffic_aadt: number | null;
    traffic_year: number | null;
    traffic_road_name: string | null;
    employment_clusters: any | null;
  };
}

export default function ReportViewer() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          applications!reports_application_id_fkey (
            formatted_address,
            geo_lat,
            geo_lng,
            parcel_id,
            zoning_code,
            floodplain_zone,
            traffic_aadt,
            traffic_year,
            traffic_road_name,
            employment_clusters
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  const reportData = report.json_data || {};
  
  // Handle legacy reports with rawText wrapper
  let parsedData = reportData;
  if (reportData.rawText && !reportData.summary) {
    try {
      const stripped = reportData.rawText.replace(/```(?:json)?\s*\n?/g, '').replace(/```$/g, '');
      parsedData = JSON.parse(stripped);
    } catch (e) {
      console.error('Failed to parse legacy rawText format');
    }
  }
  
  const summary = parsedData.summary || {};
  const zoning = parsedData.zoning || {};
  const flood = parsedData.flood || {};
  const utilities = parsedData.utilities || {};
  const environmental = parsedData.environmental || {};
  const traffic = parsedData.traffic || {};
  const marketDemographics = parsedData.market_demographics || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/src/assets/buildsmarter-logo-new.png" alt="BuildSmarter" className="h-12" />
              <div>
                <h1 className="text-2xl font-headline">Feasibility Report</h1>
                <p className="text-sm text-muted-foreground">
                  {report.applications?.formatted_address || 'Property Report'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {report.pdf_url && (
                <Button variant="outline" onClick={() => window.open(report.pdf_url!, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Score Overview */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex justify-center">
                <ScoreCircle score={report.feasibility_score} size="lg" />
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h2 className="text-2xl font-headline mb-2">Executive Summary</h2>
                  <div className="flex gap-2 mb-4">
                    <Badge variant={report.score_band === 'A' ? 'default' : report.score_band === 'B' ? 'secondary' : 'destructive'}>
                      Grade {report.score_band}
                    </Badge>
                    <Badge variant="outline">
                      {new Date(report.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {summary.executive_summary || 'Executive summary not available.'}
                  </p>
                </div>

                {summary.key_opportunities && summary.key_opportunities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Key Opportunities
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_opportunities.map((opp: string, i: number) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.key_risks && summary.key_risks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Key Risks
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_risks.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Map */}
        {report.applications?.geo_lat && report.applications?.geo_lng && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Location & Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapCanvas
                center={[report.applications.geo_lat, report.applications.geo_lng]}
                zoom={13}
                className="h-96 w-full rounded-lg"
                employmentCenters={
                  report.applications.employment_clusters && Array.isArray(report.applications.employment_clusters)
                    ? report.applications.employment_clusters
                        .filter((c: any) => c.lat && c.lng)
                        .map((cluster: any) => ({
                          lat: cluster.lat,
                          lng: cluster.lng,
                          name: cluster.name,
                          jobs: cluster.jobs,
                          distance: cluster.distance,
                          industries: cluster.industries
                        }))
                    : []
                }
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Property Location</span>
                </div>
                {report.applications.employment_clusters && Array.isArray(report.applications.employment_clusters) && report.applications.employment_clusters.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Employment Centers</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="zoning" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="zoning">Zoning</TabsTrigger>
            <TabsTrigger value="flood">Flood Risk</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
            <TabsTrigger value="traffic">Traffic & Access</TabsTrigger>
            <TabsTrigger value="market">Market Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="zoning" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Zoning Analysis</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>Score: {zoning.component_score || 'N/A'}</Badge>
                  {report.applications?.zoning_code && (
                    <Badge variant="outline">{report.applications.zoning_code}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: zoning.verdict || '<p>No zoning analysis available.</p>' }} />
                
                {zoning.permitted_uses && zoning.permitted_uses.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Permitted Uses</h4>
                    <ul>
                      {zoning.permitted_uses.map((use: string, i: number) => (
                        <li key={i}>{use}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flood" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Flood Risk Analysis</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>Score: {flood.component_score || 'N/A'}</Badge>
                  {report.applications?.floodplain_zone && (
                    <Badge variant={report.applications.floodplain_zone === 'X' ? 'default' : 'destructive'}>
                      Zone {report.applications.floodplain_zone}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: flood.verdict || '<p>No flood analysis available.</p>' }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilities Analysis</CardTitle>
                <Badge>Score: {utilities.component_score || 'N/A'}</Badge>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: utilities.verdict || '<p>No utilities analysis available.</p>' }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environmental" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Analysis</CardTitle>
                <Badge>Score: {environmental.component_score || 'N/A'}</Badge>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: environmental.verdict || '<p>No environmental analysis available.</p>' }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Traffic & Access Analysis
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  {traffic.component_score && (
                    <Badge>Score: {traffic.component_score}</Badge>
                  )}
                  {report.applications?.traffic_aadt && (
                    <Badge 
                      variant={
                        report.applications.traffic_aadt > 20000 
                          ? 'default' 
                          : report.applications.traffic_aadt > 10000 
                          ? 'secondary' 
                          : 'outline'
                      }
                    >
                      {report.applications.traffic_aadt.toLocaleString()} AADT
                    </Badge>
                  )}
                  {report.applications?.traffic_road_name && (
                    <Badge variant="outline">{report.applications.traffic_road_name}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.applications?.traffic_aadt ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card className="border-muted">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Daily Traffic</span>
                        </div>
                        <p className="text-2xl font-bold">{report.applications.traffic_aadt.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">vehicles per day</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-muted">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Traffic Level</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {report.applications.traffic_aadt > 20000 
                            ? 'High' 
                            : report.applications.traffic_aadt > 10000 
                            ? 'Medium' 
                            : 'Low'}
                        </p>
                        <p className="text-xs text-muted-foreground">exposure rating</p>
                      </CardContent>
                    </Card>
                    
                    {report.applications?.traffic_year && (
                      <Card className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Data Year</span>
                          </div>
                          <p className="text-2xl font-bold">{report.applications.traffic_year}</p>
                          <p className="text-xs text-muted-foreground">TxDOT traffic count</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                    Traffic data not available for this property
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: traffic.verdict || '<p>Traffic analysis not available. This may be added in future reports.</p>' }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Market Demographics
                </CardTitle>
                {marketDemographics.component_score && (
                  <Badge className="mt-2">Score: {marketDemographics.component_score}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {report.applications?.employment_clusters && 
                 Array.isArray(report.applications.employment_clusters) && 
                 report.applications.employment_clusters.length > 0 ? (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Nearby Employment Centers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.applications.employment_clusters.map((cluster: any, i: number) => (
                        <Card key={i} className="border-muted">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{cluster.name || `Employment Center ${i + 1}`}</h5>
                              <Badge variant="outline" className="text-xs">
                                {cluster.distance ? `${cluster.distance.toFixed(1)} mi` : 'N/A'}
                              </Badge>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                              {cluster.jobs ? cluster.jobs.toLocaleString() : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">jobs available</p>
                            {cluster.industries && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cluster.industries.slice(0, 3).map((industry: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {industry}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                    Employment cluster data not available for this property
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: marketDemographics.verdict || '<p>Market demographics analysis not available. This may be added in future reports.</p>' }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
