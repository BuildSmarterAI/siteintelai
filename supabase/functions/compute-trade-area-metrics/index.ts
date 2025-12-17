import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as h3 from 'https://esm.sh/h3-js@4.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeAreaRequest {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  h3Resolution?: number;
  metric?: string;
}

interface H3CellData {
  h3Index: string;
  lat: number;
  lng: number;
  value: number;
  population: number;
  income: number;
  growth: number;
  geoid?: string;
}

interface TradeAreaMetrics {
  totalPopulation: number;
  medianIncome: number;
  medianAge: number;
  medianHomeValue: number;
  ownerOccupiedPct: number;
  renterOccupiedPct: number;
  totalHousingUnits: number;
  populationDensity: number;
  under18Pct: number;
  over65Pct: number;
  workingAgePct: number;
  whiteCollarPct: number;
  blueCollarPct: number;
  unemploymentRate: number;
  povertyRate: number;
  collegeEducatedPct: number;
  retailSpendingIndex: number;
  workforceAvailabilityScore: number;
  growthPotentialIndex: number;
  affluenceConcentration: number;
  laborPoolDepth: number;
  daytimePopulationEstimate: number;
  growthRate5yr: number;
  medianIncomeProjection: number;
  homeValueProjection: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { centerLat, centerLng, radiusMiles, h3Resolution = 8, metric = 'population' }: TradeAreaRequest = await req.json();

    console.log(`[compute-trade-area-metrics] Computing for (${centerLat}, ${centerLng}) radius ${radiusMiles}mi`);

    if (!centerLat || !centerLng || !radiusMiles) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: centerLat, centerLng, radiusMiles' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate H3 cells covering the trade area
    const centerCell = h3.latLngToCell(centerLat, centerLng, h3Resolution);
    const hexEdgeKm = h3.getHexagonEdgeLengthAvg(h3Resolution, 'km');
    const radiusKm = radiusMiles * 1.60934;
    const kRingSize = Math.ceil(radiusKm / (hexEdgeKm * 1.5));
    const cellSet = h3.gridDisk(centerCell, kRingSize);

    console.log(`[compute-trade-area-metrics] Generated ${cellSet.length} H3 cells at resolution ${h3Resolution}`);

    // Query demographics for each cell's centroid
    const cellDataPromises = cellSet.map(async (h3Index) => {
      const [lat, lng] = h3.cellToLatLng(h3Index);
      
      // Use PostGIS spatial lookup via RPC (note: p_lng comes before p_lat)
      const { data: demographics, error } = await supabase.rpc('get_demographics_for_point', {
        p_lng: lng,
        p_lat: lat
      });

      // RPC returns array of records - check if we got data
      if (error || !demographics || (Array.isArray(demographics) && demographics.length === 0)) {
        return null;
      }

      // Handle both single record and array response
      const demo = Array.isArray(demographics) ? demographics[0] : demographics;
      
      // Map metric to value for visualization
      let value: number;
      switch (metric) {
        case 'income':
          value = demo.median_household_income || 0;
          break;
        case 'growth':
          value = demo.growth_potential_index || 0;
          break;
        case 'spending':
          value = demo.retail_spending_index || 0;
          break;
        case 'employment':
          value = 100 - (demo.unemployment_rate || 5);
          break;
        case 'population':
        default:
          value = demo.total_population || 0;
      }

      return {
        h3Index,
        lat,
        lng,
        value: Math.round(value),
        population: demo.total_population || 0,
        income: demo.median_household_income || 0,
        growth: demo.growth_potential_index || 0,
        geoid: demo.geoid,
        // Store full demographics for aggregation
        _demographics: demo
      };
    });

    const cellResults = await Promise.all(cellDataPromises);
    const validCells = cellResults.filter((c): c is NonNullable<typeof c> => c !== null);

    console.log(`[compute-trade-area-metrics] Retrieved data for ${validCells.length}/${cellSet.length} cells`);

    // Aggregate metrics with population weighting
    const aggregatedMetrics = aggregateMetrics(validCells);

    // Format response cells (remove internal _demographics)
    const cells: H3CellData[] = validCells.map(({ _demographics, ...cell }) => cell);

    // Calculate min/max for color scaling
    const values = cells.map(c => c.value);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 100;

