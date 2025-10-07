# System Component Layouts & Developer Handoff Guide — BuildSmarter™ Feasibility

## 1. Purpose & Audience

This document serves as the bridge between design and development for the BuildSmarter™ Feasibility platform. It defines how every Figma frame, visual element, and interaction maps to production-ready React components built with shadcn/ui, TailwindCSS, and Supabase.

**Audience**:
- Frontend developers implementing UI components and pages
- Product designers responsible for maintaining consistency across Figma and production
- QA engineers validating data bindings, layouts, and accessibility compliance

The guide ensures fidelity between Figma, Supabase schema, and Vercel-deployed components by enforcing shared naming conventions, spacing tokens, and accessibility rules.

## 2. Responsive Layout Definitions

All screens use a 12-column grid (desktop) and scale down responsively:

| Breakpoint | Columns | Gutter | Margin | Container Width | Usage             |
|------------|---------|--------|--------|-----------------|-------------------|
| ≥1440 px   | 12      | 80 px  | 160 px | 1120 px         | Desktop / Primary |
| ≤1024 px   | 8       | 60 px  | 80 px  | 864 px          | Tablet            |
| ≤768 px    | 4       | 40 px  | 40 px  | 640 px          | Small tablet      |
| ≤600 px    | 1       | 24 px  | 24 px  | 100%            | Mobile stack      |

### 2.1 Landing / Intake

- Grid: 12 cols, 80 px gutters
- Hero section with address input
- SearchCard component with map thumbnail

### 2.2 Progress Modal

- Centered dialog: 560 × 320 px
- Border-radius: 16 px
- Padding: 32 px; shadow-elev
- States: Idle → Fetching → Completed → Error
- On mobile: full-screen modal (padding reduced to 24 px)

### 2.3 Report Viewer

- Two-column layout: Map (50%) | Data Tabs (50%)
- Grid gap: 24 px
- Minimum height: 70vh
- Tabs scroll horizontally below 768 px
- Sidebar ("Data Sources & Timestamps") becomes collapsible drawer on mobile

### 2.4 Dashboard / Report History

- Layout: 12-col responsive table view
- Left: Filters (20%) | Right: Paginated DataTable (80%)
- Sidebar collapses below 1024 px; filters convert to dropdown

### 2.5 Admin Analytics

- 3-column card grid with 32 px gaps
- MetricCard components for KPIs

### 2.6 OData API Explorer

- Split grid 2 cols (Controls & Results)
- FilterBuilder and ComputeBuilder panels align left; ResultsTable and JSONPreview on right
- Below 768 px, stack vertically with toggles

## 3. Component Hierarchy Trees

Each layout follows consistent hierarchy and import paths.

```
<AppFrame>
├─ <Header> (/layout/header.tsx)
├─ <HeroSection> (/ui/typography)
│   ├─ <SearchCard> (/ui/input, /ui/checkbox, /ui/button)
│   └─ <MapThumbnail> (/map/MapCanvas)
├─ <ProgressModal> (/modals/ProgressModal)
├─ <ReportViewer>
│   ├─ <MapCanvas> (/map/MapCanvas)
│   ├─ <ScoreCircle> (/charts/ScoreCircle)
│   └─ <Tabs> (/ui/tabs)
│       ├─ <Accordion> (/ui/accordion)
│       └─ <DataSourcesFooter> (/layout/footer)
├─ <Dashboard>
│   ├─ <FilterBar> (/ui/input, /ui/select)
│   └─ <DataTable> (/ui/table)
└─ <ODataExplorer>
    ├─ <FilterBuilder> (/odata/FilterBuilder)
    ├─ <ComputeBuilder> (/odata/ComputeBuilder)
    └─ <JSONPreview> (/odata/JSONPreview)
```

## 4. Data Binding Map

| Supabase Field              | UI Component              | Location      | Type   |
|-----------------------------|---------------------------|---------------|--------|
| applications.formatted_address | `<InputAddress>`       | Intake        | String |
| applications.geo_lat/lng    | `<MapCanvas>`, `<MiniMapPreview>` | Map  | Number |
| applications.parcel_owner   | `<Accordion Zoning>`      | Report        | String |
| applications.acreage_cad    | `<SummaryCard>`           | Report        | Number |
| reports.score               | `<ScoreCircle>`           | Report Viewer | Number |
| reports.pdf_url             | `<DownloadButton>`        | Report        | String |
| reports.ai_json             | `<Tabs>` content          | Report        | JSON   |
| reports.data_flags          | `<AlertBanner>`           | Report        | Array  |

## 5. Design Tokens & Variants

### Spacing

| Token       | Value   | Purpose                  |
|-------------|---------|--------------------------|
| --space-xs  | 4 px    | icon offsets             |
| --space-sm  | 8 px    | small element spacing    |
| --space-md  | 16 px   | internal padding         |
| --space-lg  | 32 px   | section gaps             |
| --radius-md | 12 px   | border radius for cards/modals |
| --shadow-elev | 0 4 16 rgba(0,0,0,0.08) | elevation shadow |

