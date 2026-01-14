import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { Box, Zap, FileOutput, Building2 } from "lucide-react";

const CityEngineIntegration = () => {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 id="cityengine-integration" className="text-3xl font-bold text-white mb-4">
          CityEngine Integration
        </h1>
        <p className="text-lg text-white/70 mb-8">
          Automatic 3D massing generation from SiteIntel parcel and zoning data using 
          Esri CityEngine 2025.1. Generate GLB, OBJ, and PNG exports for design visualization.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
            <Box className="h-8 w-8 text-[hsl(var(--feasibility-orange))] mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">3D Massing</h3>
            <p className="text-xs text-white/60">Automatic envelope generation</p>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
            <Zap className="h-8 w-8 text-[hsl(var(--data-cyan))] mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">2-5 Minutes</h3>
            <p className="text-xs text-white/60">Full scene generation</p>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
            <FileOutput className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Multi-Format</h3>
            <p className="text-xs text-white/60">GLB, OBJ, PNG exports</p>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
            <Building2 className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Texas Presets</h3>
            <p className="text-xs text-white/60">Hotel, Medical, TI</p>
          </div>
        </div>

        <h2 id="pipeline-overview" className="text-2xl font-semibold text-white mt-12 mb-4">
          Pipeline Overview
        </h2>

        <DiagramBlock
          title="CityEngine Export Pipeline"
          content={`
┌──────────────┐    ┌──────────────────┐    ┌───────────────────┐
│   Frontend   │───▶│  Edge Function   │───▶│  cityengine_jobs  │
│  (React)     │    │ queue-cityengine │    │  (PostgreSQL)     │
└──────────────┘    └──────────────────┘    └─────────┬─────────┘
                                                      │
                    ┌─────────────────────────────────┘
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                    CityEngine Worker                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │  Poll Queue │──▶│ Load Scene  │──▶│  Apply CGA Rules    │  │
│  │  (claim)    │   │  + Parcel   │   │  (hotel_v1.cga etc) │  │
│  └─────────────┘   └─────────────┘   └──────────┬──────────┘  │
│                                                 │             │
│  ┌─────────────────────────────────────────────┐│             │
│  │   Export Formats                             ││             │
│  │   • GLB (web viewer)     ◀───────────────────┘             │
│  │   • OBJ + MTL (CAD)                                        │
│  │   • PNG renders (views)                                    │
│  └──────────────────────────────────────────────┬─────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                   Supabase Storage                             │
│   cityengine-exports/{job_id}/                                 │
│   ├── massing.glb                                              │
│   ├── massing.obj + massing.mtl                                │
│   ├── view_aerial.png                                          │
│   ├── view_street.png                                          │
│   └── manifest.json                                            │
└───────────────────────────────────────────────────────────────┘
`}
        />

        <h2 id="job-lifecycle" className="text-2xl font-semibold text-white mt-12 mb-4">
          Job Lifecycle
        </h2>
        <p className="text-white/70 mb-4">
          Jobs progress through the following states:
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            pending
          </span>
          <span className="text-white/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            processing
          </span>
          <span className="text-white/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            completed
          </span>
        </div>

        <CodeBlock
          code={`// Job status response
{
  "job_id": "ce_abc123",
  "status": "completed",
  "progress": 100,
  "output_manifest": {
    "formats": {
      "glb": "cityengine-exports/ce_abc123/massing.glb",
      "obj": "cityengine-exports/ce_abc123/massing.obj"
    },
    "views": {
      "aerial": "cityengine-exports/ce_abc123/view_aerial.png",
      "street": "cityengine-exports/ce_abc123/view_street.png"
    },
    "compliance": {
      "max_height_ft": 120,
      "max_far": 2.5,
      "setback_front_ft": 15
    }
  },
  "signed_urls": {
    "glb": "https://...signed-url-expires-72h...",
    "aerial_png": "https://..."
  }
}`}
          language="json"
          title="Completed Job Response"
        />

        <h2 id="export-formats" className="text-2xl font-semibold text-white mt-12 mb-4">
          Export Formats
        </h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white">Format</th>
                <th className="text-left py-3 px-4 text-white">Use Case</th>
                <th className="text-left py-3 px-4 text-white">Size</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">.glb</td>
                <td className="py-3 px-4">Web 3D viewers, Three.js, Cesium</td>
                <td className="py-3 px-4">~2-10 MB</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">.obj + .mtl</td>
                <td className="py-3 px-4">CAD software, SketchUp, Rhino</td>
                <td className="py-3 px-4">~5-20 MB</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">.png</td>
                <td className="py-3 px-4">Presentations, reports, thumbnails</td>
                <td className="py-3 px-4">~500 KB each</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="texas-presets" className="text-2xl font-semibold text-white mt-12 mb-4">
          Texas Vertical Presets
        </h2>
        <p className="text-white/70 mb-4">
          Pre-configured CGA rules optimized for common Texas development types:
        </p>

        <div className="space-y-4 mb-8">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">🏨 hotel_v1.cga</h4>
            <p className="text-sm text-white/60 mb-2">
              Podium + tower with 3-story parking base, 8-12 story tower, rooftop amenity deck. 
              Optimized for limited-service and select-service hotels.
            </p>
            <code className="text-xs text-[hsl(var(--feasibility-orange))]">
              FAR: 2.0-4.0 | Height: 80-150 ft
            </code>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">🏥 medical_v1.cga</h4>
            <p className="text-sm text-white/60 mb-2">
              Deep floor plates (90-100ft), high glazing ratio, mechanical penthouse. 
              Configured for MOB and ambulatory surgery centers.
            </p>
            <code className="text-xs text-[hsl(var(--feasibility-orange))]">
              FAR: 1.5-3.0 | Height: 40-80 ft
            </code>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">🏬 ti_v1.cga</h4>
            <p className="text-sm text-white/60 mb-2">
              Low-rise flex/industrial with storefront glazing, dock doors, 24-28ft clear height. 
              For last-mile and light industrial tenants.
            </p>
            <code className="text-xs text-[hsl(var(--feasibility-orange))]">
              FAR: 0.3-0.6 | Height: 30-40 ft
            </code>
          </div>
        </div>

        <h2 id="api-usage" className="text-2xl font-semibold text-white mt-12 mb-4">
          API Usage
        </h2>

        <CodeBlock
          code={`// Queue a CityEngine job
const { data, error } = await supabase.functions.invoke(
  'queue-cityengine-job',
  {
    body: {
      applicationId: 'app_xyz789',
      sessionId: 'session_123',
      variantId: 'hotel_v1',
      formats: ['glb', 'obj', 'png'],
      views: ['aerial', 'street', 'corner']
    }
  }
);

// Response: { success: true, jobId: 'ce_abc123', status: 'pending' }

// Poll for status
const status = await supabase.functions.invoke(
  'cityengine-job-status',
  { body: { jobId: 'ce_abc123' } }
);`}
          language="typescript"
          title="Queue and Poll Example"
        />
      </div>
    </DocsLayout>
  );
};

export default CityEngineIntegration;
