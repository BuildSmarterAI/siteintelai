import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MapCanvas } from "@/components/MapCanvas";
import { Loader2, Download, FileText, MapPin, Zap } from "lucide-react";
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
          applications!application_id (
            formatted_address,
            geo_lat,
            geo_lng,
            parcel_id,
            zoning_code,
            floodplain_zone
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
  const summary = reportData.summary || {};
  const zoning = reportData.zoning || {};
  const flood = reportData.flood || {};
  const utilities = reportData.utilities || {};
  const environmental = reportData.environmental || {};

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
                Property Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapCanvas
                center={[report.applications.geo_lat, report.applications.geo_lng]}
                zoom={15}
                className="h-96 w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="zoning" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="zoning">Zoning</TabsTrigger>
            <TabsTrigger value="flood">Flood Risk</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
}
