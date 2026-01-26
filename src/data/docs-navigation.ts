import { 
  BookOpen, 
  Layers, 
  Database, 
  ArrowRightLeft, 
  Server, 
  LayoutDashboard, 
  Brain, 
  FileText,
  Box,
  Sparkles,
  FileBarChart
} from "lucide-react";

export interface DocNavItem {
  title: string;
  href: string;
  description?: string;
}

export interface DocNavSection {
  title: string;
  icon: typeof BookOpen;
  items: DocNavItem[];
}

export const docsNavigation: DocNavSection[] = [
  {
    title: "Overview",
    icon: BookOpen,
    items: [
      { title: "What is SiteIntel™", href: "/docs", description: "Platform overview" },
      { title: "Feasibility-as-a-Service™", href: "/docs/faas", description: "FaaS overview" },
    ],
  },
  {
    title: "Platform Features",
    icon: Sparkles,
    items: [
      { title: "Features Overview", href: "/docs/features", description: "All capabilities" },
      { title: "Feasibility Reports", href: "/docs/features/feasibility-reports", description: "$1,495 lender-ready reports" },
      { title: "Design Mode", href: "/docs/features/design-mode", description: "8-step conceptual design" },
      { title: "Parcel Explorer", href: "/docs/features/parcel-explorer", description: "Interactive parcel search" },
      { title: "Market Intelligence", href: "/docs/features/market-intelligence", description: "H3 trade area analysis" },
      { title: "Decision Map", href: "/docs/features/decision-map", description: "Multi-layer GIS" },
      { title: "AI Scoring Engine", href: "/docs/features/scoring-engine", description: "0-100 methodology" },
    ],
  },
  {
    title: "Report Domains",
    icon: FileBarChart,
    items: [
      { title: "Zoning", href: "/docs/domains/zoning", description: "Setbacks, FAR, overlays" },
      { title: "Flood Risk", href: "/docs/domains/flood", description: "FEMA zones, BFE, claims" },
      { title: "Utilities", href: "/docs/domains/utilities", description: "Water, sewer, storm" },
      { title: "Environmental", href: "/docs/domains/environmental", description: "Wetlands, EPA, soil" },
      { title: "Traffic & Access", href: "/docs/domains/traffic", description: "AADT, drive times" },
      { title: "Market Demographics", href: "/docs/domains/market", description: "Census, proprietary indices" },
      { title: "Topography", href: "/docs/domains/topography", description: "Elevation, slope analysis" },
    ],
  },
  {
    title: "Architecture",
    icon: Layers,
    items: [
      { title: "Master Architecture Diagram", href: "/docs/master-architecture", description: "System overview" },
      { title: "Data Replication Moat", href: "/docs/replication-moat", description: "Competitive advantage" },
      { title: "Houston Ingestion Workflow", href: "/docs/houston-workflow", description: "Houston pipeline" },
      { title: "Texas GIS Architecture", href: "/docs/texas-pipeline", description: "Statewide scaling" },
    ],
  },
  {
    title: "Data Standardization",
    icon: Database,
    items: [
      { title: "canonical_schema", href: "/docs/canonical-schema", description: "Master data model" },
      { title: "transform_config DSL Spec", href: "/docs/dsl-specification", description: "DSL reference" },
      { title: "Dataset Versioning Strategy", href: "/docs/versioning", description: "Version tracking" },
    ],
  },
  {
    title: "Ingestion Pipelines",
    icon: ArrowRightLeft,
    items: [
      { title: "Houston Pipeline", href: "/docs/houston-workflow", description: "City of Houston" },
      { title: "Texas-wide Pipeline", href: "/docs/texas-pipeline", description: "Multi-city scaling" },
    ],
  },
  {
    title: "Tiles & Delivery",
    icon: Server,
    items: [
      { title: "Tileserver GL + Cloudflare", href: "/docs/tile-architecture", description: "Tile serving" },
      { title: "Vector Tile Schemas", href: "/docs/tile-schemas", description: "Tile structure" },
    ],
  },
  {
    title: "3D Visualization",
    icon: Box,
    items: [
      { title: "CityEngine Integration", href: "/docs/cityengine-integration", description: "3D massing pipeline" },
      { title: "Export Formats", href: "/docs/export-formats", description: "GLB, OBJ, PNG specs" },
      { title: "Worker Architecture", href: "/docs/cityengine-worker", description: "External processor" },
    ],
  },
  {
    title: "Dashboards",
    icon: LayoutDashboard,
    items: [
      { title: "Map Server Dashboard", href: "/docs/map-server-dashboard", description: "GIS endpoints" },
      { title: "Dataset Health Dashboard", href: "/docs/dataset-health", description: "Data quality" },
    ],
  },
  {
    title: "AI Engines",
    icon: Brain,
    items: [
      { title: "Zoning Engine", href: "/docs/zoning-engine", description: "Zoning reasoning" },
      { title: "Flood Engine", href: "/docs/flood-engine", description: "Flood risk" },
      { title: "Utilities Engine", href: "/docs/utilities-engine", description: "Utility serviceability" },
      { title: "Feasibility Scoring", href: "/docs/feasibility-scoring", description: "Score calculation" },
    ],
  },
  {
    title: "Appendices",
    icon: FileText,
    items: [
      { title: "Dataset Index", href: "/docs/dataset-index", description: "All datasets" },
      { title: "Glossary", href: "/docs/glossary", description: "Terms & definitions" },
    ],
  },
];
