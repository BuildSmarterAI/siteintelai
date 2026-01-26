import { DocsLayout } from "@/components/docs/DocsLayout";
import { Leaf } from "lucide-react";

const EnvironmentalDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
          <Leaf className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Environmental</h1>
        <p className="text-lg text-white/70">Weight: 10% of feasibility score. Wetlands, EPA facilities, soil constraints.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Data Sources</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• USFWS National Wetlands Inventory</li>
          <li>• EPA ECHO (1-mile facility search)</li>
          <li>• USDA Soil Survey</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default EnvironmentalDocs;
