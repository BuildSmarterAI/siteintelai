# Developer Implementation Blueprint — BuildSmarter™ Feasibility

## 0. Conventions

**Stack**: Vite + React + TypeScript, shadcn/ui, TanStack Query, Supabase JS v2, Lucide icons

**File Naming**:
- PascalCase for components
- kebab-case for pages/routes

**Data Fetch**: React Query with cache keys by table + id

**Realtime**: Supabase channels on `applications` (job status)

**Styling**: Tailwind (from shadcn). Tokens mapped from design system.

## 1. Project Skeleton (src/)

```
src/
├── app/
│   ├── routes.tsx
│   └── providers.tsx
├── lib/
│   ├── supabase.ts
│   ├── api.ts
│   ├── odata.ts
│   ├── types.ts
│   └── utils.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── PageContainer.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   ├── accordion.tsx
│   │   ├── table.tsx
│   │   └── toast.tsx
│   ├── map/
│   │   ├── MapCanvas.tsx
│   │   └── MiniMapPreview.tsx
│   ├── charts/
│   │   ├── ScoreCircle.tsx
│   │   ├── BarChart.tsx
│   │   └── RadialGauge.tsx
│   ├── cards/
│   │   ├── CreditUsageCard.tsx
│   │   └── MetricCard.tsx
│   ├── odata/
│   │   ├── FilterBuilder.tsx
│   │   ├── ComputeBuilder.tsx
│   │   └── JSONPreview.tsx
│   ├── feedback/
│   │   ├── AlertBanner.tsx
│   │   └── EmptyState.tsx
│   └── modals/
│       └── ProgressModal.tsx
└── pages/
    ├── intake/
    │   └── IntakePage.tsx
    ├── report/
    │   └── ReportPage.tsx
    ├── dashboard/
    │   └── DashboardPage.tsx
    ├── analytics/
    │   └── AnalyticsPage.tsx
    └── odata/
        └── ODataExplorerPage.tsx
```

## 2. Types (Supabase-facing)

```typescript
// src/lib/types.ts

export type Application = {
  id: string
  formatted_address: string | null
  geo_lat: number | null
  geo_lng: number | null
  parcel_id: string | null
  parcel_owner: string | null
  acreage_cad: number | null
  status: 'idle' | 'queued' | 'enriching' | 'ai' | 'rendering' | 'complete' | 'error'
  status_percent: number
  created_at: string
}

export type ReportRow = {
  id: string
  application_id: string
  score: number // FeasibilityScore
  exec_summary: string | null
  pdf_url: string | null
  ai_json: Record<string, unknown> | null
  data_flags: string[] | null
  created_at: string
}

export type UserCredits = {
  user_id: string
  credits_remaining: number
  credits_used: number
}
```

## 3. Supabase & Providers

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true } }
)

// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toast'

const client = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
```

## 4. API Glue (Edge/REST Facade)

```typescript
// src/lib/api.ts
import { supabase } from './supabase'

// intake → creates application row and queues job (server handles enqueue)
export async function intake(formattedAddress: string, selectedLayers: string[]) {
  const { data, error } = await supabase
    .from('applications')
    .insert({ 
      formatted_address: formattedAddress, 
      status: 'queued',
      status_percent: 0 
    })
    .select()
    .single()
    
  if (error) throw error
  
  // optional: call Edge Function to kick off enrichment
  await fetch('/generate/' + data.id, { method: 'POST' }).catch(() => {})
  
  return data
}

export async function getApplication(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error) throw error
  return data
}

export async function getReport(appIdOrReportId: string) {
  // try by report id then by application id
  const byReport = await supabase
    .from('reports')
    .select('*')
    .eq('id', appIdOrReportId)
    .single()
    
  if (!byReport.error) return byReport.data
  
  const byApp = await supabase
    .from('reports')
    .select('*')
    .eq('application_id', appIdOrReportId)
    .single()
    
  if (byApp.error) throw byApp.error
  return byApp.data
}

