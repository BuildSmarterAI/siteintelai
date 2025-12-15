import { useReportContext } from "@/contexts/ReportContext";
import { UtilitiesCard } from "@/components/report/UtilitiesCard";

export default function UtilitiesPage() {
  const { report, utilities } = useReportContext();

  if (!report) return null;

  return (
    <div className="space-y-6" id="section-utilities">
      <UtilitiesCard
        score={report.feasibility_score ?? 0}
        waterLines={report.applications?.water_lines}
        sewerLines={report.applications?.sewer_lines}
        stormLines={report.applications?.storm_lines}
        waterCapacity={report.applications?.water_capacity_mgd}
        sewerCapacity={report.applications?.sewer_capacity_mgd}
        powerKv={report.applications?.power_kv_nearby}
        fiberAvailable={report.applications?.fiber_available}
        broadbandProviders={report.applications?.broadband_providers}
        mudDistrict={report.applications?.mud_district}
        wcidDistrict={report.applications?.wcid_district}
        etjProvider={report.applications?.etj_provider}
        verdict={utilities?.verdict}
      />
    </div>
  );
}
