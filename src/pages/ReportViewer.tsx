import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MapCanvas } from "@/components/MapCanvas";
import { Loader2, Download, FileText, MapPin, Zap, Car, Users, TrendingUp, Building2 } from "lucide-react";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSourcesSidebar } from "@/components/DataSourcesSidebar";

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
    updated_at?: string;
    // Project Intent fields
    project_type?: string[] | null;
    building_size_value?: number | null;
    building_size_unit?: string | null;
    stories_height?: string | null;
    desired_budget?: number | null;
    prototype_requirements?: string | null;
    quality_level?: string | null;
    tenant_requirements?: string | null;
    access_priorities?: string[] | null;
    known_risks?: string[] | null;
    utility_access?: string[] | null;
    environmental_constraints?: string[] | null;
    // Valuation fields
    tot_appr_val?: number | null;
    tot_market_val?: number | null;
    land_val?: number | null;
    imprv_val?: number | null;
    taxable_value?: number | null;
    // Building characteristics
    bldg_sqft?: number | null;
    year_built?: number | null;
    effective_yr?: number | null;
    num_stories?: number | null;
    state_class?: string | null;
    prop_type?: string | null;
    land_use_code?: string | null;
    // Location details
    subdivision?: string | null;
    block?: string | null;
    lot?: string | null;
    exemption_code?: string | null;
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
            employment_clusters,
            project_type,
            building_size_value,
            building_size_unit,
            stories_height,
            desired_budget,
            prototype_requirements,
            quality_level,
            tenant_requirements,
            access_priorities,
            known_risks,
            utility_access,
            environmental_constraints,
            tot_appr_val,
            tot_market_val,
            land_val,
            imprv_val,
            taxable_value,
            bldg_sqft,
            year_built,
            effective_yr,
            num_stories,
            state_class,
            prop_type,
            land_use_code,
            subdivision,
            block,
            lot,
            updated_at
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
  const dataSources = parsedData.data_sources || [];
  
  // Helper to get data sources for a specific section
  const getSourcesForSection = (section: string) => {
    return dataSources.filter((ds: any) => ds.section === section);
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Score Overview */}
            <Card>
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

        {/* ⭐ NEW: Property Valuation Card */}
        {(report.applications?.tot_appr_val || report.applications?.bldg_sqft) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Valuation & Building Characteristics
              </CardTitle>
              <DataSourceBadge 
                datasetName="HCAD Official Assessment" 
                timestamp={report.applications.updated_at || report.created_at}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valuation Section */}
                {report.applications?.tot_appr_val && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Property Valuation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {report.applications.tot_appr_val && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Total Appraised</p>
                          <p className="text-2xl font-bold text-primary">
                            ${Number(report.applications.tot_appr_val).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {report.applications.tot_market_val && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Market Value</p>
                          <p className="text-2xl font-bold">
                            ${Number(report.applications.tot_market_val).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {report.applications.land_val && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Land Value</p>
                          <p className="text-xl font-semibold">
                            ${Number(report.applications.land_val).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {report.applications.imprv_val && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Improvements</p>
                          <p className="text-xl font-semibold">
                            ${Number(report.applications.imprv_val).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {report.applications.taxable_value && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground uppercase">Taxable Value</p>
                        <p className="text-lg font-semibold">
                          ${Number(report.applications.taxable_value).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Building Characteristics Section */}
                {report.applications?.bldg_sqft && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Building Details</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      {report.applications.bldg_sqft && (
                        <>
                          <dt className="text-muted-foreground">Building Area:</dt>
                          <dd className="font-semibold">{Number(report.applications.bldg_sqft).toLocaleString()} SF</dd>
                        </>
                      )}
                      {report.applications.year_built && (
                        <>
                          <dt className="text-muted-foreground">Year Built:</dt>
                          <dd className="font-semibold">{report.applications.year_built}</dd>
                        </>
                      )}
                      {report.applications.effective_yr && (
                        <>
                          <dt className="text-muted-foreground">Effective Year:</dt>
                          <dd className="font-semibold">{report.applications.effective_yr}</dd>
                        </>
                      )}
                      {report.applications.num_stories && (
                        <>
                          <dt className="text-muted-foreground">Stories:</dt>
                          <dd className="font-semibold">{report.applications.num_stories}</dd>
                        </>
                      )}
                      {report.applications.state_class && (
                        <>
                          <dt className="text-muted-foreground">Classification:</dt>
                          <dd className="font-semibold">{report.applications.state_class}</dd>
                        </>
                      )}
                      {report.applications.prop_type && (
                        <>
                          <dt className="text-muted-foreground">Property Type:</dt>
                          <dd className="font-semibold">{report.applications.prop_type}</dd>
                        </>
                      )}
                    </dl>
                    
                    {/* Legal Description */}
                    {(report.applications.subdivision || report.applications.block || report.applications.lot) && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Legal Description</p>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {report.applications.subdivision && (
                            <>
                              <dt className="text-muted-foreground">Subdivision:</dt>
                              <dd className="font-medium">{report.applications.subdivision}</dd>
                            </>
                          )}
                          {report.applications.block && (
                            <>
                              <dt className="text-muted-foreground">Block:</dt>
                              <dd className="font-medium">{report.applications.block}</dd>
                            </>
                          )}
                          {report.applications.lot && (
                            <>
                              <dt className="text-muted-foreground">Lot:</dt>
                              <dd className="font-medium">{report.applications.lot}</dd>
                            </>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ⭐ NEW: Proposed Development Card */}
        {report.applications?.project_type && report.applications.project_type.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Proposed Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Project Types</p>
                  <div className="flex flex-wrap gap-2">
                    {report.applications.project_type.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {(report.applications.building_size_value || report.applications.desired_budget) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {report.applications.building_size_value && (
                      <div>
                        <p className="text-sm text-muted-foreground">Building Size</p>
                        <p className="text-xl font-bold mt-1">
                          {Number(report.applications.building_size_value).toLocaleString()} {report.applications.building_size_unit || 'SF'}
                        </p>
                      </div>
                    )}
                    {report.applications.stories_height && (
                      <div>
                        <p className="text-sm text-muted-foreground">Stories</p>
                        <p className="text-xl font-bold mt-1">{report.applications.stories_height}</p>
                      </div>
                    )}
                    {report.applications.desired_budget && (
                      <div>
                        <p className="text-sm text-muted-foreground">Development Budget</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          ${Number(report.applications.desired_budget).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(report.applications.prototype_requirements || report.applications.quality_level || report.applications.tenant_requirements) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t text-sm">
                    {report.applications.prototype_requirements && (
                      <div>
                        <p className="text-muted-foreground">Prototype Requirements:</p>
                        <p className="font-medium">{report.applications.prototype_requirements}</p>
                      </div>
                    )}
                    {report.applications.quality_level && (
                      <div>
                        <p className="text-muted-foreground">Quality Level:</p>
                        <p className="font-medium">{report.applications.quality_level}</p>
                      </div>
                    )}
                    {report.applications.tenant_requirements && (
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">Tenant Requirements:</p>
                        <p className="font-medium">{report.applications.tenant_requirements}</p>
                      </div>
                    )}
                  </div>
                )}

                {(report.applications.access_priorities || report.applications.known_risks || report.applications.utility_access || report.applications.environmental_constraints) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t text-sm">
                    {report.applications.access_priorities && report.applications.access_priorities.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Access Priorities:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.access_priorities.map((priority: string) => (
                            <Badge key={priority} variant="outline" className="text-xs">
                              {priority.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.applications.known_risks && report.applications.known_risks.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Known Risks:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.known_risks.map((risk: string) => (
                            <Badge key={risk} variant="outline" className="text-xs">
                              {risk.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.applications.utility_access && report.applications.utility_access.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Required Utilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.utility_access.map((utility: string) => (
                            <Badge key={utility} variant="outline" className="text-xs">
                              {utility.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.applications.environmental_constraints && report.applications.environmental_constraints.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Environmental Constraints:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.environmental_constraints.map((constraint: string) => (
                            <Badge key={constraint} variant="outline" className="text-xs">
                              {constraint.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ⭐ NEW: Project Feasibility Analysis Card */}
        {report.json_data?.project_feasibility && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Feasibility Analysis</CardTitle>
              {report.json_data.project_feasibility.component_score && (
                <Badge className="mt-2">
                  Score: {report.json_data.project_feasibility.component_score}/100
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.json_data.project_feasibility.verdict && (
                  <div 
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: report.json_data.project_feasibility.verdict 
                    }} 
                  />
                )}
                
                {report.json_data.project_feasibility.zoning_compliance && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Zoning Compliance:</span>
                    <Badge variant={
                      report.json_data.project_feasibility.zoning_compliance === 'permitted' ? 'default' :
                      report.json_data.project_feasibility.zoning_compliance === 'conditional' ? 'secondary' :
                      'destructive'
                    }>
                      {report.json_data.project_feasibility.zoning_compliance?.toUpperCase().replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}

                {report.json_data.project_feasibility.use_specific_insights && report.json_data.project_feasibility.use_specific_insights.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm">Use-Specific Insights:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {report.json_data.project_feasibility.use_specific_insights.map((insight: string, i: number) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.json_data.project_feasibility.budget_analysis && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Budget Analysis:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {report.json_data.project_feasibility.budget_analysis.estimated_hard_costs && (
                        <div>
                          <p className="text-muted-foreground">Hard Costs:</p>
                          <p className="font-semibold">${Number(report.json_data.project_feasibility.budget_analysis.estimated_hard_costs).toLocaleString()}</p>
                        </div>
                      )}
                      {report.json_data.project_feasibility.budget_analysis.estimated_soft_costs && (
                        <div>
                          <p className="text-muted-foreground">Soft Costs:</p>
                          <p className="font-semibold">${Number(report.json_data.project_feasibility.budget_analysis.estimated_soft_costs).toLocaleString()}</p>
                        </div>
                      )}
                      {report.json_data.project_feasibility.budget_analysis.budget_adequacy && (
                        <div>
                          <p className="text-muted-foreground">Budget Status:</p>
                          <Badge variant={
                            report.json_data.project_feasibility.budget_analysis.budget_adequacy === 'adequate' ? 'default' :
                            report.json_data.project_feasibility.budget_analysis.budget_adequacy === 'tight' ? 'secondary' :
                            'destructive'
                          }>
                            {report.json_data.project_feasibility.budget_analysis.budget_adequacy?.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>Score: {zoning.component_score || 'N/A'}</Badge>
                  {report.applications?.zoning_code && (
                    <Badge variant="outline">{report.applications.zoning_code}</Badge>
                  )}
                  {getSourcesForSection('zoning').map((source: any, idx: number) => (
                    <DataSourceBadge
                      key={idx}
                      datasetName={source.dataset_name}
                      timestamp={source.timestamp}
                      endpointUrl={source.endpoint_url}
                    />
                  ))}
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
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>Score: {flood.component_score || 'N/A'}</Badge>
                  {report.applications?.floodplain_zone && (
                    <Badge variant={report.applications.floodplain_zone === 'X' ? 'default' : 'destructive'}>
                      Zone {report.applications.floodplain_zone}
                    </Badge>
                  )}
                  {getSourcesForSection('flood').map((source: any, idx: number) => (
                    <DataSourceBadge
                      key={idx}
                      datasetName={source.dataset_name}
                      timestamp={source.timestamp}
                      endpointUrl={source.endpoint_url}
                    />
                  ))}
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
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>Score: {utilities.component_score || 'N/A'}</Badge>
                  {getSourcesForSection('utilities').map((source: any, idx: number) => (
                    <DataSourceBadge
                      key={idx}
                      datasetName={source.dataset_name}
                      timestamp={source.timestamp}
                      endpointUrl={source.endpoint_url}
                    />
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>Score: {environmental.component_score || 'N/A'}</Badge>
                  {getSourcesForSection('environmental').map((source: any, idx: number) => (
                    <DataSourceBadge
                      key={idx}
                      datasetName={source.dataset_name}
                      timestamp={source.timestamp}
                      endpointUrl={source.endpoint_url}
                    />
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {traffic.component_score && (
                    <Badge>Score: {traffic.component_score}</Badge>
                  )}
                  {getSourcesForSection('traffic').map((source: any, idx: number) => (
                    <DataSourceBadge
                      key={idx}
                      datasetName={source.dataset_name}
                      timestamp={source.timestamp}
                      endpointUrl={source.endpoint_url}
                    />
                  ))}
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
      </div>

      {/* Data Sources Sidebar */}
      <div className="lg:col-span-1">
        <DataSourcesSidebar dataSources={dataSources} />
      </div>
    </div>
  </main>
    </div>
  );
}
