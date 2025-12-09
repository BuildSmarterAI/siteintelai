import { 
  BookOpen, 
  Layers, 
  Database, 
  ArrowRightLeft, 
  Server, 
  LayoutDashboard, 
  Brain, 
  FileText 
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
