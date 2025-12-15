import { useReportContext } from "@/contexts/ReportContext";
import { FloodRiskCard } from "@/components/report/FloodRiskCard";

export default function FloodPage() {
  const { report, flood } = useReportContext();

  if (!report) return null;

  return (
    <div className="space-y-6" id="section-flood">
      <FloodRiskCard
        score={report.feasibility_score ?? 0}
        floodZone={report.applications?.floodplain_zone}
        firmPanel={report.applications?.fema_firm_panel}
        baseFloodElevation={report.applications?.base_flood_elevation}
        bfeSource={report.applications?.base_flood_elevation_source}
        nfipClaims={report.applications?.nfip_claims_count}
        historicalEvents={report.applications?.historical_flood_events}
        verdict={flood?.verdict}
      />
    </div>
  );
}
