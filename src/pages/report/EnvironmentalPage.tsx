import { useReportContext } from "@/contexts/ReportContext";
import { EnvironmentalCard } from "@/components/report/EnvironmentalCard";
import { TopographyCard } from "@/components/report/TopographyCard";
import { ElevationMapCard } from "@/components/report/ElevationMapCard";

export default function EnvironmentalPage() {
  const { report, environmental } = useReportContext();

  if (!report) return null;

  const hasCoordinates = report.applications?.geo_lat && report.applications?.geo_lng;
  
  // Type assertion for enhanced SSURGO fields (added via migration, types will update on next sync)
  const app = report.applications as Record<string, any> | undefined;

  return (
    <div className="space-y-6" id="section-environmental">
      <EnvironmentalCard
        score={report.feasibility_score ?? 0}
        wetlandsType={app?.wetlands_type}
        wetlandsPercent={app?.wetlands_area_pct}
        wetlandCowardinCode={app?.wetland_cowardin_code}
        soilSeries={app?.soil_series}
        soilDrainage={app?.soil_drainage_class}
        soilSlope={app?.soil_slope_percent}
        hydricSoilRating={app?.hydric_soil_rating}
        floodFrequencyUsda={app?.flood_frequency_usda}
        waterTableDepthCm={app?.water_table_depth_cm}
        bedrockDepthCm={app?.bedrock_depth_cm}
        pondingFrequency={app?.ponding_frequency}
        erosionKFactor={app?.erosion_k_factor}
        corrosionConcrete={app?.corrosion_concrete}
        corrosionSteel={app?.corrosion_steel}
        septicSuitability={app?.septic_suitability}
        buildingSiteRating={app?.building_site_rating}
        // ⭐ NEW: Shrink-Swell Potential (Foundation Risk)
        shrinkSwellPotential={app?.shrink_swell_potential}
        linearExtensibilityPct={app?.linear_extensibility_pct}
        // ⭐ NEW: USGS Groundwater Data
        groundwaterDepthFt={app?.groundwater_depth_ft}
        groundwaterWellDistanceFt={app?.groundwater_well_distance_ft}
        groundwaterMeasurementDate={app?.groundwater_measurement_date}
        nearestGroundwaterWellId={app?.nearest_groundwater_well_id}
        // Other props
        epaFacilitiesCount={app?.epa_facilities_count}
        environmentalSites={app?.environmental_sites}
        elevation={app?.elevation}
        disasterDeclarations={app?.disaster_declarations}
        environmentalConstraints={app?.environmental_constraints}
        verdict={environmental?.verdict}
      />

      {/* Terrain & Topography Section */}
      {hasCoordinates && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ElevationMapCard
              latitude={report.applications!.geo_lat!}
              longitude={report.applications!.geo_lng!}
              elevation={app?.elevation}
            />
          </div>
          <div className="lg:col-span-1">
            <TopographyCard
              elevation={app?.elevation}
              topographyMapUrl={app?.topography_map_url}
              slopePercent={app?.soil_slope_percent}
              latitude={app?.geo_lat}
              longitude={app?.geo_lng}
            />
          </div>
        </div>
      )}

      {!hasCoordinates && (
        <TopographyCard
          elevation={app?.elevation}
          topographyMapUrl={app?.topography_map_url}
          slopePercent={app?.soil_slope_percent}
          latitude={app?.geo_lat}
          longitude={app?.geo_lng}
        />
      )}
    </div>
  );
}
