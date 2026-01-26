import { DocsLayout } from "@/components/docs/DocsLayout";
import { Mountain } from "lucide-react";

const TopographyDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--feasibility-orange))]">
          <Mountain className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Topography</h1>
        <p className="text-lg text-white/70">Elevation profiles, slope analysis, and terrain constraints.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Key Fields</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• elevation, soil_slope_percent</li>
          <li>• bedrock_depth_cm, groundwater_depth_ft</li>
          <li>• shrink_swell_potential, erosion_k_factor</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default TopographyDocs;
