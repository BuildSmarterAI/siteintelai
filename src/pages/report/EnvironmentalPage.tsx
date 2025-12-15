import { useReportContext } from "@/contexts/ReportContext";
import { EnvironmentalCard } from "@/components/report/EnvironmentalCard";
import { TopographyCard } from "@/components/report/TopographyCard";

export default function EnvironmentalPage() {
  const { report, environmental } = useReportContext();

  if (!report) return null;

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

      <TopographyCard
        elevation={report.applications?.elevation}
        topographyMapUrl={report.applications?.topography_map_url}
        slopePercent={report.applications?.soil_slope_percent}
        latitude={report.applications?.geo_lat}
        longitude={report.applications?.geo_lng}
      />
    </div>
  );
}