    return new Response(
      JSON.stringify({
        success: true,
        metrics: aggregatedMetrics,
        cells,
        cellCount: cells.length,
        minValue,
        maxValue,
        coverage: {
          requestedCells: cellSet.length,
          coveredCells: validCells.length,
          coveragePercent: Math.round((validCells.length / cellSet.length) * 100)
        },
        dataSource: 'U.S. Census ACS 2022 via SiteIntel canonical_demographics'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[compute-trade-area-metrics] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function aggregateMetrics(cells: any[]): TradeAreaMetrics {
  if (cells.length === 0) {
    return getEmptyMetrics();
  }

  // Get all demographics data
  const demographics = cells.map(c => c._demographics).filter(Boolean);
  
  // Calculate total population for weighting
  const totalPop = demographics.reduce((sum, d) => sum + (d.total_population || 0), 0);
  
  // Population-weighted average helper
  const weightedAvg = (field: string): number => {
    if (totalPop === 0) return 0;
    const sum = demographics.reduce((acc, d) => {
      const pop = d.total_population || 0;
      const val = d[field] || 0;
      return acc + (val * pop);
    }, 0);
    return sum / totalPop;
  };

  // Simple average helper for percentages
  const simpleAvg = (field: string): number => {
    const validVals = demographics.filter(d => d[field] != null).map(d => d[field]);
    if (validVals.length === 0) return 0;
    return validVals.reduce((a, b) => a + b, 0) / validVals.length;
  };

  // Aggregate all metrics
  return {
    totalPopulation: totalPop,
    medianIncome: Math.round(weightedAvg('median_household_income')),
    medianAge: Math.round(weightedAvg('median_age') * 10) / 10,
    medianHomeValue: Math.round(weightedAvg('median_home_value')),
    ownerOccupiedPct: Math.round(simpleAvg('owner_occupied_pct') * 10) / 10,
    renterOccupiedPct: Math.round(simpleAvg('renter_occupied_pct') * 10) / 10,
    totalHousingUnits: demographics.reduce((sum, d) => sum + (d.total_housing_units || 0), 0),
    populationDensity: Math.round(simpleAvg('population_density_sqmi')),
    under18Pct: Math.round(simpleAvg('under_18_pct') * 10) / 10,
    over65Pct: Math.round(simpleAvg('over_65_pct') * 10) / 10,
    workingAgePct: Math.round(simpleAvg('working_age_pct') * 10) / 10,
    whiteCollarPct: Math.round(simpleAvg('white_collar_pct') * 10) / 10,
    blueCollarPct: Math.round(simpleAvg('blue_collar_pct') * 10) / 10,
    unemploymentRate: Math.round(simpleAvg('unemployment_rate') * 10) / 10,
    povertyRate: Math.round(simpleAvg('poverty_rate') * 10) / 10,
    collegeEducatedPct: Math.round((simpleAvg('bachelors_pct') + simpleAvg('graduate_degree_pct')) * 10) / 10,
    // Proprietary CRE indices
    retailSpendingIndex: Math.round(simpleAvg('retail_spending_index')),
    workforceAvailabilityScore: Math.round(simpleAvg('workforce_availability_score')),
    growthPotentialIndex: Math.round(simpleAvg('growth_potential_index')),
    affluenceConcentration: Math.round(simpleAvg('affluence_concentration')),
    laborPoolDepth: Math.round(simpleAvg('labor_pool_depth')),
    daytimePopulationEstimate: demographics.reduce((sum, d) => sum + (d.daytime_population_estimate || 0), 0),
    // Growth projections (5-year)
    growthRate5yr: Math.round(simpleAvg('growth_potential_index') * 0.8 * 10) / 10, // Derived estimate
    medianIncomeProjection: Math.round(weightedAvg('median_household_income') * 1.12), // 12% growth estimate
    homeValueProjection: Math.round(weightedAvg('median_home_value') * 1.15), // 15% growth estimate
  };
}

function getEmptyMetrics(): TradeAreaMetrics {
  return {
    totalPopulation: 0,
    medianIncome: 0,
    medianAge: 0,
    medianHomeValue: 0,
    ownerOccupiedPct: 0,
    renterOccupiedPct: 0,
    totalHousingUnits: 0,
    populationDensity: 0,
    under18Pct: 0,
    over65Pct: 0,
    workingAgePct: 0,
    whiteCollarPct: 0,
    blueCollarPct: 0,
    unemploymentRate: 0,
    povertyRate: 0,
    collegeEducatedPct: 0,
    retailSpendingIndex: 0,
    workforceAvailabilityScore: 0,
    growthPotentialIndex: 0,
    affluenceConcentration: 0,
    laborPoolDepth: 0,
    daytimePopulationEstimate: 0,
    growthRate5yr: 0,
    medianIncomeProjection: 0,
    homeValueProjection: 0,
  };
}
