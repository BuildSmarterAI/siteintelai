import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Report, CountyComparison, ParsedReportData, DataFreshness } from "@/types/report";
import { useMapLayers } from "@/hooks/useMapLayers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useReEnrichApplication } from "@/hooks/useReEnrichApplication";
import { VerdictType } from "@/components/report/ExecutiveVerdictBar";

export interface UseReportDataReturn {
  report: Report | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  showPreview: boolean;
  showGate: boolean;
  setShowGate: (show: boolean) => void;
  geospatialData: any;
  countyComparison: CountyComparison | null;
  pdfGenerating: boolean;
  pdfError: boolean;
  // Parsed data
  parsedData: ParsedReportData;
  summary: any;
  zoning: any;
  flood: any;
  utilities: any;
  environmental: any;
  traffic: any;
  marketDemographics: any;
  dataSources: any[];
  // Computed values
  hasKillFactors: boolean;
  verdict: VerdictType;
  confidence: number;
  dataFreshness: DataFreshness;
  // Map layers
  mapLayers: any;
  refetchMapLayers: () => void;
  // Admin
  isAdmin: boolean;
  // Actions
  refetchReport: () => Promise<void>;
  handleAuthSuccess: () => void;
  handleReEnrich: () => Promise<void>;
  reEnrichLoading: boolean;
}

export function useReportData(reportId: string | undefined): UseReportDataReturn {
  const navigate = useNavigate();
  const { productId } = useSubscription();
  const { isAdmin } = useAdminRole();
  const { reEnrich, loading: reEnrichLoading } = useReEnrichApplication();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [geospatialData, setGeospatialData] = useState<any>(null);
  const [countyComparison, setCountyComparison] = useState<CountyComparison | null>(null);

  // Map layers
  const {
    data: mapLayers,
    refetch: refetchMapLayers,
  } = useMapLayers(report?.application_id || '');

  // Fetch report
  const fetchReport = useCallback(async (userId?: string) => {
    if (!reportId) return;
    
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
            traffic_distance_ft,
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
            acreage_cad,
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
            census_vintage,
            under_18_pct,
            working_age_pct,
            over_65_pct,
            white_pct,
            black_pct,
            asian_pct,
            hispanic_pct,
            per_capita_income,
            mean_household_income,
            poverty_rate,
            gini_index,
            owner_occupied_pct,
            renter_occupied_pct,
            single_family_pct,
            multi_family_pct,
            median_year_built,
            population_block_group,
            avg_household_size,
            white_collar_pct,
            blue_collar_pct,
            service_sector_pct,
            work_from_home_pct,
            mean_commute_time_min,
            drive_alone_pct,
            public_transit_pct,
            walk_bike_pct,
            high_school_only_pct,
            some_college_pct,
            bachelors_pct,
            graduate_degree_pct,
            population_cagr,
            population_5yr_projection,
            median_income_5yr_projection,
            median_home_value_5yr_projection,
            population_density_sqmi
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

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
        setShowPreview(!userId || !owner);
        setShowGate(false);
      } else {
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
  }, [reportId, navigate]);

  const checkAuthAndFetchReport = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const authenticated = !!session?.user;
    setIsAuthenticated(authenticated);
    await fetchReport(session?.user?.id);
  }, [fetchReport]);

  // Initial fetch
  useEffect(() => {
    if (reportId) {
      checkAuthAndFetchReport();
    }
  }, [reportId, checkAuthAndFetchReport]);

  // Fetch geospatial data
  useEffect(() => {
    if (!report?.application_id) return;
    async function fetchGeospatialData() {
      const { data } = await supabase
        .from('feasibility_geospatial')
        .select('*')
        .eq('application_id', report.application_id)
        .single();
      if (data) {
        setGeospatialData(data);
      }
    }
    fetchGeospatialData();
  }, [report?.application_id]);

  // Fetch county comparison
  useEffect(() => {
    if (!report?.applications?.census_block_group) return;
    
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

  // Poll for PDF generation
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

  // Computed values
  const reportData = report?.json_data || {};
  let parsedData: ParsedReportData = reportData;
  
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
  const dataSources = productId === 'enterprise' && parsedData.data_sources ? parsedData.data_sources : [];

  const calculateConfidence = (): number => {
    let score = 50;
    if (report?.applications?.geo_lat && report?.applications?.geo_lng) score += 10;
    if (report?.applications?.zoning_code) score += 10;
    if (report?.applications?.floodplain_zone) score += 10;
    if (report?.applications?.water_lines?.length) score += 5;
    if (report?.applications?.sewer_lines?.length) score += 5;
    if (report?.applications?.traffic_aadt) score += 5;
    if (report?.applications?.tot_market_val) score += 5;
    return Math.min(100, score);
  };

  const getDataFreshness = (): DataFreshness => {
    const updatedAt = report?.applications?.updated_at;
    if (!updatedAt) return "stale";
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) return "fresh";
    if (daysSinceUpdate < 30) return "recent";
    return "stale";
  };

  const hasKillFactors = 
    report?.applications?.floodplain_zone?.toLowerCase().includes('floodway') ||
    report?.applications?.floodplain_zone === 'AE' ||
    (report?.applications?.wetlands_area_pct ?? 0) >= 25 ||
    (parsedData.environmental?.kill_factors?.length > 0);

  const getVerdict = (): VerdictType => {
    const score = report?.feasibility_score ?? 0;
    if (hasKillFactors) return "DO_NOT_PROCEED";
    if (score >= 75) return "PROCEED";
    if (score >= 50) return "CONDITIONAL";
    return "DO_NOT_PROCEED";
  };

  const handleAuthSuccess = () => {
    setShowGate(false);
    setShowPreview(false);
    checkAuthAndFetchReport();
    toast.success('Welcome! Full report unlocked');
  };

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
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    }
  };

  return {
    report,
    loading,
    isAuthenticated,
    isOwner,
    showPreview,
    showGate,
    setShowGate,
    geospatialData,
    countyComparison,
    pdfGenerating,
    pdfError,
    parsedData,
    summary,
    zoning,
    flood,
    utilities,
    environmental,
    traffic,
    marketDemographics,
    dataSources,
    hasKillFactors,
    verdict: getVerdict(),
    confidence: calculateConfidence(),
    dataFreshness: getDataFreshness(),
    mapLayers,
    refetchMapLayers,
    isAdmin,
    refetchReport: () => fetchReport(),
    handleAuthSuccess,
    handleReEnrich,
    reEnrichLoading,
  };
}
