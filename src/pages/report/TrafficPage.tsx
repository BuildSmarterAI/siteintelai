import { useReportContext } from "@/contexts/ReportContext";
import { TrafficCard } from "@/components/report/TrafficCard";
import { AccessCard } from "@/components/report/AccessCard";

export default function TrafficPage() {
  const { report, traffic } = useReportContext();

  if (!report) return null;

  return (
    <div className="space-y-6" id="section-traffic">
      <TrafficCard
        score={report.feasibility_score ?? 0}
        aadt={report.applications?.traffic_aadt}
        trafficYear={report.applications?.traffic_year}
        roadName={report.applications?.traffic_road_name}
        truckPercent={report.applications?.truck_percent}
        congestionLevel={report.applications?.congestion_level}
        trafficDirection={report.applications?.traffic_direction}
        peakHourVolume={report.applications?.peak_hour_volume}
        trafficMapUrl={report.applications?.traffic_map_url}
        speedLimit={report.applications?.speed_limit}
        surfaceType={report.applications?.surface_type}
        verdict={traffic?.verdict}
      />

      <AccessCard
        score={report.feasibility_score ?? 0}
        distanceHighwayFt={report.applications?.distance_highway_ft}
        distanceTransitFt={report.applications?.distance_transit_ft}
        nearestHighway={report.applications?.nearest_highway}
        nearestTransitStop={report.applications?.nearest_transit_stop}
        nearestSignalDistanceFt={report.applications?.nearest_signal_distance_ft}
        roadClassification={report.applications?.road_classification}
        driveTimeData={report.applications?.drivetimes}
        verdict={traffic?.access_verdict}
      />
    </div>
  );
}