### Typography

| Style  | Size / Line Height | Weight | Usage          |
|--------|-------------------|--------|----------------|
| H1     | 48 / 56           | 600    | Hero headline  |
| H2     | 32 / 40           | 600    | Section titles |
| H3     | 24 / 32           | 500    | Card headings  |
| Body L | 18 / 28           | 400    | Paragraph text |
| Body S | 14 / 22           | 400    | Table/label text |

### Colors

| Role            | Default | Hover   | Active  | Disabled |
|-----------------|---------|---------|---------|----------|
| Primary Button  | #FF7A00 | #FF9240 | #D96500 | #F4F4F5  |
| Secondary       | #0A0F2C | #1B2340 | #000000 | #CCCCCC  |
| Success         | #10B981 | —       | —       | —        |
| Warning         | #F59E0B | —       | —       | —        |
| Error           | #EF4444 | —       | —       | —        |

## 6. Accessibility Requirements

- All interactive elements use `aria-label` and keyboard navigation
- **Tablists**: Left/Right arrow switches between tabs
- **Accordions**: Up/Down arrows toggle focus; Enter/Space expands
- **Color Contrast**: All text and icons ≥ 4.5:1

## 7. Animation & Interaction Specs

| Element            | Animation           | Duration      | Easing      |
|--------------------|---------------------|---------------|-------------|
| Modal open/close   | scale + fade        | 250 ms        | ease-in-out |
| Progress advance   | linear width update | 100 ms per 5% | linear      |
| Tab switch         | fade slide          | 180 ms        | ease-out    |
| Map overlay toggle | opacity fade        | 300 ms        | ease-in     |
| Toast alert        | slide-in bottom     | 220 ms        | ease-out    |

Subtle motion guides user attention; no flashing or looping animations to maintain accessibility compliance (WCAG 2.1).

## 8. Developer Handoff Standards

### Layer Naming Convention

**Format**: `[Page] / [Section] / [Component] / [Variant]`

**Example**: `ReportViewer / Tabs / Accordion / Flood`

### Figma → Code Parity

- Each Figma frame name matches exported React component (`<SearchCard>`, `<ProgressModal>`)
- Autolayout in Figma mirrors Flex/Grid structure in code
- All layer comments include binding notes: `// Supabase: field_name`

### Folder Structure (src/components)

```
components/
├─ ui/ (buttons, inputs, accordions, tables)
├─ map/ (MapCanvas, MiniMapPreview)
├─ charts/ (ScoreCircle, BarChart, RadialGauge)
├─ cards/ (MetricCard, CreditUsageCard)
├─ odata/ (FilterBuilder, ComputeBuilder, JSONPreview)
├─ modals/ (ProgressModal)
├─ layout/ (Header, Footer, PageContainer)
└─ feedback/ (AlertBanner, EmptyState)
```

### Variant Naming

| Figma Variant                | Code Prop          | Behavior             |
|------------------------------|--------------------|--------------------|
| Button / Primary / Default   | `variant="default"` | Solid orange CTA     |
| Button / Ghost / Disabled    | `variant="ghost"` `disabled` | Outline gray |
| Accordion / Open             | `expanded={true}`   | Chevron rotates 180° |
| Progress / Complete          | `value=100`         | Bar turns green      |

### Example Code Import Block

```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import MapCanvas from "@/components/map/MapCanvas"
import ScoreCircle from "@/components/charts/ScoreCircle"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Accordion } from "@/components/ui/accordion"
import DataTable from "@/components/ui/table"
```

### Example Assembly in ReportPage.tsx

```typescript
<Tabs defaultValue="summary">
  <TabsList>
    <TabsTrigger value="summary">Summary</TabsTrigger>
    <TabsTrigger value="flood">Flood</TabsTrigger>
  </TabsList>
  
  <TabsContent value="summary">
    <ScoreCircle score={report.score} />
  </TabsContent>
  
  <TabsContent value="flood">
    <Accordion>
      <Accordion.Item>FEMA Zone AE</Accordion.Item>
    </Accordion>
  </TabsContent>
</Tabs>
```

## 10. Appendix: UX Validation & Schema Reference

### UX Checklist

- Consistent spacing tokens (16 / 24 / 32 px)
- Map overlays toggle within 300 ms fade
- ScoreCircle color matches performance band
- "Data Sources & Timestamps" present in all reports
- Tab navigation accessible via keyboard

### Schema Reference (Supabase)

| Table            | Key Fields                                           | Purpose                 |
|------------------|------------------------------------------------------|-------------------------|
| applications     | formatted_address, geo_lat, geo_lng, parcel_owner, acreage_cad | Input + enrichment data |
| enrichment_raw   | JSONB payloads                                       | Raw GIS + API data      |
| reports          | ai_json, pdf_url, score, exec_summary, data_flags    | Generated report assets |