// src/lib/odata.ts
export async function queryOData(path: string, init?: RequestInit) {
  const url = `/odata/${path}` // e.g. "reports?$select=id,FeasibilityScore&$top=50"
  const res = await fetch(url, { 
    ...init, 
    headers: { 'Content-Type': 'application/json' } 
  })
  
  if (!res.ok) throw new Error(`OData error ${res.status}`)
  return res.json()
}
```

## 5. Routes

```typescript
// src/app/routes.tsx
import { createBrowserRouter } from 'react-router-dom'
import IntakePage from '@/pages/intake/IntakePage'
import ReportPage from '@/pages/report/ReportPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import ODataExplorerPage from '@/pages/odata/ODataExplorerPage'

export const router = createBrowserRouter([
  { path: '/', element: <IntakePage /> },
  { path: '/reports/:id', element: <ReportPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/odata', element: <ODataExplorerPage /> }
])
```

## 6. Key Component Stubs

### Progress Modal (Binds Realtime Job Status)

```typescript
// src/components/modals/ProgressModal.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = { 
  appId: string
  open: boolean
  onClose(): void
  onComplete(reportId: string): void 
}

export default function ProgressModal({ appId, open, onClose, onComplete }: Props) {
  const [title, setTitle] = useState('Preparing…')
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!open) return
    
    const channel = supabase
      .channel('app:' + appId)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'applications', 
        filter: `id=eq.${appId}` 
      }, (payload: any) => {
        const row = payload.new
        setPct(row.status_percent ?? 0)
        setTitle(row.status ?? 'processing')
        
        if (row.status === 'complete') {
          supabase
            .from('reports')
            .select('id')
            .eq('application_id', appId)
            .single()
            .then(({ data }) => {
              if (data) onComplete(data.id)
            })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [appId, open, onComplete])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-live="polite">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Progress value={pct} className="w-full" />
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Geocoding</p>
          <p>✓ Parcel & Overlays</p>
          <p>⋯ AI Generation</p>
          <p>⋯ PDF Rendering</p>
        </div>
        
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### MapCanvas (Lightweight Leaflet Wrapper)

```typescript
// src/components/map/MapCanvas.tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'

type Props = { 
  parcel?: GeoJSON.FeatureCollection
  overlays?: { flood?: any; utilities?: any; env?: any } 
}

export default function MapCanvas({ parcel, overlays }: Props) {
  return (
    <MapContainer className="h-full w-full" zoom={15} center={[29.76, -95.37]}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {parcel && <GeoJSON data={parcel as any} style={{ color: '#2563EB' }} />}
    </MapContainer>
  )
}
```

### ScoreCircle

```typescript
// src/components/charts/ScoreCircle.tsx
type Props = { score: number }

export default function ScoreCircle({ score }: Props) {
  const band = score >= 80 ? 'A' : score >= 60 ? 'B' : 'C'
  const color = band === 'A' ? 'text-green-600' : band === 'B' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-6xl font-bold ${color}`}>{band}</div>
      <div className="text-sm text-muted-foreground">Feasibility Score</div>
      <div className="text-2xl font-semibold">{score}</div>
    </div>
  )
}
```

### OData Filter/Compute Builder (Skeleton)

```typescript
// src/components/odata/FilterBuilder.tsx
import { Input } from '@/components/ui/input'

export function FilterBuilder({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div className="space-y-2">
      <Input 
        placeholder="e.g., city eq 'Houston'" 
        onChange={(e) => onChange(`$filter=${e.target.value}`)} 
      />
      {/* eq, ne, gt, lt, ... */}
    </div>
  )
}

