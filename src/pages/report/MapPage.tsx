import { useReportContext } from "@/contexts/ReportContext";
import { DecisionMap } from "@/components/report/DecisionMap";

export default function MapPage() {
  const { report, mapLayers } = useReportContext();

  if (!report) return null;

  const center: [number, number] = report.applications?.geo_lat && report.applications?.geo_lng
    ? [report.applications.geo_lng, report.applications.geo_lat]
    : [-95.3698, 29.7604]; // Default to Houston

  return (
    <div className="space-y-6" id="section-map">
      <div className="h-[calc(100vh-300px)] min-h-[500px]">
        <DecisionMap
          center={center}
          parcel={mapLayers?.parcel}
          floodZones={mapLayers?.flood}
          utilities={mapLayers?.utilities}
          waterLines={report.applications?.water_lines}
          sewerLines={report.applications?.sewer_lines}
          stormLines={report.applications?.storm_lines}
          drawnParcels={mapLayers?.drawnParcels}
          propertyAddress={report.applications?.formatted_address}
          className="h-full rounded-lg"
        />
      </div>
    </div>
  );
}
