import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MapCanvas } from "@/components/MapCanvas";
import { Loader2, Download, FileText, MapPin, Zap, Car, Users, TrendingUp, Building2, Clock, DollarSign, Wifi, Landmark } from "lucide-react";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSourcesSidebar } from "@/components/DataSourcesSidebar";
import { ReportPreviewGate } from "@/components/ReportPreviewGate";

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
    // Cost & Schedule fields
    costs_output?: string | null;
    schedule_output?: string | null;
    // Tax & Incentives fields
    tax_rate_total?: number | null;
    taxing_jurisdictions?: any | null;
    opportunity_zone?: boolean | null;
    enterprise_zone?: boolean | null;
    foreign_trade_zone?: boolean | null;
    mud_district?: string | null;
    etj_provider?: string | null;
    // Infrastructure fields
    power_kv_nearby?: number | null;
    fiber_available?: boolean | null;
    broadband_providers?: any | null;
    distance_highway_ft?: number | null;
    distance_transit_ft?: number | null;
    // HCAD Owner field (existing)
    parcel_owner?: string | null;
    // Phase 1: New HCAD fields
    acct_num?: string | null;
    legal_dscr_1?: string | null;
    legal_dscr_2?: string | null;
    legal_dscr_3?: string | null;
    legal_dscr_4?: string | null;
    bldg_style_cd?: string | null;
    ag_use?: boolean | null;
    homestead?: boolean | null;
    // Phase 1: New FEMA fields
    fema_firm_panel?: string | null;
    base_flood_elevation?: number | null;
    base_flood_elevation_source?: string | null;
  };
}

