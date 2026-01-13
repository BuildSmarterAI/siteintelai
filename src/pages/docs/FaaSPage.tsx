import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { 
  Zap, 
  DollarSign, 
  Clock, 
  Shield, 
  FileText, 
  TrendingUp 
} from "lucide-react";

const FaaSPage = () => {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 id="feasibility-as-a-service" className="text-3xl font-bold text-white mb-4">
          Feasibility-as-a-Service™
        </h1>
        <p className="text-lg text-white/70 mb-8">
          Instant site feasibility intelligence delivered through a simple API. 
          Get lender-ready reports in minutes instead of weeks.
        </p>

        <h2 id="what-is-faas" className="text-2xl font-semibold text-white mt-12 mb-4">
          What is FaaS?
        </h2>
        <p className="text-white/70 mb-4">
          Feasibility-as-a-Service (FaaS) is SiteIntel's core offering that transforms 
          traditional feasibility studies into an instant, automated service. Instead of 
          hiring consultants and waiting weeks, developers get verified site intelligence 
          in under 10 minutes.
        </p>

        <div className="grid md:grid-cols-3 gap-4 my-8">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <Clock className="h-8 w-8 text-[hsl(var(--feasibility-orange))] mb-3" />
            <h3 className="text-white font-medium mb-2">10 Minutes</h3>
            <p className="text-sm text-white/60">From address to complete report</p>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <DollarSign className="h-8 w-8 text-[hsl(var(--data-cyan))] mb-3" />
            <h3 className="text-white font-medium mb-2">$795 / Report</h3>
            <p className="text-sm text-white/60">90% less than traditional studies</p>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <Shield className="h-8 w-8 text-emerald-400 mb-3" />
            <h3 className="text-white font-medium mb-2">Lender-Ready</h3>
            <p className="text-sm text-white/60">Accepted by major CRE lenders</p>
          </div>
        </div>

        <h2 id="business-model" className="text-2xl font-semibold text-white mt-12 mb-4">
          Business Model
        </h2>
        <p className="text-white/70 mb-4">
          FaaS operates on a simple pricing model designed for both one-time users and 
          power users:
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white">Tier</th>
                <th className="text-left py-3 px-4 text-white">Price</th>
                <th className="text-left py-3 px-4 text-white">Reports</th>
                <th className="text-left py-3 px-4 text-white">Best For</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Pay-per-Report</td>
                <td className="py-3 px-4">$795</td>
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4">One-off due diligence</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Pro Monthly</td>
                <td className="py-3 px-4">$1,950/mo</td>
                <td className="py-3 px-4">10</td>
                <td className="py-3 px-4">Active developers</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Enterprise</td>
                <td className="py-3 px-4">Custom</td>
                <td className="py-3 px-4">Unlimited</td>
                <td className="py-3 px-4">Portfolio analysis</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="api-access" className="text-2xl font-semibold text-white mt-12 mb-4">
          API Access
        </h2>
        <p className="text-white/70 mb-4">
          Enterprise customers can integrate FaaS directly into their workflows via API:
        </p>

        <CodeBlock
          code={`// Request a feasibility report via API
const response = await fetch('/api/v1/feasibility', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: '1234 Main St, Houston, TX 77002',
    intent_type: 'hotel',
    include_3d: true
  })
});

const { report_id, status } = await response.json();
// Poll for completion or receive webhook callback`}
          language="typescript"
          title="API Request Example"
        />

        <h2 id="value-proposition" className="text-2xl font-semibold text-white mt-12 mb-4">
          Value Proposition
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-start p-4 rounded-lg border border-white/10">
            <Zap className="h-6 w-6 text-[hsl(var(--feasibility-orange))] shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-medium">Speed Moat</h4>
              <p className="text-sm text-white/60">
                10-minute delivery vs 2-3 week consultant turnaround. Make faster 
                decisions and never lose a deal to due diligence delays.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start p-4 rounded-lg border border-white/10">
            <FileText className="h-6 w-6 text-[hsl(var(--data-cyan))] shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-medium">Consistency Moat</h4>
              <p className="text-sm text-white/60">
                Every report uses the same verified data sources and methodology. 
                No more variability between consultants or regions.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start p-4 rounded-lg border border-white/10">
            <TrendingUp className="h-6 w-6 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-medium">Scale Moat</h4>
              <p className="text-sm text-white/60">
                Analyze 100 sites in a day instead of 1. Screen entire submarkets 
                to find the best opportunities before competitors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default FaaSPage;
