import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MapCanvas } from "@/components/MapCanvas";
import { Loader2, Download, FileText, MapPin, Zap, Car, Users, TrendingUp, Building2, Clock, DollarSign, Wifi, Landmark, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSourcesSidebar } from "@/components/DataSourcesSidebar";
import { ReportPreviewGate } from "@/components/ReportPreviewGate";

interface Report {
  id: string;
  application_id: string;
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
    truck_percent: number | null;
    congestion_level: string | null;
    traffic_direction: string | null;
    traffic_map_url: string | null;
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
    // Phase 2: Environmental fields
    wetlands_type?: string | null;
    soil_series?: string | null;
    soil_drainage_class?: string | null;
    soil_slope_percent?: number | null;
    environmental_sites?: any;
    historical_flood_events?: any;
    // Lot size fields
    lot_size_value?: number | null;
    lot_size_unit?: string | null;
    // Permitting fields
    average_permit_time_months?: number | null;
    city?: string | null;
    county?: string | null;
    // Market demographics - drive time
    drive_time_15min_population?: number | null;
    drive_time_30min_population?: number | null;
    population_1mi?: number | null;
    population_3mi?: number | null;
    population_5mi?: number | null;
    growth_rate_5yr?: number | null;
    median_income?: number | null;
    households_5mi?: number | null;
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
  const [showPreview, setShowPreview] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (reportId) {
      checkAuthAndFetchReport();
    }
  }, [reportId]);

  // Poll for PDF generation status
  useEffect(() => {
    if (!report || report.pdf_url) return;

    setPdfGenerating(true);
    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('pdf_url, status')
        .eq('id', reportId)
        .single();

      if (data?.pdf_url) {
        setReport(prev => prev ? { ...prev, pdf_url: data.pdf_url } : null);
        setPdfGenerating(false);
        clearInterval(pollInterval);
        toast.success('PDF is ready for download');
      } else if (data?.status === 'error') {
        setPdfGenerating(false);
        setPdfError(true);
        clearInterval(pollInterval);
      }
    }, 5000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setPdfGenerating(false);
      setPdfError(true);
    }, 300000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [report?.pdf_url, reportId]);

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
            truck_percent,
            congestion_level,
            traffic_direction,
            traffic_map_url,
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
            wetlands_type,
            soil_series,
            soil_drainage_class,
            soil_slope_percent,
            environmental_sites,
            historical_flood_events,
            lot_size_value,
            lot_size_unit,
            average_permit_time_months,
            city,
            county,
            drive_time_15min_population,
            drive_time_30min_population,
            population_1mi,
            population_3mi,
            population_5mi,
            growth_rate_5yr,
            median_income,
            households_5mi,
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
        // Show preview for non-authenticated or non-owner users
        setShowPreview(!userId || !owner);
        setShowGate(false); // Don't show gate modal immediately
      } else {
        // No user_id on application means it's anonymous - show preview
        setShowPreview(!userId);
        setShowGate(false);
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
    setShowPreview(false);
    checkAuthAndFetchReport();
    toast.success('Welcome! Full report unlocked');
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
              <img src="/src/assets/buildsmarter-logo-small.png" alt="SiteIntel" className="h-12" />
              <div>
                <h1 className="text-2xl font-headline">Feasibility Report</h1>
                <p className="text-sm text-muted-foreground">
                  {report.applications?.formatted_address || 'Property Report'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pdfGenerating && (
                <Button variant="outline" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </Button>
              )}
              {!pdfGenerating && report.pdf_url && (
                <Button variant="outline" onClick={() => window.open(report.pdf_url!, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              {!pdfGenerating && !report.pdf_url && pdfError && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setPdfError(false);
                    setPdfGenerating(true);
                    try {
                      await supabase.functions.invoke('generate-pdf', {
                        body: { report_id: reportId, application_id: report.application_id }
                      });
                      toast.success('PDF generation restarted');
                    } catch (error) {
                      toast.error('Failed to regenerate PDF');
                      setPdfError(true);
                      setPdfGenerating(false);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Retry PDF Generation
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
        {/* Limited Preview Section - shown when not authenticated */}
        {showPreview && !showGate && (
          <div className="space-y-8">
            {/* Score Preview - Fully Visible */}
            <div className="text-center">
              <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
                🔓 Quick Preview - Sign in for full access
              </Badge>
              
              <ScoreCircle 
                score={report.feasibility_score ?? 0} 
                size="lg" 
                showLabel={true}
              />
              
              {!report.feasibility_score && (
                <Badge variant="destructive" className="mt-2">
                  Score calculation pending
                </Badge>
              )}
              
              <p className="text-sm text-muted-foreground mt-4">
                {report.applications?.formatted_address}
              </p>
            </div>

            {/* Executive Summary Teaser - First 2-3 bullets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {summary.key_opportunities && summary.key_opportunities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Key Opportunities
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_opportunities.slice(0, 2).map((opp: string, i: number) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.key_risks && summary.key_risks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Key Risks
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_risks.slice(0, 2).map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Blur gradient overlay on preview */}
                <div className="relative mt-6 p-6 border rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10 rounded-lg flex items-center justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => setShowGate(true)}
                      className="shadow-xl"
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Sign In to Unlock Full Report
                    </Button>
                  </div>
                  
                  {/* Blurred content preview */}
                  <div className="blur-md select-none pointer-events-none">
                    <h4 className="font-semibold mb-2">Full Analysis Details</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {summary.executive_summary?.substring(0, 200)}...
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {zoning.classification && (
                        <div className="border rounded p-3">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Zoning</p>
                          <p className="font-semibold">{zoning.classification}</p>
                        </div>
                      )}
                      {flood.zone && (
                        <div className="border rounded p-3">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Flood Zone</p>
                          <p className="font-semibold">{flood.zone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Props - Why Sign Up */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Complete Analysis</h4>
                  <p className="text-xs text-muted-foreground">
                    Access all sections including zoning, utilities, traffic, and cost estimates
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Download className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">PDF Export</h4>
                  <p className="text-xs text-muted-foreground">
                    Download lender-ready PDF with cited sources and data
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Dashboard Access</h4>
                  <p className="text-xs text-muted-foreground">
                    Manage all your reports in one place, track projects
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Full Report Content - only show if authenticated or owner */}
        {!showPreview && (
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
                {report.applications.lot_size_value && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Lot Size</p>
                    <p className="font-semibold text-lg">
                      {report.applications.lot_size_value.toLocaleString()} {report.applications.lot_size_unit || 'acres'}
                    </p>
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

        {/* ⭐ NEW: Permitting Timeline Section */}
        {report.applications?.average_permit_time_months && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Permitting Timeline & Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Average Approval Time</span>
                    </div>
                    <p className="text-4xl font-bold text-primary">
                      {report.applications.average_permit_time_months}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">months</p>
                  </div>

                  {report.applications.city && (
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Jurisdiction</span>
                      </div>
                      <p className="text-lg font-semibold">{report.applications.city}</p>
                      <p className="text-sm text-muted-foreground">{report.applications.county} County</p>
                    </div>
                  )}

                  {report.json_data?.cost_schedule?.permitting_complexity && (
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Complexity Level</span>
                      </div>
                      <Badge variant={
                        report.json_data.cost_schedule.permitting_complexity === 'low' ? 'default' :
                        report.json_data.cost_schedule.permitting_complexity === 'moderate' ? 'secondary' :
                        'destructive'
                      } className="text-lg px-4 py-1">
                        {report.json_data.cost_schedule.permitting_complexity?.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Approval Process Timeline */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Estimated Approval Process
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Pre-Application Review</p>
                        <p className="text-xs text-muted-foreground">Initial consultation with planning department</p>
                        <p className="text-xs font-medium mt-1">Est. 2-4 weeks</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Site Plan & Zoning Review</p>
                        <p className="text-xs text-muted-foreground">Compliance verification and initial approvals</p>
                        <p className="text-xs font-medium mt-1">Est. {Math.ceil(report.applications.average_permit_time_months! * 0.3)} months</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Building Permit Application</p>
                        <p className="text-xs text-muted-foreground">Construction documents review and approval</p>
                        <p className="text-xs font-medium mt-1">Est. {Math.ceil(report.applications.average_permit_time_months! * 0.5)} months</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">4</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Final Inspections & Approvals</p>
                        <p className="text-xs text-muted-foreground">Certificate of Occupancy issuance</p>
                        <p className="text-xs font-medium mt-1">Est. {Math.floor(report.applications.average_permit_time_months! * 0.2)} months</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Required Submittals */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Typical Required Submittals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Site plan and survey</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Architectural drawings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Engineering plans (civil, structural, MEP)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Drainage and utility plans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Environmental studies (if required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Traffic impact analysis (if required)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Landscape and lighting plans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Fire protection and life safety plans</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {report.applications.city && (
                  <div className="pt-4 border-t bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4" />
                      Permitting Office Contact
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      For specific requirements and timeline verification, contact:
                    </p>
                    <p className="text-sm font-medium">{report.applications.city} Planning & Development</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommend scheduling a pre-application meeting to discuss project-specific requirements
                    </p>
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
              <CardContent className="space-y-6">
                {/* ⭐ PRIORITY: Wetlands - HIGH REGULATORY IMPACT */}
                {report.applications?.wetlands_type && (
                  <div className={`p-4 rounded-lg border-2 ${
                    report.applications.wetlands_type === 'None detected' 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                  }`}>
                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                      <MapPin className={`h-5 w-5 ${
                        report.applications.wetlands_type === 'None detected' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`} />
                      <span className={
                        report.applications.wetlands_type === 'None detected' 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-red-700 dark:text-red-400'
                      }>
                        Wetlands Status (Regulatory Priority)
                      </span>
                    </h4>
                    <p className="text-sm font-medium mb-2">
                      {report.applications.wetlands_type}
                    </p>
                    {report.applications.wetlands_type !== 'None detected' && 
                     report.applications.wetlands_type !== 'API Error' &&
                     !report.applications.wetlands_type.includes('Manual Verification') && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="destructive" className="text-xs">
                          🚨 Section 404 CWA Permit Required
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded border">
                          <strong>Regulatory Impact:</strong> Wetland delineation and Army Corps of Engineers permit required. 
                          Expect 6-12 month permitting timeline. Consult wetland specialist immediately.
                        </p>
                      </div>
                    )}
                    {report.applications.wetlands_type === 'None detected' && (
                      <Badge variant="default" className="mt-2 bg-green-600">
                        ✅ No Wetlands Detected
                      </Badge>
                    )}
                  </div>
                )}


                <div className="grid grid-cols-1 gap-6">
                  {/* Soil Characteristics */}
                  {(report.applications?.soil_series || report.applications?.soil_drainage_class || 
                    report.applications?.soil_slope_percent) && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-amber-600" />
                        Soil Characteristics
                      </h4>
                      <div className="space-y-1 text-sm">
                        {report.applications.soil_series && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Series:</span> {report.applications.soil_series}
                          </p>
                        )}
                        {report.applications.soil_drainage_class && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Drainage:</span> {report.applications.soil_drainage_class}
                          </p>
                        )}
                        {report.applications.soil_slope_percent !== null && report.applications.soil_slope_percent !== undefined && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Slope:</span> {report.applications.soil_slope_percent}%
                          </p>
                        )}
                      </div>
                      {report.applications.soil_slope_percent && report.applications.soil_slope_percent > 5 && (
                        <Badge variant="secondary" className="mt-2">
                          Engineering Required (Slope &gt; 5%)
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Environmental Sites */}
                {report.applications?.environmental_sites && 
                 Array.isArray(report.applications.environmental_sites) && 
                 report.applications.environmental_sites.length > 0 && (
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                    <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-destructive">
                      <FileText className="h-4 w-4" />
                      Nearby Environmental Sites ({report.applications.environmental_sites.length})
                    </h4>
                    <div className="space-y-2">
                      {report.applications.environmental_sites.slice(0, 10).map((site: any, i: number) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-sm p-2 bg-background rounded">
                          <div className="flex-1">
                            <p className="font-medium">{site.site_name}</p>
                            {site.program && (
                              <p className="text-xs text-muted-foreground">{site.program}</p>
                            )}
                            {site.status && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {site.status}
                              </Badge>
                            )}
                          </div>
                          {site.distance_mi && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {site.distance_mi} mi
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Note: Proximity to environmental sites may require Phase I/II Environmental Assessments
                    </p>
                  </div>
                )}

                {/* Historical Flood Events */}
                {report.applications?.historical_flood_events && 
                 Array.isArray(report.applications.historical_flood_events) && 
                 report.applications.historical_flood_events.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <FileText className="h-4 w-4" />
                      Historical Flood Events ({report.applications.historical_flood_events.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {report.applications.historical_flood_events.slice(0, 10).map((event: any, i: number) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-sm p-2 bg-background rounded">
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            {event.county && (
                              <p className="text-xs text-muted-foreground">{event.county}</p>
                            )}
                            {event.disaster_number && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                DR-{event.disaster_number}
                              </Badge>
                            )}
                          </div>
                          {event.declaration_date && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {new Date(event.declaration_date).getFullYear()}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Original Environmental Analysis Verdict */}
                <div className="prose prose-sm max-w-none pt-4 border-t">
                  <div dangerouslySetInnerHTML={{ __html: environmental.verdict || '<p>No environmental analysis available.</p>' }} />
                </div>
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
                {/* ⭐ Enhanced: Traffic Mobility Metrics */}
                {(report.applications?.truck_percent || report.applications?.congestion_level) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5 text-orange-600" />
                      Traffic Mobility Analysis
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {report.applications.truck_percent !== null && (
                        <Card className="border-orange-200 bg-white/70 dark:bg-background/70">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-5 w-5 text-orange-600" />
                              <span className="text-sm text-muted-foreground">Truck Traffic</span>
                            </div>
                            <p className="text-4xl font-bold text-orange-700 dark:text-orange-400">
                              {report.applications.truck_percent}%
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              Commercial vehicles
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              {report.applications.truck_percent > 10 ? 'High commercial traffic' : 
                               report.applications.truck_percent > 5 ? 'Moderate commercial flow' : 
                               'Low truck volume'}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {report.applications.congestion_level && (
                        <Card className="border-red-200 bg-white/70 dark:bg-background/70">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-5 w-5 text-red-600" />
                              <span className="text-sm text-muted-foreground">Congestion</span>
                            </div>
                            <Badge 
                              variant={
                                report.applications.congestion_level.toLowerCase() === 'low' ? 'default' :
                                report.applications.congestion_level.toLowerCase() === 'moderate' ? 'secondary' :
                                'destructive'
                              }
                              className="text-2xl px-4 py-2"
                            >
                              {report.applications.congestion_level}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-3">
                              {report.applications.congestion_level.toLowerCase() === 'high' 
                                ? 'Peak hour delays expected' 
                                : report.applications.congestion_level.toLowerCase() === 'moderate'
                                ? 'Some delays during rush hours'
                                : 'Free-flowing traffic'}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {report.applications.traffic_direction && (
                        <Card className="border-blue-200 bg-white/70 dark:bg-background/70">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-muted-foreground">Traffic Flow</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 capitalize">
                              {report.applications.traffic_direction}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Primary direction
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {report.applications.traffic_map_url && (
                        <Card className="border-purple-200 bg-white/70 dark:bg-background/70">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-5 w-5 text-purple-600" />
                              <span className="text-sm text-muted-foreground">Interactive Map</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => window.open(report.applications.traffic_map_url!, '_blank')}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              View Traffic Map
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              Live traffic visualization
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Peak Hour Analysis */}
                    {report.applications.congestion_level && (
                      <div className="mt-4 p-3 bg-white/50 dark:bg-background/50 rounded border border-muted">
                        <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Peak Hour Analysis
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Morning Rush (7-9 AM)</p>
                            <Badge variant={
                              report.applications.congestion_level.toLowerCase() === 'high' ? 'destructive' : 'secondary'
                            }>
                              {report.applications.congestion_level.toLowerCase() === 'high' ? 'Heavy' : 
                               report.applications.congestion_level.toLowerCase() === 'moderate' ? 'Moderate' : 'Light'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Evening Rush (4-6 PM)</p>
                            <Badge variant={
                              report.applications.congestion_level.toLowerCase() === 'high' ? 'destructive' : 'secondary'
                            }>
                              {report.applications.congestion_level.toLowerCase() === 'high' ? 'Heavy' : 
                               report.applications.congestion_level.toLowerCase() === 'moderate' ? 'Moderate' : 'Light'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Midday (11 AM-2 PM)</p>
                            <Badge variant="outline">
                              {report.applications.congestion_level.toLowerCase() === 'high' ? 'Moderate' : 'Light'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Off-Peak</p>
                            <Badge variant="outline">Light</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                {/* ⭐ NEW: Trade Area Analysis Section */}
                {(report.applications?.drive_time_15min_population || 
                  report.applications?.drive_time_30min_population || 
                  report.applications?.population_1mi ||
                  report.applications?.population_3mi ||
                  report.applications?.population_5mi) && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Trade Area Analysis
                    </h4>

                    {/* Drive-Time Demographics */}
                    {(report.applications.drive_time_15min_population || report.applications.drive_time_30min_population) && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
                          Traffic-Adjusted Market Reach
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {report.applications.drive_time_15min_population && (
                            <Card className="border-purple-200 bg-white/50 dark:bg-background/50">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-5 w-5 text-purple-600" />
                                  <span className="text-sm text-muted-foreground">15-Minute Drive Time</span>
                                </div>
                                <p className="text-4xl font-bold text-purple-700 dark:text-purple-400">
                                  {report.applications.drive_time_15min_population.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">people</p>
                                <div className="mt-3 pt-3 border-t border-purple-200/50">
                                  <p className="text-xs text-muted-foreground">
                                    Primary trade area - highest conversion potential
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          {report.applications.drive_time_30min_population && (
                            <Card className="border-blue-200 bg-white/50 dark:bg-background/50">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <span className="text-sm text-muted-foreground">30-Minute Drive Time</span>
                                </div>
                                <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                                  {report.applications.drive_time_30min_population.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">people</p>
                                <div className="mt-3 pt-3 border-t border-blue-200/50">
                                  <p className="text-xs text-muted-foreground">
                                    Secondary trade area - extended market reach
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comparison: Drive-Time vs Concentric Rings */}
                    {(report.applications.population_1mi || report.applications.population_3mi || report.applications.population_5mi) && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold mb-3 text-muted-foreground uppercase flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Concentric Ring Analysis
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {report.applications.population_1mi && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                                  <span className="text-lg font-bold text-green-700 dark:text-green-400">1</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                  {report.applications.population_1mi.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">within 1 mile</p>
                              </div>
                            </div>
                          )}
                          
                          {report.applications.population_3mi && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400">3</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                  {report.applications.population_3mi.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">within 3 miles</p>
                              </div>
                            </div>
                          )}
                          
                          {report.applications.population_5mi && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2">
                                  <span className="text-lg font-bold text-purple-700 dark:text-purple-400">5</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                  {report.applications.population_5mi.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">within 5 miles</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Comparison Insight */}
                        {report.applications.drive_time_15min_population && report.applications.population_3mi && (
                          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded border border-blue-200/50 dark:border-blue-800/50">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Market Reach Comparison
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.applications.drive_time_15min_population > report.applications.population_3mi ? (
                                <>
                                  <span className="font-semibold text-green-700 dark:text-green-400">
                                    {Math.round((report.applications.drive_time_15min_population / report.applications.population_3mi - 1) * 100)}% more people
                                  </span>
                                  {' '}are accessible within 15-minute drive time compared to a 3-mile radius, indicating good road connectivity and market access.
                                </>
                              ) : (
                                <>
                                  The 3-mile radius captures{' '}
                                  <span className="font-semibold">
                                    {Math.round((report.applications.population_3mi / report.applications.drive_time_15min_population - 1) * 100)}% more people
                                  </span>
                                  {' '}than 15-minute drive time, suggesting dense urban environment with traffic congestion.
                                </>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Demographics & Economic Indicators */}
                    {(report.applications.growth_rate_5yr || report.applications.median_income || report.applications.households_5mi) && (
                      <div>
                        <h5 className="text-sm font-semibold mb-3 text-muted-foreground uppercase flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Market Characteristics
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {report.applications.growth_rate_5yr && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-muted-foreground uppercase">5-Year Growth</span>
                              </div>
                              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                                {report.applications.growth_rate_5yr > 0 ? '+' : ''}{(report.applications.growth_rate_5yr * 100).toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {report.applications.growth_rate_5yr > 0.1 ? 'High growth market' : 
                                 report.applications.growth_rate_5yr > 0.05 ? 'Moderate growth' : 
                                 'Stable market'}
                              </p>
                            </div>
                          )}
                          
                          {report.applications.median_income && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                <span className="text-xs text-muted-foreground uppercase">Median Income</span>
                              </div>
                              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                ${(report.applications.median_income / 1000).toFixed(0)}k
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {report.applications.median_income > 75000 ? 'High income area' : 
                                 report.applications.median_income > 50000 ? 'Middle income' : 
                                 'Value-oriented market'}
                              </p>
                            </div>
                          )}
                          
                          {report.applications.households_5mi && (
                            <div className="p-4 bg-white/70 dark:bg-background/70 rounded-lg border border-muted">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="h-4 w-4 text-purple-600" />
                                <span className="text-xs text-muted-foreground uppercase">Households</span>
                              </div>
                              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                                {(report.applications.households_5mi / 1000).toFixed(1)}k
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">within 5 miles</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
        )}
      </main>
    </div>
  );
}
