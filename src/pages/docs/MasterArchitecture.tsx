import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";

const MasterArchitecture = () => {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 id="master-architecture" className="text-3xl font-bold text-white mb-4">
          Master Architecture Diagram
        </h1>
        <p className="text-lg text-white/70 mb-8">
          High-level system overview showing the complete SiteIntel™ platform architecture, 
          data flows, and component relationships.
        </p>

        <h2 id="system-overview" className="text-2xl font-semibold text-white mt-12 mb-4">
          System Overview
        </h2>

        <DiagramBlock
          title="SiteIntel™ Platform Architecture"
          content={`
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ QuickCheck  │  │  Dashboard   │  │   Report    │  │   Design Mode    │   │
│  │   Widget    │  │              │  │   Viewer    │  │  (CityEngine)    │   │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                │                 │                   │             │
│  ┌──────┴────────────────┴─────────────────┴───────────────────┴──────────┐  │
│  │                        State Management (Zustand)                       │  │
│  └────────────────────────────────┬───────────────────────────────────────┘  │
│                                   │                                          │
│  ┌────────────────────────────────┴───────────────────────────────────────┐  │
│  │                      TanStack Query + Supabase Client                   │  │
│  └────────────────────────────────┬───────────────────────────────────────┘  │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE BACKEND                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Edge Funcs    │  │   PostgreSQL    │  │         Storage             │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ • run-pipeline  │  │ • applications  │  │ • report-pdfs               │  │
│  │ • generate-pdf  │  │ • reports       │  │ • cityengine-exports        │  │
│  │ • queue-city... │  │ • parcels       │  │ • survey-uploads            │  │
│  │ • send-email    │  │ • api_logs      │  │                             │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────────────┘  │
│           │                    │                                             │
│  ┌────────┴────────────────────┴───────────────────────────────────────────┐ │
│  │                          PostGIS + RLS Policies                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐
│   EXTERNAL GIS APIs  │  │  CITYENGINE WORKER │  │    TILE INFRASTRUCTURE  │
├──────────────────────┤  ├────────────────────┤  ├─────────────────────────┤
│ • HCAD / FBCAD       │  │ • Python Service   │  │ • Tileserver GL         │
│ • City of Houston    │  │ • CGA Rules        │  │ • Cloudflare CDN        │
│ • FEMA / OpenFEMA    │  │ • GLB/OBJ Export   │  │ • PMTiles               │
│ • EPA ECHO           │  │ • Queue Polling    │  │                         │
│ • TxDOT AADT         │  │                    │  │                         │
│ • USFWS Wetlands     │  │                    │  │                         │
└──────────────────────┘  └────────────────────┘  └─────────────────────────┘
`}
        />

        <h2 id="data-flow" className="text-2xl font-semibold text-white mt-12 mb-4">
          Data Flow
        </h2>
        <p className="text-white/70 mb-4">
          Data flows through the system in three main pipelines:
        </p>

        <div className="space-y-6 mb-8">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">1. Feasibility Pipeline</h4>
            <p className="text-sm text-white/60 mb-2">
              User submits address → Geocoding → Parcel lookup → GIS data aggregation → 
              AI analysis → Score calculation → PDF generation → Report delivery
            </p>
            <code className="text-xs text-[hsl(var(--data-cyan))]">
              ~10 minutes end-to-end
            </code>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">2. Tile Delivery Pipeline</h4>
            <p className="text-sm text-white/60 mb-2">
              PostGIS → PMTiles generation → Upload to Cloudflare R2 → 
              Tileserver GL → CDN caching → MapLibre rendering
            </p>
            <code className="text-xs text-[hsl(var(--data-cyan))]">
              ~50ms tile request latency
            </code>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <h4 className="text-white font-medium mb-2">3. 3D Export Pipeline</h4>
            <p className="text-sm text-white/60 mb-2">
              User triggers export → Job queued → CityEngine worker claims → 
              CGA processing → GLB/OBJ generation → Upload to Storage → Signed URL delivery
            </p>
            <code className="text-xs text-[hsl(var(--data-cyan))]">
              ~2-5 minutes for complex scenes
            </code>
          </div>
        </div>

        <h2 id="component-relationships" className="text-2xl font-semibold text-white mt-12 mb-4">
          Component Relationships
        </h2>
        
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white">Component</th>
                <th className="text-left py-3 px-4 text-white">Technology</th>
                <th className="text-left py-3 px-4 text-white">Responsibility</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">Frontend</td>
                <td className="py-3 px-4">React 18 + Vite</td>
                <td className="py-3 px-4">UI rendering, state, routing</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">Database</td>
                <td className="py-3 px-4">PostgreSQL + PostGIS</td>
                <td className="py-3 px-4">Data persistence, spatial queries</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">Edge Functions</td>
                <td className="py-3 px-4">Deno (Supabase)</td>
                <td className="py-3 px-4">API endpoints, orchestration</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">Tiles</td>
                <td className="py-3 px-4">Tileserver GL + CF</td>
                <td className="py-3 px-4">Vector tile serving</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 font-mono text-[hsl(var(--data-cyan))]">3D Worker</td>
                <td className="py-3 px-4">Python + CityEngine</td>
                <td className="py-3 px-4">3D model generation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DocsLayout>
  );
};

export default MasterArchitecture;
