import { useReportContext } from "@/contexts/ReportContext";
import { EnvironmentalCard } from "@/components/report/EnvironmentalCard";
import { TopographyCard } from "@/components/report/TopographyCard";
import { ElevationMapCard } from "@/components/report/ElevationMapCard";

export default function EnvironmentalPage() {
  const { report, environmental } = useReportContext();

  if (!report) return null;

  const hasCoordinates = report.applications?.geo_lat && report.applications?.geo_lng;

  return (
    <div className="space-y-6" id="section-environmental">
      <EnvironmentalCard
        score={report.feasibility_score ?? 0}
        wetlandsType={report.applications?.wetlands_type}
        wetlandsPercent={report.applications?.wetlands_area_pct}
        soilSeries={report.applications?.soil_series}
        soilDrainage={report.applications?.soil_drainage_class}
        soilSlope={report.applications?.soil_slope_percent}
        epaFacilitiesCount={report.applications?.epa_facilities_count}
        environmentalSites={report.applications?.environmental_sites}
        elevation={report.applications?.elevation}
        disasterDeclarations={report.applications?.disaster_declarations}
        environmentalConstraints={report.applications?.environmental_constraints}
        verdict={environmental?.verdict}
      />

      {/* Terrain & Topography Section */}
      {hasCoordinates && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Elevation Map - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <ElevationMapCard
              latitude={report.applications!.geo_lat!}
              longitude={report.applications!.geo_lng!}
              elevation={report.applications?.elevation}
            />
          </div>

          {/* Topography Data Card - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <TopographyCard
              elevation={report.applications?.elevation}
              topographyMapUrl={report.applications?.topography_map_url}
              slopePercent={report.applications?.soil_slope_percent}
              latitude={report.applications?.geo_lat}
              longitude={report.applications?.geo_lng}
            />
          </div>
        </div>
      )}

      {/* Fallback for no coordinates */}
      {!hasCoordinates && (
        <TopographyCard
          elevation={report.applications?.elevation}
          topographyMapUrl={report.applications?.topography_map_url}
          slopePercent={report.applications?.soil_slope_percent}
          latitude={report.applications?.geo_lat}
          longitude={report.applications?.geo_lng}
        />
      )}
    </div>
  );
}
