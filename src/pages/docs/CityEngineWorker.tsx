import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { Server, RefreshCw, Shield, AlertTriangle } from "lucide-react";

const CityEngineWorker = () => {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 id="worker-architecture" className="text-3xl font-bold text-white mb-4">
          Worker Architecture
        </h1>
        <p className="text-lg text-white/70 mb-8">
          The CityEngine worker is an external Python service that polls the Supabase 
          job queue and processes 3D generation requests.
        </p>

        <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 mb-8">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium mb-1">External Service</h4>
              <p className="text-sm text-yellow-200/70">
                The worker runs outside Supabase infrastructure due to CityEngine's 
                licensing and compute requirements. It requires a dedicated VM or 
                container with CityEngine installed.
              </p>
            </div>
          </div>
        </div>

        <h2 id="worker-overview" className="text-2xl font-semibold text-white mt-12 mb-4">
          Worker Overview
        </h2>

        <DiagramBlock
          title="Worker Process Flow"
          content={`
┌─────────────────────────────────────────────────────────────┐
│                    CityEngine Worker                         │
│                    (Python 3.11+)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. POLL QUEUE                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ SELECT * FROM claim_cityengine_job()           │  │   │
│  │  │ -- Returns job with status='pending'           │  │   │
│  │  │ -- Sets status='processing', claimed_at=now()  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. LOAD SCENE                                        │   │
│  │  • Fetch application data (parcel, zoning, setbacks) │   │
│  │  • Load base .cej scene template                     │   │
│  │  • Import parcel geometry as shapefile               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. APPLY CGA RULES                                   │   │
│  │  • Select preset (hotel_v1, medical_v1, ti_v1)       │   │
│  │  • Set rule parameters from zoning constraints       │   │
│  │  • Generate 3D geometry                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  4. EXPORT                                            │   │
│  │  • Export GLB (with Draco compression)               │   │
│  │  • Export OBJ + MTL                                  │   │
│  │  • Render PNG views                                  │   │
│  │  • Generate manifest.json                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  5. UPLOAD & COMPLETE                                 │   │
│  │  • Upload to Supabase Storage                        │   │
│  │  • Update job: status='completed', output_manifest   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
`}
        />

        <h2 id="job-queue" className="text-2xl font-semibold text-white mt-12 mb-4">
          Job Queue Design
        </h2>
        <p className="text-white/70 mb-4">
          The queue uses PostgreSQL with a custom <code>claim_cityengine_job()</code> 
          function for atomic job claiming:
        </p>

        <CodeBlock
          code={`-- Database function for atomic job claiming
CREATE OR REPLACE FUNCTION claim_cityengine_job()
RETURNS cityengine_jobs AS $$
DECLARE
  claimed_job cityengine_jobs;
BEGIN
  UPDATE cityengine_jobs
  SET 
    status = 'processing',
    claimed_at = now(),
    attempts = attempts + 1
  WHERE id = (
    SELECT id FROM cityengine_jobs
    WHERE status = 'pending'
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING * INTO claimed_job;
  
  RETURN claimed_job;
END;
$$ LANGUAGE plpgsql;`}
          language="sql"
          title="claim_cityengine_job() Function"
        />

        <div className="p-4 rounded-lg border border-white/10 bg-white/5 mb-6">
          <h4 className="text-white font-medium mb-3">Queue Features</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <Server className="h-4 w-4 text-[hsl(var(--data-cyan))] shrink-0 mt-0.5" />
              <span><strong>Atomic Claiming:</strong> <code>FOR UPDATE SKIP LOCKED</code> prevents race conditions</span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-[hsl(var(--data-cyan))] shrink-0 mt-0.5" />
              <span><strong>Retry Logic:</strong> Failed jobs retry with exponential backoff (3 attempts max)</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-[hsl(var(--data-cyan))] shrink-0 mt-0.5" />
              <span><strong>Stale Detection:</strong> Jobs claimed &gt;30 min without completion are reset</span>
            </li>
          </ul>
        </div>

        <h2 id="processing-pipeline" className="text-2xl font-semibold text-white mt-12 mb-4">
          Processing Pipeline
        </h2>

        <CodeBlock
          code={`# worker/main.py - Simplified worker loop
import asyncio
from supabase import create_client
from cityengine import CityEngine

class CityEngineWorker:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.ce = CityEngine()
    
    async def run(self):
        """Main polling loop"""
        while True:
            job = await self.claim_job()
            if job:
                try:
                    await self.process_job(job)
                except Exception as e:
                    await self.fail_job(job['id'], str(e))
            else:
                await asyncio.sleep(5)  # No jobs, wait 5s
    
    async def claim_job(self):
        """Claim next pending job"""
        result = self.supabase.rpc('claim_cityengine_job').execute()
        return result.data if result.data else None
    
    async def process_job(self, job):
        """Process a single job"""
        # 1. Fetch application data
        app = self.supabase.table('applications').select('*').eq(
            'id', job['application_id']
        ).single().execute()
        
        # 2. Load scene and apply rules
        self.ce.load_template('texas_base.cej')
        self.ce.import_parcel(app.data['parcel_geometry'])
        self.ce.apply_preset(job['variant_id'], {
            'max_height': app.data['max_height_ft'],
            'max_far': app.data['max_far'],
            'setbacks': app.data['setbacks']
        })
        
        # 3. Generate and export
        self.ce.generate()
        exports = self.ce.export(
            formats=job['formats'],
            views=job['views']
        )
        
        # 4. Upload to storage
        for file_path, content in exports.items():
            self.supabase.storage.from_('cityengine-exports').upload(
                f"{job['id']}/{file_path}", content
            )
        
        # 5. Mark complete
        self.supabase.table('cityengine_jobs').update({
            'status': 'completed',
            'completed_at': 'now()',
            'output_manifest': exports['manifest']
        }).eq('id', job['id']).execute()`}
          language="python"
          title="Worker Implementation (Simplified)"
        />

        <h2 id="deployment" className="text-2xl font-semibold text-white mt-12 mb-4">
          Deployment Requirements
        </h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white">Requirement</th>
                <th className="text-left py-3 px-4 text-white">Minimum</th>
                <th className="text-left py-3 px-4 text-white">Recommended</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">CityEngine Version</td>
                <td className="py-3 px-4">2024.1</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">2025.1</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Python</td>
                <td className="py-3 px-4">3.10</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">3.11+</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">RAM</td>
                <td className="py-3 px-4">16 GB</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">32 GB</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">CPU</td>
                <td className="py-3 px-4">4 cores</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">8+ cores</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">GPU</td>
                <td className="py-3 px-4">Optional</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">NVIDIA RTX for renders</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4">Storage</td>
                <td className="py-3 px-4">50 GB SSD</td>
                <td className="py-3 px-4 text-[hsl(var(--data-cyan))]">100 GB NVMe</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock
          code={`# Environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...service_role_key...
CITYENGINE_LICENSE_SERVER=license.example.com
WORKER_POLL_INTERVAL=5
WORKER_MAX_CONCURRENT=2
STORAGE_BUCKET=cityengine-exports`}
          language="bash"
          title=".env Configuration"
        />
      </div>
    </DocsLayout>
  );
};

export default CityEngineWorker;
