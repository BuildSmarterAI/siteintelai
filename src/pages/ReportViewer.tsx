import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ScoreDashboard } from "@/components/report/ScoreDashboard";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { KillFactorsBanner } from "@/components/report/KillFactorsBanner";
import { ReportHeader } from "@/components/report/ReportHeader";
import { CREMetricsStrip } from "@/components/report/CREMetricsStrip";
import { DataConfidenceIndicator } from "@/components/report/DataConfidenceIndicator";
import { LenderReadyBadge } from "@/components/report/LenderReadyBadge";
import { ExecutiveSummaryCard } from "@/components/report/ExecutiveSummaryCard";
import { PropertyOwnerCard } from "@/components/report/PropertyOwnerCard";
import { ValuationCard } from "@/components/report/ValuationCard";
import { ProjectFeasibilityCard } from "@/components/report/ProjectFeasibilityCard";

// PRD-compliant components
import { ExecutiveVerdictBar, VerdictType } from "@/components/report/ExecutiveVerdictBar";
import { KillFactorPanel, KillFactorItem } from "@/components/report/KillFactorPanel";
import { RiskDriverList, RiskDriver } from "@/components/report/RiskDriverList";
import { NextActionsBlock, NextAction } from "@/components/report/NextActionsBlock";
import { FeasibilityScoreCard } from "@/components/report/FeasibilityScoreCard";
import { DecisionMap } from "@/components/report/DecisionMap";
import { FloodRiskCard } from "@/components/report/FloodRiskCard";
import { UtilitiesCard } from "@/components/report/UtilitiesCard";
import { EnvironmentalCard } from "@/components/report/EnvironmentalCard";
import { TrafficCard } from "@/components/report/TrafficCard";
import { MarketCard } from "@/components/report/MarketCard";
import { AccessCard } from "@/components/report/AccessCard";
import { TopographyCard } from "@/components/report/TopographyCard";
import { ZoningCard } from "@/components/report/ZoningCard";
import { SectionNav } from "@/components/report/SectionNav";
import { TaxJurisdictionCard } from "@/components/report/TaxJurisdictionCard";
import { EmploymentContextCard } from "@/components/report/EmploymentContextCard";
import { ExtendedDemographicsCard } from "@/components/report/ExtendedDemographicsCard";
import { MapCanvas } from "@/components/MapCanvas";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { DrawParcelControl } from "@/components/DrawParcelControl";
import { DrawnParcelsList } from "@/components/DrawnParcelsList";
import { Loader2, Download, FileText, MapPin, Zap, Car, Users, TrendingUp, Building2, Clock, DollarSign, Wifi, Landmark, AlertTriangle, Lock, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSourcesDisplay } from "@/components/DataSourcesDisplay";
import { ReportPreviewGate } from "@/components/ReportPreviewGate";
import { GeospatialIntelligenceCard } from "@/components/GeospatialIntelligenceCard";
import { UtilityResults } from "@/components/UtilityResults";
import DOMPurify from 'dompurify';
import { useMapLayers } from "@/hooks/useMapLayers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useReEnrichApplication } from "@/hooks/useReEnrichApplication";
import { ReportChatAssistant } from "@/components/ReportChatAssistant";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";
interface Report {
  id: string;
  application_id: string;
  feasibility_score: number;
  score_band: string;
  json_data: any;
  pdf_url: string | null;
  created_at: string;
  report_assets?: {
    static_map_url?: string;
    streetview?: Array<{
      direction: string;
      heading: number;
      url: string;
    }>;
  };
  applications: {
    formatted_address: string;
    geo_lat: number;
    geo_lng: number;
    parcel_id: string;
    zoning_code: string;
    floodplain_zone: string;
    intent_type?: string | null;
    traffic_aadt: number | null;
    traffic_year: number | null;
    traffic_road_name: string | null;
    truck_percent: number | null;
    congestion_level: string | null;
    traffic_direction: string | null;
    traffic_map_url: string | null;
    speed_limit?: number | null;
    surface_type?: string | null;
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
    wetlands_area_pct?: number | null;
    soil_series?: string | null;
    soil_drainage_class?: string | null;
    soil_slope_percent?: number | null;
    environmental_sites?: any;
    historical_flood_events?: any;
    // Lot size fields
    lot_size_value?: number | null;
    lot_size_unit?: string | null;
    acreage_cad?: number | null;
    // Permitting fields
    average_permit_time_months?: number | null;
    city?: string | null;
    county?: string | null;
    neighborhood?: string | null;
    submarket_enriched?: string | null;
    disaster_declarations?: string | null;
    wcid_district?: string | null;
    // Market demographics - drive time
    drive_time_15min_population?: number | null;
    drive_time_30min_population?: number | null;
    population_1mi?: number | null;
    population_3mi?: number | null;
    population_5mi?: number | null;
    growth_rate_5yr?: number | null;
    median_income?: number | null;
    households_5mi?: number | null;
    // Extended Census ACS demographics
    median_home_value?: number | null;
    median_rent?: number | null;
    vacancy_rate?: number | null;
    unemployment_rate?: number | null;
    median_age?: number | null;
    college_attainment_pct?: number | null;
    total_housing_units?: number | null;
    labor_force?: number | null;
    // Proprietary CRE Indices (Census Data Moat)
    retail_spending_index?: number | null;
    workforce_availability_score?: number | null;
    growth_potential_index?: number | null;
    affluence_concentration?: number | null;
    labor_pool_depth?: number | null;
    daytime_population_estimate?: number | null;
    growth_trajectory?: string | null;
    market_outlook?: string | null;
    demographics_source?: string | null;
    census_block_group?: string | null;
    census_vintage?: string | null;
    // Google Maps integration
    drivetimes?: Array<{
      destination: string;
      duration_min: number;
      distance_mi: number;
    }>;
    nearby_places?: Array<{
      name: string;
      type: string;
      distance_ft: number;
    }>;
    water_lines?: Array<{
      diameter: number | null;
      material: string | null;
      status?: string | null;
      install_date?: string | null;
      distance_ft?: number;
      source?: string;
      owner?: string;
    }>;
    sewer_lines?: Array<{
      diameter: number | null;
      material: string | null;
      status?: string | null;
      distance_ft?: number;
      source?: string;
    }>;
    storm_lines?: Array<{
      diameter: number | null;
      material: string | null;
      status?: string | null;
      distance_ft?: number;
      source?: string;
    }>;
    data_flags?: string[];
    // Additional fields for new card components
    nfip_claims_count?: number | null;
    water_capacity_mgd?: number | null;
    sewer_capacity_mgd?: number | null;
    epa_facilities_count?: number | null;
    peak_hour_volume?: number | null;
    nearest_highway?: string | null;
    nearest_transit_stop?: string | null;
    nearest_signal_distance_ft?: number | null;
    road_classification?: string | null;
    elevation?: number | null;
    topography_map_url?: string | null;
  };
}
export default function ReportViewer() {
  const {
    reportId
  } = useParams();
  const navigate = useNavigate();
  const {
    productId
  } = useSubscription();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [geospatialData, setGeospatialData] = useState<any>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState<any>(null);
  const [isSavingParcel, setIsSavingParcel] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [editingParcel, setEditingParcel] = useState<any>(null);
  const [countyComparison, setCountyComparison] = useState<{
    avgMedianIncome?: number | null;
    avgMedianHomeValue?: number | null;
    avgVacancyRate?: number | null;
    avgUnemploymentRate?: number | null;
    avgMedianRent?: number | null;
    tractCount?: number | null;
  } | null>(null);

  // Feature flag for MapLibre GL
  const useMapLibre = import.meta.env.VITE_USE_MAPLIBRE === 'true';
  const MapComponent = useMapLibre ? MapLibreCanvas : MapCanvas;

  // Map layers (parcel, flood, utilities, traffic, employment, drawnParcels)
  const {
    data: mapLayers,
    refetch: refetchMapLayers,
    updateParcel,
    deleteParcel
  } = useMapLayers(report?.application_id || '');

  // Admin role check
  const {
    isAdmin
  } = useAdminRole();

  // Re-enrichment hook
  const {
    reEnrich,
    loading: reEnrichLoading
  } = useReEnrichApplication();

  // Fetch geospatial intelligence data
  useEffect(() => {
    if (!report?.application_id) return;
    async function fetchGeospatialData() {
      const {
        data
      } = await supabase.from('feasibility_geospatial').select('*').eq('application_id', report.application_id).single();
      if (data) {
        setGeospatialData(data);
      }
    }
    fetchGeospatialData();
  }, [report?.application_id]);

  // Fetch county comparison demographics
  useEffect(() => {
    if (!report?.applications?.census_block_group) return;
    
    // Extract county FIPS from census block group (format: STATE(2) + COUNTY(3) + TRACT(6) + BLOCK(1))
    // census_block_group is typically 12 digits: SSCCCTTTTTTB
    const geoid = report.applications.census_block_group;
    const countyFips = geoid?.length >= 5 ? geoid.substring(2, 5) : null;
    
    if (!countyFips) return;
    
    async function fetchCountyComparison() {
      try {
        const { data, error } = await supabase.rpc('get_county_demographics', {
          p_county_fips: countyFips
        });
        
        if (error) {
          console.warn('County demographics fetch failed:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const county = data[0];
          setCountyComparison({
            avgMedianIncome: county.avg_median_income,
            avgMedianHomeValue: county.avg_median_home_value,
            avgVacancyRate: county.avg_vacancy_rate,
            avgUnemploymentRate: county.avg_unemployment_rate,
            avgMedianRent: county.avg_median_rent,
            tractCount: county.tract_count,
          });
        }
      } catch (err) {
        console.warn('Error fetching county comparison:', err);
      }
    }
    
    fetchCountyComparison();
  }, [report?.applications?.census_block_group]);
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
      const {
        data,
        error
      } = await supabase.from('reports').select('pdf_url, status').eq('id', reportId).single();
      if (data?.pdf_url) {
        setReport(prev => prev ? {
          ...prev,
          pdf_url: data.pdf_url
        } : null);
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
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    const authenticated = !!session?.user;
    setIsAuthenticated(authenticated);
    await fetchReport(session?.user?.id);
  };
  const fetchReport = async (userId?: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('reports').select(`
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
            wcid_district,
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
            wetlands_area_pct,
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
            neighborhood,
            submarket_enriched,
            disaster_declarations,
            drive_time_15min_population,
            drive_time_30min_population,
            population_1mi,
            population_3mi,
            population_5mi,
            growth_rate_5yr,
            median_income,
            households_5mi,
            updated_at,
            user_id,
            drivetimes,
            nearby_places,
            water_lines,
            sewer_lines,
            storm_lines,
            data_flags,
            elevation,
            topography_map_url,
            nfip_claims_count,
            water_capacity_mgd,
            sewer_capacity_mgd,
            epa_facilities_count,
            peak_hour_volume,
            nearest_highway,
            nearest_transit_stop,
            nearest_signal_distance_ft,
            road_classification,
            median_home_value,
            median_rent,
            vacancy_rate,
            unemployment_rate,
            median_age,
            college_attainment_pct,
            total_housing_units,
            labor_force,
            retail_spending_index,
            workforce_availability_score,
            growth_potential_index,
            affluence_concentration,
            labor_pool_depth,
            daytime_population_estimate,
            growth_trajectory,
            market_outlook,
            demographics_source,
            census_block_group,
            census_vintage
          )
        `).eq('id', reportId).single();
      if (error) throw error;

      // Type assertion for complex JSON fields
      const typedData: Report = {
        ...data,
        report_assets: data.report_assets as Report['report_assets'],
        applications: {
          ...data.applications,
          drivetimes: data.applications.drivetimes as Report['applications']['drivetimes'],
          nearby_places: data.applications.nearby_places as Report['applications']['nearby_places'],
          water_lines: data.applications.water_lines as Report['applications']['water_lines'],
          sewer_lines: data.applications.sewer_lines as Report['applications']['sewer_lines'],
          storm_lines: data.applications.storm_lines as Report['applications']['storm_lines'],
          data_flags: data.applications.data_flags as Report['applications']['data_flags']
        }
      };
      setReport(typedData);

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

  // Handle parcel drawing completion
  const handleParcelDrawn = (geometry: any) => {
    console.log('📐 Parcel drawn:', geometry);
    setDrawnGeometry(geometry);
    setDrawingMode(false);
  };

  // Handle save drawn parcel (for new parcels)
  const handleSaveParcel = async (name: string) => {
    // If editing, use update mutation
    if (editingParcel) {
      try {
        setIsSavingParcel(true);
        await updateParcel.mutateAsync({
          parcelId: editingParcel.id,
          name,
          geometry: drawnGeometry
        });
        setEditingParcel(null);
        setDrawnGeometry(null);
        setSelectedParcel(null);
      } catch (error: any) {
        console.error('Failed to update parcel:', error);
        throw error;
      } finally {
        setIsSavingParcel(false);
      }
      return;
    }

    // Otherwise, create new parcel
    if (!drawnGeometry || !report?.application_id) {
      toast.error('No parcel drawn or application not found');
      return;
    }
    setIsSavingParcel(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('save-drawn-parcel', {
        body: {
          geometry: drawnGeometry,
          name,
          application_id: report.application_id
        }
      });
      if (error) throw error;
      console.log('✅ Parcel saved:', data);
      toast.success(`Parcel "${name}" saved with ${data.acreage_calc?.toFixed(2)} acres`);

      // Clear drawn geometry and refetch layers
      setDrawnGeometry(null);
      await refetchMapLayers();
    } catch (error: any) {
      console.error('❌ Failed to save parcel:', error);
      toast.error(error.message || 'Failed to save parcel');
      throw error;
    } finally {
      setIsSavingParcel(false);
    }
  };

  // Handle cancel drawing
  const handleCancelDrawing = () => {
    setDrawingMode(false);
    setDrawnGeometry(null);
    setEditingParcel(null);
    setSelectedParcel(null);
  };

  // Handle parcel selection from map
  const handleParcelSelected = (parcel: any) => {
    setSelectedParcel(parcel);
  };

  // Handle edit parcel from list or map
  const handleEditParcel = (parcel: any) => {
    setEditingParcel(parcel);
    setDrawnGeometry(parcel.geometry);
    setDrawingMode(true);
    toast.info('Edit mode activated. Modify the parcel and save changes.');
  };

  // Handle delete parcel
  const handleDeleteParcel = async (parcelId: string) => {
    try {
      await deleteParcel.mutateAsync(parcelId);
      setSelectedParcel(null);
    } catch (error) {
      console.error('Failed to delete parcel:', error);
    }
  };

  // Handle zoom to parcel
  const handleZoomToParcel = (parcel: any) => {
    // This will be handled by the map component
    setSelectedParcel(parcel);
    toast.info(`Zooming to ${parcel.name}`);
  };

  // Handle draw new parcel
  const handleDrawNewParcel = () => {
    setEditingParcel(null);
    setSelectedParcel(null);
    setDrawnGeometry(null);
    setDrawingMode(true);
  };

  // Handle re-enrichment
  const handleReEnrich = async () => {
    if (!report?.application_id) {
      toast.error('No application ID found');
      return;
    }
    const result = await reEnrich(report.application_id);
    if (result.success) {
      toast.info('Re-enrichment started. The page will refresh in 10 seconds...', {
        duration: 10000
      });

      // Refresh the page after 10 seconds to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    }
  };

  // Handle regenerate map assets
  const handleRegenerateMapAssets = async () => {
    if (!report?.application_id || !report.applications.geo_lat || !report.applications.geo_lng) {
      toast.error('Missing location data for map generation');
      return;
    }
    toast.info('Regenerating map assets...');
    try {
      await Promise.all([supabase.functions.invoke('render-static-map', {
        body: {
          application_id: report.application_id,
          center: {
            lat: report.applications.geo_lat,
            lng: report.applications.geo_lng
          },
          zoom: 17,
          size: '1200x800'
        }
      }), supabase.functions.invoke('render-streetview', {
        body: {
          application_id: report.application_id,
          location: {
            lat: report.applications.geo_lat,
            lng: report.applications.geo_lng
          },
          headings: [0, 90, 180, 270],
          size: '640x400'
        }
      })]);

      // Refetch report to get updated assets
      await fetchReport();
      toast.success('Map assets regenerated successfully');
    } catch (error) {
      console.error('Map regeneration failed:', error);
      toast.error('Failed to regenerate maps. Please try again.');
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!report) {
    return <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Report not found</p>
      </div>;
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
  // 🔒 IP Protection: Only load data_sources for enterprise users
  const dataSources = productId === 'enterprise' && parsedData.data_sources || [];

  // Helper to get data sources for a specific section
  const getSourcesForSection = (section: string) => {
    return dataSources.filter((ds: any) => ds.section === section);
  };
  // Calculate AI confidence based on data completeness
  const calculateConfidence = () => {
    let score = 50; // Base score
    if (report.applications?.geo_lat && report.applications?.geo_lng) score += 10;
    if (report.applications?.zoning_code) score += 10;
    if (report.applications?.floodplain_zone) score += 10;
    if (report.applications?.water_lines?.length) score += 5;
    if (report.applications?.sewer_lines?.length) score += 5;
    if (report.applications?.traffic_aadt) score += 5;
    if (report.applications?.tot_market_val) score += 5;
    return Math.min(100, score);
  };

  const getDataFreshness = (): "fresh" | "recent" | "stale" => {
    const updatedAt = report.applications?.updated_at;
    if (!updatedAt) return "stale";
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) return "fresh";
    if (daysSinceUpdate < 30) return "recent";
    return "stale";
  };

  const hasUtilitiesAvailable = () => {
    return (report.applications?.water_lines?.length ?? 0) > 0 || 
           (report.applications?.sewer_lines?.length ?? 0) > 0;
  };

  const hasKillFactors = report.applications?.floodplain_zone?.toLowerCase().includes('floodway') ||
    report.applications?.floodplain_zone === 'AE' ||
    (report.applications?.wetlands_area_pct ?? 0) >= 25 ||
    (parsedData.environmental?.kill_factors?.length > 0);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/50">
        {/* Left Sidebar Navigation - only show on full report */}
        {!showPreview && (
          <ReportSidebar hasKillFactors={hasKillFactors} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Show auth gate overlay if needed */}
          {showGate && reportId && <ReportPreviewGate reportId={reportId} onAuthSuccess={handleAuthSuccess} />}
          
          {/* AI-Enhanced Dark Header - replaces old header for full report view */}
          {!showPreview && (
            <div className="container mx-auto px-4 md:px-6 pt-6">
              <ReportHeader
                address={report.applications?.formatted_address || 'Property Report'}
                parcelId={report.applications?.parcel_id}
                jurisdiction={report.applications?.city || report.applications?.county}
                zoningCode={report.applications?.zoning_code || undefined}
                acreage={report.applications?.acreage_cad || report.applications?.lot_size_value}
                createdAt={report.created_at}
                pdfUrl={report.pdf_url}
                onDownloadPdf={() => window.open(report.pdf_url!, '_blank')}
                pdfGenerating={pdfGenerating}
                pdfError={pdfError}
              />
            </div>
          )}

          {/* Legacy Header - only for preview mode */}
          {showPreview && (
            <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
              <div className="container mx-auto px-4 md:px-6 py-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <img src={siteintelLogo} alt="SiteIntel AI" className="h-8 md:h-10 drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]" />
                    <div>
                      <h1 className="text-lg md:text-2xl font-headline">Feasibility Report</h1>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {report.applications?.formatted_address || 'Property Report'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Limited Preview Section - shown when not authenticated */}
        {showPreview && !showGate && <div className="space-y-8">
            {/* Score Preview - Fully Visible */}
            <div className="text-center">
              <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
                🔓 Quick Preview - Sign in for full access
              </Badge>
              
              <ScoreCircle score={report.feasibility_score ?? 0} size="lg" showLabel={true} />
              
              {!report.feasibility_score && <Badge variant="destructive" className="mt-2">
                  Score calculation pending
                </Badge>}
              
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
                {summary.key_opportunities && summary.key_opportunities.length > 0 && <div>
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Key Opportunities
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_opportunities.slice(0, 2).map((opp: string, i: number) => <li key={i}>{opp}</li>)}
                    </ul>
                  </div>}

                {summary.key_risks && summary.key_risks.length > 0 && <div>
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Key Risks
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.key_risks.slice(0, 2).map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                    </ul>
                  </div>}
                
                {/* Blur gradient overlay on preview */}
                <div className="relative mt-6 p-6 border rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10 rounded-lg flex items-center justify-center">
                    <Button size="lg" onClick={() => setShowGate(true)} className="shadow-xl">
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
                      {zoning.classification && <div className="border rounded p-3">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Zoning</p>
                          <p className="font-semibold">{zoning.classification}</p>
                        </div>}
                      {flood.zone && <div className="border rounded p-3">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Flood Zone</p>
                          <p className="font-semibold">{flood.zone}</p>
                        </div>}
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
          </div>}

        {/* Full Report Content - only show if authenticated or owner */}
        {!showPreview && (() => {
          // Compute verdict based on score and kill factors
          const score = report.feasibility_score ?? 0;
          const hasKillFactors = 
            report.applications?.floodplain_zone?.toLowerCase().includes('floodway') ||
            (report.applications?.wetlands_area_pct ?? 0) >= 50 ||
            !hasUtilitiesAvailable();
          
          const computeVerdict = (): VerdictType => {
            if (hasKillFactors) return "DO_NOT_PROCEED";
            if (score >= 75) return "PROCEED";
            if (score >= 50) return "CONDITIONAL";
            return "DO_NOT_PROCEED";
          };
          
          const verdict = computeVerdict();
          
          const getJustification = () => {
            if (verdict === "PROCEED") return "Site meets all critical thresholds for development. Proceed to due diligence.";
            if (verdict === "CONDITIONAL") return "Site has addressable constraints. Review required actions before proceeding.";
            return "Critical constraints detected. Site may not be suitable for intended use.";
          };
          
          // Build kill factors for PRD panel
          const buildKillFactors = () => {
            const dealKillers: KillFactorItem[] = [];
            const conditionalRisks: KillFactorItem[] = [];
            const advisoryNotes: KillFactorItem[] = [];
            
            // Check floodway
            if (report.applications?.floodplain_zone?.toLowerCase().includes('floodway')) {
              dealKillers.push({
                id: 'floodway',
                title: 'FEMA Floodway Designation',
                status: 'FAIL',
                impact: 'No development permitted in regulatory floodway without LOMR/CLOMR.',
                requiredAction: 'Obtain FEMA Letter of Map Revision (LOMR) or site alternative parcel.',
                confidence: 95,
                source: 'FEMA NFHL',
                sourceUrl: 'https://msc.fema.gov/portal/home',
              });
            } else if (report.applications?.floodplain_zone === 'AE' || report.applications?.floodplain_zone === 'A') {
              conditionalRisks.push({
                id: 'flood_ae',
                title: `FEMA Zone ${report.applications?.floodplain_zone}`,
                status: 'WARN',
                impact: 'Flood insurance required. Elevation certificate needed.',
                requiredAction: 'Obtain elevation certificate and flood insurance quote.',
                confidence: 90,
                source: 'FEMA NFHL',
              });
            }
            
            // Check wetlands
            const wetlandsPct = report.applications?.wetlands_area_pct ?? 0;
            if (wetlandsPct >= 50) {
              dealKillers.push({
                id: 'wetlands_critical',
                title: `Wetlands Coverage: ${wetlandsPct.toFixed(0)}%`,
                status: 'FAIL',
                impact: 'More than half the parcel is wetlands. Significant buildable area reduction.',
                requiredAction: 'Army Corps 404 permit required. Consider parcel acquisition strategy.',
                confidence: 85,
                source: 'USFWS NWI',
              });
            } else if (wetlandsPct >= 25) {
              conditionalRisks.push({
                id: 'wetlands_warning',
                title: `Wetlands Coverage: ${wetlandsPct.toFixed(0)}%`,
                status: 'WARN',
                impact: 'Significant wetlands present requiring mitigation.',
                requiredAction: 'Engage wetlands consultant for 404 permit assessment.',
                confidence: 80,
                source: 'USFWS NWI',
              });
            }
            
            // Check utilities
            if (!hasUtilitiesAvailable()) {
              dealKillers.push({
                id: 'no_utilities',
                title: 'No Public Utilities',
                status: 'FAIL',
                impact: 'No public water or sewer within 1000ft. Will require expensive utility extension.',
                requiredAction: 'Obtain utility extension cost estimate from provider.',
                confidence: 88,
                source: 'City GIS',
              });
            }
            
            // Add advisory notes from environmental
            if (report.applications?.environmental_sites?.length) {
              advisoryNotes.push({
                id: 'env_sites',
                title: `Environmental Sites Nearby (${report.applications.environmental_sites.length})`,
                status: 'PASS',
                impact: 'Nearby regulated facilities may require Phase I ESA.',
                confidence: 75,
                source: 'EPA ECHO',
              });
            }
            
            return { dealKillers, conditionalRisks, advisoryNotes };
          };
          
          const killFactorData = buildKillFactors();
          
          // Build risk drivers
          const buildRiskDrivers = () => {
            const positives: RiskDriver[] = [];
            const penalties: RiskDriver[] = [];
            
            if (report.applications?.zoning_code) {
              positives.push({ id: 'zoning', label: 'Zoning Compatible', delta: 15, sectionId: 'section-zoning' });
            }
            if (hasUtilitiesAvailable()) {
              positives.push({ id: 'utilities', label: 'Utilities Available', delta: 12, sectionId: 'section-utilities' });
            }
            if (report.applications?.traffic_aadt && report.applications.traffic_aadt > 10000) {
              positives.push({ id: 'traffic', label: 'High Traffic Visibility', delta: 8, sectionId: 'section-traffic' });
            }
            
            if (report.applications?.floodplain_zone && report.applications.floodplain_zone !== 'X') {
              penalties.push({ id: 'flood', label: 'Flood Zone Constraint', delta: -15, sectionId: 'section-flood' });
            }
            if ((report.applications?.wetlands_area_pct ?? 0) > 0) {
              penalties.push({ id: 'wetlands', label: 'Wetlands Present', delta: -10, sectionId: 'section-environmental' });
            }
            if (report.applications?.environmental_sites?.length) {
              penalties.push({ id: 'env', label: 'Environmental Concerns', delta: -5, sectionId: 'section-environmental' });
            }
            
            return { positives, penalties };
          };
          
          const riskDrivers = buildRiskDrivers();
          
          // Build next actions
          const buildNextActions = (): NextAction[] => {
            const actions: NextAction[] = [];
            
            if (verdict === "CONDITIONAL") {
              if (killFactorData.conditionalRisks.some(k => k.id.includes('flood'))) {
                actions.push({ id: 'flood_cert', label: 'Obtain FEMA Elevation Certificate', owner: 'consultant', priority: 1 });
              }
              if (killFactorData.conditionalRisks.some(k => k.id.includes('wetlands'))) {
                actions.push({ id: 'wetlands_assess', label: 'Complete 404 Permit Pre-Assessment', owner: 'consultant', priority: 1 });
              }
              actions.push({ id: 'due_diligence', label: 'Schedule Phase I ESA', owner: 'developer', priority: 2 });
            } else if (verdict === "PROCEED") {
              actions.push({ id: 'title', label: 'Order Title Commitment', owner: 'lender', priority: 1 });
              actions.push({ id: 'survey', label: 'Commission ALTA Survey', owner: 'developer', priority: 2 });
              actions.push({ id: 'appraisal', label: 'Order MAI Appraisal', owner: 'lender', priority: 3 });
            }
            
            return actions;
          };
          
          const nextActions = buildNextActions();
          
          const scrollToSection = (sectionId: string) => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
          };
          
          return (
            <div className="space-y-6">
              {/* PRD: 1. Executive Verdict Bar - Sticky */}
              <ExecutiveVerdictBar
                verdict={verdict}
                justification={getJustification()}
                confidence={calculateConfidence()}
                timestamp={new Date(report.created_at).toLocaleDateString()}
                onScrollToKillFactors={() => scrollToSection('section-kill-factors')}
              />

              {/* PRD: 2. Kill Factor Panel */}
              <KillFactorPanel
                dealKillers={killFactorData.dealKillers}
                conditionalRisks={killFactorData.conditionalRisks}
                advisoryNotes={killFactorData.advisoryNotes}
                onItemClick={(item) => {
                  // Highlight on map when clicking a kill factor
                  console.log('[ReportViewer] Kill factor clicked:', item.id);
                }}
              />

              {/* PRD: 3. Feasibility Score Card */}
              <FeasibilityScoreCard
                score={report.feasibility_score ?? 0}
                scoreBand={report.score_band || 'C'}
                address={report.applications?.formatted_address || 'Unknown Address'}
              />

              {/* PRD: 4. Risk Driver List */}
              <RiskDriverList
                positives={riskDrivers.positives}
                penalties={riskDrivers.penalties}
                onScrollToSection={scrollToSection}
              />

              {/* PRD: 5. Next Actions Block */}
              <NextActionsBlock
                actions={nextActions}
                verdictType={verdict}
              />

              {/* PRD: 6. Decision Map - Preset-controlled */}
              {report.applications?.geo_lat && report.applications?.geo_lng && (
                <DecisionMap
                  center={[report.applications.geo_lat, report.applications.geo_lng]}
                  zoom={15}
                  parcel={mapLayers?.parcel}
                  floodZones={[]} // Passed via vector tiles
                  waterLines={mapLayers?.waterLines || []}
                  sewerLines={mapLayers?.sewerLines || []}
                  stormLines={mapLayers?.stormLines || []}
                  zoningDistricts={mapLayers?.zoningDistricts || []}
                  drawnParcels={mapLayers?.drawnParcels || []}
                  killFactors={killFactorData}
                  onKillFactorClick={(factorId) => {
                    console.log('[ReportViewer] Map kill factor sync:', factorId);
                  }}
                  propertyAddress={report.applications?.formatted_address}
                  className="mb-6"
                />
              )}

              {/* Lender Ready Badge */}
              <LenderReadyBadge
                reportId={report.id}
                createdAt={report.created_at}
                pdfUrl={report.pdf_url}
                onDownloadPdf={() => window.open(report.pdf_url!, '_blank')}
              />

              {/* CRE Metrics Strip - Bloomberg Terminal Style */}
              <CREMetricsStrip
                lotSize={report.applications?.acreage_cad || report.applications?.lot_size_value}
                lotUnit={report.applications?.lot_size_unit || "AC"}
                zoningCode={report.applications?.zoning_code}
                floodZone={report.applications?.floodplain_zone}
                utilitiesAvailable={hasUtilitiesAvailable()}
                trafficAADT={report.applications?.traffic_aadt}
                marketValue={report.applications?.tot_market_val}
              />

              {/* AI Confidence Indicator */}
              <DataConfidenceIndicator
                confidence={calculateConfidence()}
                dataSourcesCount={12}
                lastUpdated={report.applications?.updated_at}
                dataFreshness={getDataFreshness()}
              />

              {/* Executive Summary - Enhanced Card */}
              {summary.executive_summary && (
                <ExecutiveSummaryCard
                  executiveSummary={summary.executive_summary}
                  overallScore={report.feasibility_score ?? 0}
                  scoreBand={report.score_band || 'C'}
                  keyOpportunities={summary.key_opportunities || []}
                  keyRisks={summary.key_risks || []}
                  zoningCode={report.applications?.zoning_code}
                  floodZone={report.applications?.floodplain_zone}
                  acreage={report.applications?.acreage_cad || report.applications?.lot_size_value}
                />
              )}

        {/* Google Maps Visualization */}
        {report.applications?.geo_lat && report.applications?.geo_lng && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Site Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Static Map */}
              {report.report_assets?.static_map_url && (
                <div className="space-y-4">
                  <img src={report.report_assets.static_map_url} alt="Google Static Map of site" className="w-full rounded-lg border shadow-sm" />
                  <p className="text-sm text-muted-foreground">
                    Aerial view from Google Maps • Updated: {new Date(report.applications.updated_at || report.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Street View */}
              {report.report_assets?.streetview && report.report_assets.streetview.length > 0 && <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Street View
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {report.report_assets.streetview.map(sv => <div key={sv.heading} className="space-y-2">
                        <img src={sv.url} alt={`Street view facing ${sv.direction}`} className="w-full rounded border shadow-sm cursor-pointer hover:opacity-80 transition" onClick={() => window.open(sv.url, '_blank')} />
                        <p className="text-xs text-center text-muted-foreground">
                          {sv.direction} View
                        </p>
                      </div>)}
                  </div>
                </div>}
            </CardContent>
          </Card>}

        {/* Property Map */}
        {report.applications?.geo_lat && report.applications?.geo_lng && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Interactive Property Map
                {useMapLibre && <Badge variant="outline" className="text-xs">
                    MapLibre GL
                  </Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {useMapLibre ? <MapLibreCanvas center={[report.applications.geo_lat, report.applications.geo_lng]} zoom={(() => {
                  const acreage = report.applications.acreage_cad || report.applications.lot_size_value || 1;
                  if (acreage < 1) return 18;
                  if (acreage < 5) return 16;
                  if (acreage < 10) return 15;
                  return 14;
                })()} className="h-[500px] md:h-[600px] lg:h-[700px] w-full rounded-lg" propertyAddress={report.applications.formatted_address} femaFloodZone={(geospatialData?.fema_flood_risk as any)?.zone_code} intentType={report.applications.intent_type as 'build' | 'buy' | null} parcel={mapLayers?.parcel} drawnParcels={mapLayers?.drawnParcels} hcadParcels={mapLayers?.hcadParcels || []} waterLines={mapLayers?.waterLines || []} sewerLines={mapLayers?.sewerLines || []} stormLines={mapLayers?.stormLines || []} stormManholes={mapLayers?.stormManholes || []} forceMain={mapLayers?.forceMain || []} zoningDistricts={mapLayers?.zoningDistricts || []} drawingEnabled={drawingMode} onParcelDrawn={handleParcelDrawn} onParcelSelected={handleParcelSelected} selectedParcelId={selectedParcel?.id || null} editingParcelId={editingParcel?.id || null} employmentCenters={mapLayers?.employmentCenters && mapLayers.employmentCenters.length > 0 ? mapLayers.employmentCenters : report.applications.employment_clusters && Array.isArray(report.applications.employment_clusters) ? report.applications.employment_clusters.filter((c: any) => c.lat && c.lng).map((cluster: any) => ({
                  name: cluster.name || 'Employment Center',
                  jobs: cluster.jobs || 0,
                  distance_miles: cluster.distance || 0,
                  coordinates: [cluster.lat, cluster.lng] as [number, number]
                })) : []} /> : <MapCanvas center={[report.applications.geo_lat, report.applications.geo_lng]} zoom={(() => {
                  const acreage = report.applications.acreage_cad || report.applications.lot_size_value || 1;
                  if (acreage < 1) return 18;
                  if (acreage < 5) return 16;
                  if (acreage < 10) return 15;
                  return 14;
                })()} className="h-[300px] md:h-96 w-full rounded-lg" propertyAddress={report.applications.formatted_address} femaFloodZone={(geospatialData?.fema_flood_risk as any)?.zone_code} parcel={mapLayers?.parcel} employmentCenters={report.applications.employment_clusters && Array.isArray(report.applications.employment_clusters) ? report.applications.employment_clusters.filter((c: any) => c.lat && c.lng).map((cluster: any) => ({
                  name: cluster.name || 'Employment Center',
                  jobs: cluster.jobs || 0,
                  distance_miles: cluster.distance || 0,
                  coordinates: [cluster.lat, cluster.lng] as [number, number],
                  lat: cluster.lat,
                  lng: cluster.lng,
                  distance: cluster.distance,
                  industries: cluster.industries
                })) : []} />}
                
                {/* Drawing Control - Only for MapLibre and authenticated owners */}
                {useMapLibre && isAuthenticated && isOwner && <DrawParcelControl drawingActive={drawingMode} onToggleDrawing={() => setDrawingMode(!drawingMode)} onSaveParcel={handleSaveParcel} onCancelDrawing={handleCancelDrawing} isSaving={isSavingParcel} editMode={!!editingParcel} editingParcelName={editingParcel?.name || ''} />}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Property Location</span>
                </div>
                {report.applications.employment_clusters && Array.isArray(report.applications.employment_clusters) && report.applications.employment_clusters.length > 0 && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Employment Centers</span>
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ PHASE 3: Geospatial Intelligence Card */}
        <GeospatialIntelligenceCard applicationId={report.application_id} reportCreatedAt={report.created_at} />

        {/* Property Owner Card - Enhanced */}
        {(report.applications?.parcel_owner || report.applications?.parcel_id) && (
          <PropertyOwnerCard
            parcelOwner={report.applications.parcel_owner}
            parcelId={report.applications.parcel_id}
            acctNum={report.applications.acct_num}
            lotSize={report.applications.lot_size_value}
            lotSizeUnit={report.applications.lot_size_unit}
            legalDescription={[
              report.applications.legal_dscr_1,
              report.applications.legal_dscr_2,
              report.applications.legal_dscr_3,
              report.applications.legal_dscr_4
            ].filter(Boolean).join(' ') || undefined}
            agUse={report.applications.ag_use}
            homestead={report.applications.homestead}
            subdivision={report.applications.subdivision}
            block={report.applications.block}
            lot={report.applications.lot}
            neighborhood={report.applications.neighborhood}
            yearBuilt={report.applications.year_built}
            bldgSqft={report.applications.bldg_sqft}
            numStories={report.applications.num_stories}
            updatedAt={report.applications.updated_at}
            className="mb-8"
          />
        )}

        {/* Property Valuation Card - Enhanced */}
        {(report.applications?.tot_appr_val || report.applications?.bldg_sqft) && (
          <ValuationCard
            totApprVal={report.applications.tot_appr_val}
            totMarketVal={report.applications.tot_market_val}
            landVal={report.applications.land_val}
            imprvVal={report.applications.imprv_val}
            taxableValue={report.applications.taxable_value}
            bldgSqft={report.applications.bldg_sqft}
            yearBuilt={report.applications.year_built}
            effectiveYr={report.applications.effective_yr}
            numStories={report.applications.num_stories}
            stateClass={report.applications.state_class}
            propType={report.applications.prop_type}
            landUseCode={report.applications.land_use_code}
            className="mb-8"
          />
        )}

        {/* Project Feasibility Card - Enhanced */}
        {report.json_data?.project_feasibility && (
          <ProjectFeasibilityCard
            componentScore={report.json_data.project_feasibility.component_score}
            verdict={report.json_data.project_feasibility.verdict}
            zoningCompliance={report.json_data.project_feasibility.zoning_compliance}
            budgetAnalysis={report.json_data.project_feasibility.budget_analysis}
            useSpecificInsights={report.json_data.project_feasibility.use_specific_insights}
            desiredBudget={report.applications?.desired_budget}
            className="mb-8"
          />
        )}

        {/* Site Topography Card - Standalone */}
        {(report.applications?.elevation || report.applications?.topography_map_url || report.applications?.soil_slope_percent) && (
          <TopographyCard
            elevation={report.applications?.elevation}
            topographyMapUrl={report.applications?.topography_map_url}
            slopePercent={report.applications?.soil_slope_percent}
            latitude={report.applications?.geo_lat}
            longitude={report.applications?.geo_lng}
            className="mb-8"
          />
        )}


        {/* ⭐ NEW: Property Valuation Card */}
        {false && (report.applications?.tot_appr_val || report.applications?.bldg_sqft) && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Valuation & Building Characteristics
              </CardTitle>
              {/* Only show data source badges to enterprise users */}
              {productId === 'enterprise' && <DataSourceBadge datasetName="HCAD Official Assessment" timestamp={report.applications.updated_at || report.created_at} />}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valuation Section */}
                {report.applications?.tot_appr_val && <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Property Valuation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {report.applications.tot_appr_val && <div>
                          <p className="text-xs text-muted-foreground uppercase">Total Appraised</p>
                          <p className="text-2xl font-bold text-primary">
                            ${Number(report.applications.tot_appr_val).toLocaleString()}
                          </p>
                        </div>}
                      {report.applications.tot_market_val && <div>
                          <p className="text-xs text-muted-foreground uppercase">Market Value</p>
                          <p className="text-2xl font-bold">
                            ${Number(report.applications.tot_market_val).toLocaleString()}
                          </p>
                        </div>}
                      {report.applications.land_val && <div>
                          <p className="text-xs text-muted-foreground uppercase">Land Value</p>
                          <p className="text-xl font-semibold">
                            ${Number(report.applications.land_val).toLocaleString()}
                          </p>
                        </div>}
                      {report.applications.imprv_val && <div>
                          <p className="text-xs text-muted-foreground uppercase">Improvements</p>
                          <p className="text-xl font-semibold">
                            ${Number(report.applications.imprv_val).toLocaleString()}
                          </p>
                        </div>}
                    </div>
                    {report.applications.taxable_value && <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground uppercase">Taxable Value</p>
                        <p className="text-lg font-semibold">
                          ${Number(report.applications.taxable_value).toLocaleString()}
                        </p>
                      </div>}
                  </div>}

                {/* Building Characteristics Section */}
                {report.applications?.bldg_sqft && <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Building Details</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      {report.applications.bldg_sqft && <>
                          <dt className="text-muted-foreground">Building Area:</dt>
                          <dd className="font-semibold">{Number(report.applications.bldg_sqft).toLocaleString()} SF</dd>
                        </>}
                      {report.applications.year_built && <>
                          <dt className="text-muted-foreground">Year Built:</dt>
                          <dd className="font-semibold">{report.applications.year_built}</dd>
                        </>}
                      {report.applications.effective_yr && <>
                          <dt className="text-muted-foreground">Effective Year:</dt>
                          <dd className="font-semibold">{report.applications.effective_yr}</dd>
                        </>}
                      {report.applications.num_stories && <>
                          <dt className="text-muted-foreground">Stories:</dt>
                          <dd className="font-semibold">{report.applications.num_stories}</dd>
                        </>}
                      {report.applications.state_class && <>
                          <dt className="text-muted-foreground">Classification:</dt>
                          <dd className="font-semibold">{report.applications.state_class}</dd>
                        </>}
                      {report.applications.prop_type && <>
                          <dt className="text-muted-foreground">Property Type:</dt>
                          <dd className="font-semibold">{report.applications.prop_type}</dd>
                        </>}
                    </dl>
                    
                    {/* ⭐ PHASE 2: Enhanced Legal Description */}
                    {(report.applications.subdivision || report.applications.block || report.applications.lot) && <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Legal Description</p>
                        
                        {/* Structured Legal Components */}
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {report.applications.subdivision && <>
                              <dt className="text-muted-foreground">Subdivision:</dt>
                              <dd className="font-medium">{report.applications.subdivision}</dd>
                            </>}
                          {report.applications.block && <>
                              <dt className="text-muted-foreground">Block:</dt>
                              <dd className="font-medium">{report.applications.block}</dd>
                            </>}
                          {report.applications.lot && <>
                              <dt className="text-muted-foreground">Lot:</dt>
                              <dd className="font-medium">{report.applications.lot}</dd>
                            </>}
                        </dl>
                      </div>}
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ NEW: Tax & Incentives Card - PHASE 2 */}
        {(report.applications?.tax_rate_total || report.applications?.taxing_jurisdictions || report.applications?.opportunity_zone || report.applications?.enterprise_zone || report.applications?.foreign_trade_zone || report.applications?.mud_district) && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Tax & Incentives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tax Rate Section */}
                {report.applications?.tax_rate_total && <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-3xl font-bold text-primary">
                        {(report.applications.tax_rate_total * 100).toFixed(4)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Total Tax Rate</p>
                    </div>
                    
                    {/* Tax Breakdown */}
                    {report.applications?.taxing_jurisdictions && Array.isArray(report.applications.taxing_jurisdictions) && <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                        {report.applications.taxing_jurisdictions.map((jurisdiction: any, i: number) => <div key={i}>
                            <p className="text-xs text-muted-foreground">{jurisdiction.name || 'N/A'}</p>
                            <p className="font-semibold">
                              {jurisdiction.rate ? `${(jurisdiction.rate * 100).toFixed(4)}%` : 'N/A'}
                            </p>
                          </div>)}
                      </div>}
                  </div>}

                {/* Special Zones & Districts */}
                {(report.applications?.opportunity_zone || report.applications?.enterprise_zone || report.applications?.foreign_trade_zone || report.applications?.mud_district || report.applications?.etj_provider) && <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Special Designations</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.applications.opportunity_zone && <Badge variant="default" className="bg-green-600">
                          <Zap className="h-3 w-3 mr-1" />
                          Opportunity Zone
                        </Badge>}
                      {report.applications.enterprise_zone && <Badge variant="default" className="bg-blue-600">
                          Enterprise Zone
                        </Badge>}
                      {report.applications.foreign_trade_zone && <Badge variant="default" className="bg-purple-600">
                          Foreign Trade Zone
                        </Badge>}
                      {report.applications.mud_district && <Badge variant="secondary">
                          MUD: {report.applications.mud_district}
                        </Badge>}
                      {report.applications.etj_provider && <Badge variant="outline">
                          ETJ: {report.applications.etj_provider}
                        </Badge>}
                    </div>
                    
                    {report.applications.exemption_code && <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Exemption Code: </span>
                        <span className="font-medium">{report.applications.exemption_code}</span>
                      </div>}
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ NEW: Proposed Development Card */}
        {report.applications?.project_type && report.applications.project_type.length > 0 && <Card className="mb-8">
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
                    {report.applications.project_type.map((type: string) => <Badge key={type} variant="secondary">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>)}
                  </div>
                </div>
                
                {(report.applications.building_size_value || report.applications.desired_budget) && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {report.applications.building_size_value && <div>
                        <p className="text-sm text-muted-foreground">Building Size</p>
                        <p className="text-xl font-bold mt-1">
                          {Number(report.applications.building_size_value).toLocaleString()} {report.applications.building_size_unit || 'SF'}
                        </p>
                      </div>}
                    {report.applications.stories_height && <div>
                        <p className="text-sm text-muted-foreground">Stories</p>
                        <p className="text-xl font-bold mt-1">{report.applications.stories_height}</p>
                      </div>}
                    {report.applications.desired_budget && <div>
                        <p className="text-sm text-muted-foreground">Development Budget</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          ${Number(report.applications.desired_budget).toLocaleString()}
                        </p>
                      </div>}
                  </div>}

                {(report.applications.prototype_requirements || report.applications.quality_level || report.applications.tenant_requirements) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t text-sm">
                    {report.applications.prototype_requirements && <div>
                        <p className="text-muted-foreground">Prototype Requirements:</p>
                        <p className="font-medium">{report.applications.prototype_requirements}</p>
                      </div>}
                    {report.applications.quality_level && <div>
                        <p className="text-muted-foreground">Quality Level:</p>
                        <p className="font-medium">{report.applications.quality_level}</p>
                      </div>}
                    {report.applications.tenant_requirements && <div className="md:col-span-2">
                        <p className="text-muted-foreground">Tenant Requirements:</p>
                        <p className="font-medium">{report.applications.tenant_requirements}</p>
                      </div>}
                  </div>}

                {(report.applications.access_priorities || report.applications.known_risks || report.applications.utility_access || report.applications.environmental_constraints) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t text-sm">
                    {report.applications.access_priorities && report.applications.access_priorities.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Access Priorities:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.access_priorities.map((priority: string) => <Badge key={priority} variant="outline" className="text-xs">
                              {priority.replace(/_/g, ' ')}
                            </Badge>)}
                        </div>
                      </div>}
                    {report.applications.known_risks && report.applications.known_risks.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Known Risks:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.known_risks.map((risk: string) => <Badge key={risk} variant="outline" className="text-xs">
                              {risk.replace(/_/g, ' ')}
                            </Badge>)}
                        </div>
                      </div>}
                    {report.applications.utility_access && report.applications.utility_access.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Required Utilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.utility_access.map((utility: string) => <Badge key={utility} variant="outline" className="text-xs">
                              {utility.replace(/_/g, ' ')}
                            </Badge>)}
                        </div>
                      </div>}
                    {report.applications.environmental_constraints && report.applications.environmental_constraints.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Environmental Constraints:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applications.environmental_constraints.map((constraint: string) => <Badge key={constraint} variant="outline" className="text-xs">
                              {constraint.replace(/_/g, ' ')}
                            </Badge>)}
                        </div>
                      </div>}
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ NEW: Project Feasibility Analysis Card */}
        {report.json_data?.project_feasibility && <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Feasibility Analysis</CardTitle>
              {report.json_data.project_feasibility.component_score && <Badge className="mt-2">
                  Score: {report.json_data.project_feasibility.component_score}/100
                </Badge>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.json_data.project_feasibility.verdict && <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(report.json_data.project_feasibility.verdict)
                }} />}
                
                {report.json_data.project_feasibility.zoning_compliance && <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Zoning Compliance:</span>
                    <Badge variant={report.json_data.project_feasibility.zoning_compliance === 'permitted' ? 'default' : report.json_data.project_feasibility.zoning_compliance === 'conditional' ? 'secondary' : 'destructive'}>
                      {report.json_data.project_feasibility.zoning_compliance?.toUpperCase().replace(/_/g, ' ')}
                    </Badge>
                  </div>}

                {report.json_data.project_feasibility.use_specific_insights && report.json_data.project_feasibility.use_specific_insights.length > 0 && <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm">Use-Specific Insights:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {report.json_data.project_feasibility.use_specific_insights.map((insight: string, i: number) => <li key={i}>{insight}</li>)}
                    </ul>
                  </div>}

                {report.json_data.project_feasibility.budget_analysis && <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Budget Analysis:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {report.json_data.project_feasibility.budget_analysis.estimated_hard_costs && <div>
                          <p className="text-muted-foreground">Hard Costs:</p>
                          <p className="font-semibold">${Number(report.json_data.project_feasibility.budget_analysis.estimated_hard_costs).toLocaleString()}</p>
                        </div>}
                      {report.json_data.project_feasibility.budget_analysis.estimated_soft_costs && <div>
                          <p className="text-muted-foreground">Soft Costs:</p>
                          <p className="font-semibold">${Number(report.json_data.project_feasibility.budget_analysis.estimated_soft_costs).toLocaleString()}</p>
                        </div>}
                      {report.json_data.project_feasibility.budget_analysis.budget_adequacy && <div>
                          <p className="text-muted-foreground">Budget Status:</p>
                          <Badge variant={report.json_data.project_feasibility.budget_analysis.budget_adequacy === 'adequate' ? 'default' : report.json_data.project_feasibility.budget_analysis.budget_adequacy === 'tight' ? 'secondary' : 'destructive'}>
                            {report.json_data.project_feasibility.budget_analysis.budget_adequacy?.toUpperCase()}
                          </Badge>
                        </div>}
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ NEW: Cost & Timeline Card - PHASE 1 */}
        {(report.json_data?.cost_schedule || report.applications?.costs_output || report.applications?.schedule_output) && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cost & Timeline Analysis
              </CardTitle>
              {report.json_data?.cost_schedule?.component_score && <Badge className="mt-2">
                  Score: {report.json_data.cost_schedule.component_score}/100
                </Badge>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline Section */}
                {report.json_data?.cost_schedule?.estimated_timeline_months && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    
                    {report.json_data?.cost_schedule?.permitting_complexity && <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Complexity</span>
                        </div>
                        <Badge variant={report.json_data.cost_schedule.permitting_complexity === 'low' ? 'default' : report.json_data.cost_schedule.permitting_complexity === 'moderate' ? 'secondary' : 'destructive'} className="text-lg">
                          {report.json_data.cost_schedule.permitting_complexity?.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">permitting level</p>
                      </div>}
                    
                    {report.applications?.desired_budget && <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Project Budget</span>
                        </div>
                        <p className="text-2xl font-bold">
                          ${(report.applications.desired_budget / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">development budget</p>
                      </div>}
                  </div>}

                {/* Critical Path Items */}
                {report.json_data?.cost_schedule?.critical_path_items && report.json_data.cost_schedule.critical_path_items.length > 0 && <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      Critical Path Items
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {report.json_data.cost_schedule.critical_path_items.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>}

                {/* AI Analysis Output */}
                {(report.applications?.schedule_output || report.applications?.costs_output) && <div className="pt-4 border-t">
                    {report.applications.schedule_output && <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-sm">Schedule Analysis:</h4>
                        <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(report.applications.schedule_output)
                    }} />
                      </div>}
                    {report.applications.costs_output && <div>
                        <h4 className="font-semibold mb-2 text-sm">Cost Analysis:</h4>
                        <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(report.applications.costs_output)
                    }} />
                      </div>}
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* ⭐ NEW: Permitting Timeline Section */}
        {report.applications?.average_permit_time_months && <Card className="mb-8">
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

                  {report.applications.city && <div className="p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Jurisdiction</span>
                      </div>
                      <p className="text-lg font-semibold">{report.applications.city}</p>
                      <p className="text-sm text-muted-foreground">{report.applications.county} County</p>
                    </div>}

                  {report.json_data?.cost_schedule?.permitting_complexity && <div className="p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Complexity Level</span>
                      </div>
                      <Badge variant={report.json_data.cost_schedule.permitting_complexity === 'low' ? 'default' : report.json_data.cost_schedule.permitting_complexity === 'moderate' ? 'secondary' : 'destructive'} className="text-lg px-4 py-1">
                        {report.json_data.cost_schedule.permitting_complexity?.toUpperCase()}
                      </Badge>
                    </div>}
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
                {report.applications.city && <div className="pt-4 border-t bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4">
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
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* Visual Assets Section */}
        {report.report_assets?.static_map_url && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Site Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <img src={report.report_assets.static_map_url} alt="Property map with parcel, flood zones, and utilities" className="w-full rounded-lg shadow-lg" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Property boundary (blue), FEMA flood zone (yellow), utilities (orange)
                </p>
              </div>
              
              {report.report_assets.streetview && report.report_assets.streetview.length > 0 && <div>
                  <h4 className="font-semibold mb-3">Street View Photos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {report.report_assets.streetview.map(sv => <div key={sv.direction}>
                        <img src={sv.url} alt={`Street view looking ${sv.direction}`} className="rounded-lg shadow-md w-full" />
                        <p className="text-sm text-center mt-2 text-muted-foreground">
                          {sv.direction} View
                        </p>
                      </div>)}
                  </div>
                </div>}
            </CardContent>
          </Card>}

        {/* Detailed Analysis Tabs */}
        {/* ========== DETAILED ANALYSIS SECTIONS ========== */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Detailed Analysis
          </h2>

          {/* Sticky Section Navigation */}
          <SectionNav />

          {/* 1. Zoning Analysis */}
          <section id="section-zoning">
            <ZoningCard
              score={zoning.component_score || 0}
              zoningCode={report.applications?.zoning_code}
              zoningDescription={zoning.description}
              permittedUses={zoning.permitted_uses}
              conditionalUses={zoning.conditional_uses}
              overlayDistricts={zoning.overlay_districts}
              verdict={zoning.verdict}
            />
          </section>

          {/* 2. Flood Risk */}
          <section id="section-flood">
            <FloodRiskCard
              score={flood.component_score || 0}
              floodZone={report.applications?.floodplain_zone}
              baseFloodElevation={report.applications?.base_flood_elevation}
              bfeSource={report.applications?.base_flood_elevation_source}
              firmPanel={report.applications?.fema_firm_panel}
              historicalEvents={report.applications?.historical_flood_events}
              nfipClaims={report.applications?.nfip_claims_count}
              verdict={flood.verdict}
            />
          </section>

          {/* 3. Utilities */}
          <section id="section-utilities">
            <UtilitiesCard
              score={utilities.component_score || 0}
              waterLines={report.applications?.water_lines}
              sewerLines={report.applications?.sewer_lines}
              stormLines={report.applications?.storm_lines}
              powerKv={report.applications?.power_kv_nearby}
              fiberAvailable={report.applications?.fiber_available}
              broadbandProviders={report.applications?.broadband_providers}
              waterCapacity={report.applications?.water_capacity_mgd}
              sewerCapacity={report.applications?.sewer_capacity_mgd}
              mudDistrict={report.applications?.mud_district}
              etjProvider={report.applications?.etj_provider}
              wcidDistrict={report.applications?.wcid_district}
              verdict={utilities.verdict}
            />
          </section>

          {/* 4. Environmental */}
          <section id="section-environmental">
            <EnvironmentalCard
              score={environmental.component_score || 0}
              wetlandsType={report.applications?.wetlands_type}
              wetlandsPercent={report.applications?.wetlands_area_pct}
              soilSeries={report.applications?.soil_series}
              soilDrainage={report.applications?.soil_drainage_class}
              soilSlope={report.applications?.soil_slope_percent}
              environmentalSites={report.applications?.environmental_sites}
              epaFacilitiesCount={report.applications?.epa_facilities_count}
              elevation={report.applications?.elevation}
              disasterDeclarations={report.applications?.disaster_declarations}
              environmentalConstraints={report.applications?.environmental_constraints}
              verdict={environmental.verdict}
            />
          </section>

          {/* 5. Traffic */}
          <section id="section-traffic">
            <TrafficCard
              score={traffic.component_score || 0}
              aadt={report.applications?.traffic_aadt}
              roadName={report.applications?.traffic_road_name}
              trafficYear={report.applications?.traffic_year}
              truckPercent={report.applications?.truck_percent}
              congestionLevel={report.applications?.congestion_level}
              trafficDirection={report.applications?.traffic_direction}
              peakHourVolume={report.applications?.peak_hour_volume}
              trafficMapUrl={report.applications?.traffic_map_url}
              speedLimit={report.applications?.speed_limit}
              surfaceType={report.applications?.surface_type}
              verdict={traffic.verdict}
            />
          </section>

          {/* 6. Market Demographics */}
          <section id="section-market">
            <MarketCard
              score={marketDemographics.component_score || 0}
              population1mi={report.applications?.population_1mi}
              population3mi={report.applications?.population_3mi}
              population5mi={report.applications?.population_5mi}
              driveTime15min={report.applications?.drive_time_15min_population}
              driveTime30min={report.applications?.drive_time_30min_population}
              medianIncome={report.applications?.median_income}
              households5mi={report.applications?.households_5mi}
              growthRate5yr={report.applications?.growth_rate_5yr}
              verdict={marketDemographics.verdict}
            />
            
            {/* Extended Housing & Employment Demographics */}
            <ExtendedDemographicsCard
              medianHomeValue={report.applications?.median_home_value}
              medianRent={report.applications?.median_rent}
              vacancyRate={report.applications?.vacancy_rate}
              unemploymentRate={report.applications?.unemployment_rate}
              medianAge={report.applications?.median_age}
              collegeAttainmentPct={report.applications?.college_attainment_pct}
              totalHousingUnits={report.applications?.total_housing_units}
              laborForce={report.applications?.labor_force}
              retailSpendingIndex={report.applications?.retail_spending_index}
              workforceAvailabilityScore={report.applications?.workforce_availability_score}
              growthPotentialIndex={report.applications?.growth_potential_index}
              affluenceConcentration={report.applications?.affluence_concentration}
              laborPoolDepth={report.applications?.labor_pool_depth}
              growthTrajectory={report.applications?.growth_trajectory}
              marketOutlook={report.applications?.market_outlook}
              demographicsSource={report.applications?.demographics_source === 'census_moat' ? 'canonical' : undefined}
              censusGeoid={report.applications?.census_block_group}
              countyFips={report.applications?.census_block_group?.substring(2, 5)}
              acsVintage={report.applications?.census_vintage}
              countyComparison={countyComparison}
              className="mt-6"
            />
          </section>

          {/* 7. Access & Connectivity */}
          <section id="section-access">
            <AccessCard
              score={traffic.component_score || 0}
              distanceHighwayFt={report.applications?.distance_highway_ft}
              distanceTransitFt={report.applications?.distance_transit_ft}
              nearestHighway={report.applications?.nearest_highway}
              nearestTransitStop={report.applications?.nearest_transit_stop}
              nearestSignalDistanceFt={report.applications?.nearest_signal_distance_ft}
              roadClassification={report.applications?.road_classification}
              driveTimeData={report.applications?.drivetimes}
            />
          </section>

          {/* 8. Tax & Incentives */}
          <section id="section-tax">
            <TaxJurisdictionCard
              taxRateTotal={report.applications?.tax_rate_total}
              taxableValue={report.applications?.taxable_value}
              landVal={report.applications?.land_val}
              imprvVal={report.applications?.imprv_val}
              totApprVal={report.applications?.tot_appr_val}
              totMarketVal={report.applications?.tot_market_val}
              taxingJurisdictions={report.applications?.taxing_jurisdictions}
              opportunityZone={report.applications?.opportunity_zone}
              enterpriseZone={report.applications?.enterprise_zone}
              foreignTradeZone={report.applications?.foreign_trade_zone}
              averagePermitTimeMonths={report.applications?.average_permit_time_months}
              mudDistrict={report.applications?.mud_district}
              etjProvider={report.applications?.etj_provider}
              wcidDistrict={report.applications?.wcid_district}
            />
          </section>

          {/* 9. Employment Context */}
          <section id="section-employment">
            <EmploymentContextCard
              submarketEnriched={report.applications?.submarket_enriched}
              employmentClusters={report.applications?.employment_clusters}
              nearbyPlaces={report.applications?.nearby_places}
            />
          </section>
        </div>

        {/* Intent-Specific Next Steps */}
        {report.applications.intent_type && <Card className="mt-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.applications.intent_type === 'build' ? <>
                    <Zap className="text-primary" />
                    Next Steps for Development
                  </> : <>
                    <DollarSign className="text-primary" />
                    Next Steps for Investment
                  </>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.applications.intent_type === 'build' ? <>
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://schedulr.siteintel.ai', '_blank')}>
                    <Clock className="mr-2 h-4 w-4" />
                    📅 Explore Schedule & Cost with Schedulr™
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    🏛️ Connect with Entitlement Consultant
                  </Button>
                </> : <>
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.floodsmart.gov/', '_blank')}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    🌊 Get Flood Insurance Quote
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    📊 Compare Similar Parcels (Coming Soon)
                  </Button>
                </>}
            </CardContent>
          </Card>}
            {/* Verified Data Sources - Bottom Section */}
            <div className="mt-12 pt-8 border-t border-border">
              <DataSourcesDisplay dataSources={dataSources} accessLevel={!isAuthenticated ? 'public' : !isOwner ? 'authenticated' : productId === 'enterprise' ? 'enterprise' : 'owner'} />
            </div>
          </div>
        );
        })()}
          </main>

          {/* AI Chat Assistant */}
          {report && report.applications && <ReportChatAssistant reportData={report} applicationData={report.applications} />}
        </div>
      </div>
    </SidebarProvider>
  );
}