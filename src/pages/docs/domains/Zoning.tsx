import { DocsLayout } from "@/components/docs/DocsLayout";
import { Building2 } from "lucide-react";

const ZoningDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
          <Building2 className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Zoning Analysis</h1>
        <p className="text-lg text-white/70">Weight: 30% of feasibility score. Covers zoning code verification, setbacks, FAR, height limits, and overlay districts.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Key Fields</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• zoning_code, overlay_district, max_far, max_height</li>
          <li>• setback_front, setback_side, setback_rear</li>
          <li>• land_use_code, deed_restrictions</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default ZoningDocs;
