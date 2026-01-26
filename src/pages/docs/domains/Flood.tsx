import { DocsLayout } from "@/components/docs/DocsLayout";
import { Waves } from "lucide-react";

const FloodDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
          <Waves className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Flood Risk</h1>
        <p className="text-lg text-white/70">Weight: 20% of feasibility score. FEMA flood zones, base flood elevation, NFIP claims history.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Data Sources</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• FEMA OpenFEMA API (NFIP claims, policies)</li>
          <li>• FEMA NFHL (National Flood Hazard Layer)</li>
          <li>• Historical flood events database</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default FloodDocs;
