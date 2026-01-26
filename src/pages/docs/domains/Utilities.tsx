import { DocsLayout } from "@/components/docs/DocsLayout";
import { Plug } from "lucide-react";

const UtilitiesDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
          <Plug className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Utilities</h1>
        <p className="text-lg text-white/70">Weight: 20% of feasibility score. Water, sewer, storm infrastructure access and capacity.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Key Fields</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• water_lines, sewer_lines, storm_lines</li>
          <li>• mud_district, wcid_district, etj_provider</li>
          <li>• utility_provider_confidence (0-100)</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default UtilitiesDocs;