export default function ReportViewer() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (reportId) {
      checkAuthAndFetchReport();
    }
  }, [reportId]);

  const checkAuthAndFetchReport = async () => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    const authenticated = !!session?.user;
    setIsAuthenticated(authenticated);

    await fetchReport(session?.user?.id);
  };

  const fetchReport = async (userId?: string) => {
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
            exemption_code,
            costs_output,
            schedule_output,
            tax_rate_total,
            taxing_jurisdictions,
            opportunity_zone,
            enterprise_zone,
            foreign_trade_zone,
            mud_district,
            etj_provider,
            power_kv_nearby,
            fiber_available,
            broadband_providers,
            distance_highway_ft,
            distance_transit_ft,
            parcel_owner,
            acct_num,
            legal_dscr_1,
            legal_dscr_2,
            legal_dscr_3,
            legal_dscr_4,
            bldg_style_cd,
            ag_use,
            homestead,
            fema_firm_panel,
            base_flood_elevation,
            base_flood_elevation_source,
            updated_at,
            user_id
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);

      // Check ownership if authenticated
      if (userId && data.applications?.user_id) {
        const owner = data.applications.user_id === userId;
        setIsOwner(owner);
        // Show gate if not authenticated or not owner
        setShowGate(!userId || !owner);
      } else {
        // No user_id on application means it's anonymous - show gate for non-auth users
        setShowGate(!userId);
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowGate(false);
    checkAuthAndFetchReport();
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
      {/* Show auth gate overlay if needed */}
      {showGate && reportId && (
        <ReportPreviewGate reportId={reportId} onAuthSuccess={handleAuthSuccess} />
      )}
      
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
      <main className={`container mx-auto px-6 py-8 ${showGate ? 'blur-sm pointer-events-none' : ''}`}>
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

        {/* ⭐ PHASE 1: Property Owner & Account Information Card */}
        {(report.applications?.parcel_owner || report.applications?.parcel_id) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Property Owner & Account Information
              </CardTitle>
              <DataSourceBadge 
                datasetName="HCAD Official Records" 
                timestamp={report.applications.updated_at || report.created_at}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.applications.parcel_owner && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Property Owner</p>
                    <p className="font-semibold text-lg">{report.applications.parcel_owner}</p>
                  </div>
                )}
                {report.applications.parcel_id && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Parcel ID</p>
                    <p className="font-mono font-semibold">{report.applications.parcel_id}</p>
                  </div>
                )}
                {report.applications.acct_num && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Account Number</p>
                    <p className="font-mono font-semibold">{report.applications.acct_num}</p>
                  </div>
                )}
              </div>
              
              {/* Legal Description */}
              {(report.applications.legal_dscr_1 || report.applications.legal_dscr_2 || 
                report.applications.legal_dscr_3 || report.applications.legal_dscr_4) && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Legal Description</p>
                  <p className="text-sm leading-relaxed">
                    {[
                      report.applications.legal_dscr_1,
                      report.applications.legal_dscr_2,
                      report.applications.legal_dscr_3,
                      report.applications.legal_dscr_4
                    ].filter(Boolean).join(' ')}
                  </p>
                </div>
              )}
              
              {/* Tax Exemptions */}
              {(report.applications.ag_use || report.applications.homestead) && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Tax Exemptions</p>
                  <div className="flex flex-wrap gap-2">
                    {report.applications.ag_use && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        🌾 Agricultural Use Exemption
                      </Badge>
                    )}
                    {report.applications.homestead && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                        🏠 Homestead Exemption
                      </Badge>
                    )}
                  </div>
                </div>
              )}
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
                    
                    {/* ⭐ PHASE 2: Enhanced Legal Description */}
                    {(report.applications.subdivision || report.applications.block || report.applications.lot) && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Legal Description</p>
                        
                        {/* Structured Legal Components */}
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

        {/* ⭐ NEW: Tax & Incentives Card - PHASE 2 */}
        {(report.applications?.tax_rate_total || report.applications?.taxing_jurisdictions || 
          report.applications?.opportunity_zone || report.applications?.enterprise_zone || 
          report.applications?.foreign_trade_zone || report.applications?.mud_district) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Tax & Incentives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tax Rate Section */}
                {report.applications?.tax_rate_total && (
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-3xl font-bold text-primary">
                        {(report.applications.tax_rate_total * 100).toFixed(4)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Total Tax Rate</p>
                    </div>
                    
                    {/* Tax Breakdown */}
                    {report.applications?.taxing_jurisdictions && Array.isArray(report.applications.taxing_jurisdictions) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                        {report.applications.taxing_jurisdictions.map((jurisdiction: any, i: number) => (
                          <div key={i}>
                            <p className="text-xs text-muted-foreground">{jurisdiction.name || 'N/A'}</p>
                            <p className="font-semibold">
                              {jurisdiction.rate ? `${(jurisdiction.rate * 100).toFixed(4)}%` : 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Special Zones & Districts */}
                {(report.applications?.opportunity_zone || report.applications?.enterprise_zone || 
                  report.applications?.foreign_trade_zone || report.applications?.mud_district || 
                  report.applications?.etj_provider) && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Special Designations</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.applications.opportunity_zone && (
                        <Badge variant="default" className="bg-green-600">
                          <Zap className="h-3 w-3 mr-1" />
                          Opportunity Zone
                        </Badge>
                      )}
                      {report.applications.enterprise_zone && (
                        <Badge variant="default" className="bg-blue-600">
                          Enterprise Zone
                        </Badge>
                      )}
                      {report.applications.foreign_trade_zone && (
                        <Badge variant="default" className="bg-purple-600">
                          Foreign Trade Zone
                        </Badge>
                      )}
                      {report.applications.mud_district && (
                        <Badge variant="secondary">
                          MUD: {report.applications.mud_district}
                        </Badge>
                      )}
                      {report.applications.etj_provider && (
                        <Badge variant="outline">
                          ETJ: {report.applications.etj_provider}
                        </Badge>
                      )}
                    </div>
                    
                    {report.applications.exemption_code && (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Exemption Code: </span>
                        <span className="font-medium">{report.applications.exemption_code}</span>
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

        {/* ⭐ NEW: Cost & Timeline Card - PHASE 1 */}
        {(report.json_data?.cost_schedule || report.applications?.costs_output || report.applications?.schedule_output) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cost & Timeline Analysis
              </CardTitle>
              {report.json_data?.cost_schedule?.component_score && (
                <Badge className="mt-2">
                  Score: {report.json_data.cost_schedule.component_score}/100
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline Section */}
                {report.json_data?.cost_schedule?.estimated_timeline_months && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Timeline</span>
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        {report.json_data.cost_schedule.estimated_timeline_months}
                      </p>
                      <p className="text-xs text-muted-foreground">months estimated</p>
                    </div>
                    
                    {report.json_data?.cost_schedule?.permitting_complexity && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Complexity</span>
                        </div>
                        <Badge variant={
                          report.json_data.cost_schedule.permitting_complexity === 'low' ? 'default' :
                          report.json_data.cost_schedule.permitting_complexity === 'moderate' ? 'secondary' :
                          'destructive'
                        } className="text-lg">
                          {report.json_data.cost_schedule.permitting_complexity?.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">permitting level</p>
                      </div>
                    )}
                    
                    {report.applications?.desired_budget && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Project Budget</span>
                        </div>
                        <p className="text-2xl font-bold">
                          ${(report.applications.desired_budget / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">development budget</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Critical Path Items */}
                {report.json_data?.cost_schedule?.critical_path_items && report.json_data.cost_schedule.critical_path_items.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      Critical Path Items
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {report.json_data.cost_schedule.critical_path_items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Analysis Output */}
                {(report.applications?.schedule_output || report.applications?.costs_output) && (
                  <div className="pt-4 border-t">
                    {report.applications.schedule_output && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-sm">Schedule Analysis:</h4>
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: report.applications.schedule_output }}
                        />
                      </div>
                    )}
                    {report.applications.costs_output && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Cost Analysis:</h4>
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: report.applications.costs_output }}
                        />
                      </div>
                    )}
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
              <CardContent className="space-y-4">
                {/* Base Flood Elevation (BFE) */}
                {report.applications?.base_flood_elevation && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <TrendingUp className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Base Flood Elevation (BFE)</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {report.applications.base_flood_elevation} ft NAVD88
                        </p>
                        {report.applications.base_flood_elevation_source && (
                          <p className="text-xs text-blue-600 mt-1">
                            Source: {report.applications.base_flood_elevation_source}
                          </p>
                        )}
                        {report.applications.fema_firm_panel && (
                          <p className="text-xs text-muted-foreground mt-1">
                            FIRM Panel: {report.applications.fema_firm_panel}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: flood.verdict || '<p>No flood analysis available.</p>' }} />
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
              <CardContent className="space-y-6">
                {/* ⭐ NEW: Infrastructure & Connectivity Section - PHASE 3 */}
                {(report.applications?.power_kv_nearby || report.applications?.fiber_available || 
                  report.applications?.broadband_providers || report.applications?.distance_highway_ft || 
                  report.applications?.distance_transit_ft) && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Infrastructure & Connectivity
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {report.applications.power_kv_nearby && (
                        <div className="p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-muted-foreground">Power</span>
                          </div>
                          <p className="text-xl font-bold">{report.applications.power_kv_nearby} kV</p>
                          <p className="text-xs text-muted-foreground">nearby capacity</p>
                        </div>
                      )}
                      
                      {typeof report.applications.fiber_available === 'boolean' && (
                        <div className="p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <Wifi className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Fiber Optic</span>
                          </div>
                          <Badge variant={report.applications.fiber_available ? 'default' : 'secondary'}>
                            {report.applications.fiber_available ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                      )}
                      
                      {report.applications.distance_highway_ft && (
                        <div className="p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Highway Access</span>
                          </div>
                          <p className="text-xl font-bold">
                            {(report.applications.distance_highway_ft / 5280).toFixed(2)} mi
                          </p>
                          <p className="text-xs text-muted-foreground">to nearest highway</p>
                        </div>
                      )}
                      
                      {report.applications.distance_transit_ft && (
                        <div className="p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Transit Access</span>
                          </div>
                          <p className="text-xl font-bold">
                            {(report.applications.distance_transit_ft / 5280).toFixed(2)} mi
                          </p>
                          <p className="text-xs text-muted-foreground">to transit stop</p>
                        </div>
                      )}
                      
                      {report.applications.broadband_providers && Array.isArray(report.applications.broadband_providers) && report.applications.broadband_providers.length > 0 && (
                        <div className="p-3 bg-background rounded border md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Wifi className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Broadband Providers</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {report.applications.broadband_providers.map((provider: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {typeof provider === 'string' ? provider : provider.name || `Provider ${i + 1}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Original Utilities Analysis */}
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: utilities.verdict || '<p>No utilities analysis available.</p>' }} />
                </div>
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