// src/components/odata/ComputeBuilder.tsx
export function ComputeBuilder({ onChange }: { onChange(v: string): void }) {
  return (
    <div className="space-y-2">
      <Input 
        placeholder="e.g., PriceBand as case(...)" 
        onChange={(e) => onChange(`$compute=${encodeURIComponent(e.target.value)}`)} 
      />
      <p className="text-xs text-muted-foreground">
        Use OData 4.01 <code>case()</code> expressions.
      </p>
    </div>
  )
}
```

## 7. Pages (Thin Controllers)

### Intake

```typescript
// src/pages/intake/IntakePage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { intake } from '@/lib/api'
import ProgressModal from '@/components/modals/ProgressModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function IntakePage() {
  const [addr, setAddr] = useState('')
  const [appId, setAppId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  
  const m = useMutation({
    mutationFn: () => intake(addr, []),
    onSuccess: (app) => { setAppId(app.id); setOpen(true) }
  })

  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-4xl font-bold mb-8">Instant Feasibility Reports</h1>
      
      <div className="space-y-4">
        <Input 
          placeholder="Enter address..." 
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        
        <Button onClick={() => m.mutate()}>
          Run QuickCheck →
        </Button>
      </div>

      {appId && (
        <ProgressModal
          appId={appId}
          open={open}
          onClose={() => setOpen(false)}
          onComplete={(reportId) => nav(`/reports/${reportId}`)}
        />
      )}
    </div>
  )
}
```

### Report Viewer

```typescript
// src/pages/report/ReportPage.tsx
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getReport } from '@/lib/api'
import MapCanvas from '@/components/map/MapCanvas'
import ScoreCircle from '@/components/charts/ScoreCircle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

export default function ReportPage() {
  const { id } = useParams()
  const { data: report } = useQuery({ 
    queryKey: ['report', id], 
    queryFn: () => getReport(id!) 
  })

  if (!report) return null
  
  const ai = report.ai_json ?? {}

  return (
    <div className="container py-8">
      <div className="grid grid-cols-2 gap-6">
        <MapCanvas />
        
        <div className="space-y-6">
          <ScoreCircle score={report.score} />
          
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="zoning">Zoning</TabsTrigger>
              <TabsTrigger value="flood">Flood</TabsTrigger>
              <TabsTrigger value="utilities">Utilities</TabsTrigger>
              <TabsTrigger value="environmental">Environmental</TabsTrigger>
              <TabsTrigger value="cost">Cost & Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              {report.exec_summary}
            </TabsContent>
            
            <TabsContent value="zoning">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="zoning">
                  <pre>{JSON.stringify((ai as any).zoning, null, 2)}</pre>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            {/* Additional tabs */}
          </Tabs>
          
          <Button asChild>
            <a href={report.pdf_url ?? '#'} download>Download PDF</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### OData Explorer

```typescript
// src/pages/odata/ODataExplorerPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryOData } from '@/lib/odata'
import { FilterBuilder } from '@/components/odata/FilterBuilder'
import { ComputeBuilder } from '@/components/odata/ComputeBuilder'
import { Button } from '@/components/ui/button'

export default function ODataExplorerPage() {
  const [qs, setQs] = useState(`reports?$select=id,FeasibilityScore,address,county&$top=50`)
  const { data, refetch, isFetching } = useQuery({ 
    queryKey: ['odata', qs],
    queryFn: () => queryOData(qs) 
  })

  return (
    <div className="container py-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <FilterBuilder 
            value="" 
            onChange={(f) => setQs(q => q + (q.includes('?') ? '&' : '?') + f)} 
          />
          
          <ComputeBuilder 
            onChange={(c) => setQs(q => q + '&' + c)} 
          />
          
          <Button onClick={() => refetch()} disabled={isFetching}>
            Run Query
          </Button>
          
          <p className="text-sm text-muted-foreground">/odata/{qs}</p>
        </div>
        
        <div>
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
```

## 8. Error Handling, Toasts, and States

- **Global Toaster**: Show success/failure on /intake, /generate, download, and OData errors
- **Empty States**: `<EmptyState>` with CTA to intake
- **Red Flags**: When `reports.data_flags?.length`, show `<AlertBanner>` with list + links

## 9. Accessibility Hooks

- Progress modal `aria-live="polite"` + descriptive steps
- Tabs keyboard nav (shadcn/ui default)
- MapCanvas: `aria-describedby="mapLegend"` + hidden legend text
- Data tables include `<thead>` semantics and focusable row actions

## 10. Testing Slices

**Unit**: Score banding, query builders, utils

**Integration**: Intake → job status channel → report redirect (mock Supabase)

**Contract**: OData query returns with $select/$top and $compute examples
