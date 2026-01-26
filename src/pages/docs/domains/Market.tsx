import { DocsLayout } from "@/components/docs/DocsLayout";
import { Users } from "lucide-react";

const MarketDocs = () => (
  <DocsLayout>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
          <Users className="h-8 w-8" />
          <span className="text-sm font-medium uppercase tracking-wider">Report Domain</span>
        </div>
        <h1 className="font-heading text-4xl text-white">Market Demographics</h1>
        <p className="text-lg text-white/70">Weight: 10% of feasibility score. Census data and proprietary indices.</p>
      </div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h3 className="font-heading text-white mb-2">Proprietary Indices</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• Retail Spending Index, Growth Potential Index</li>
          <li>• Daytime Population Estimate, Workforce Availability</li>
          <li>• Affluence Concentration, Labor Pool Depth</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
);
export default MarketDocs;
