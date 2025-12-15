import { useReportContext } from "@/contexts/ReportContext";
import { ZoningCard } from "@/components/report/ZoningCard";

export default function ZoningPage() {
  const { report, zoning } = useReportContext();

  if (!report) return null;

  return (
    <div className="space-y-6" id="section-zoning">
      <ZoningCard
        zoningCode={report.applications?.zoning_code}
        zoningDescription={zoning?.description}
        lotCoverage={zoning?.lot_coverage}
        farLimit={zoning?.max_far}
        heightLimit={zoning?.max_height}
        setbacks={zoning?.setbacks}
        permittedUses={zoning?.permitted_uses}
        conditionalUses={zoning?.conditional_uses}
        overlayDistricts={zoning?.overlay_districts}
        verdict={zoning?.verdict}
      />
    </div>
  );
}
