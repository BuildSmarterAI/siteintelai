// Searchable documentation content index

export interface DocHeading {
  level: number;
  text: string;
  anchor: string;
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  section: string;
  keywords: string[];
  headings: DocHeading[];
  content: string; // Plain text summary for search
}

export const docsContent: DocPage[] = [
  // Overview Section
  {
    slug: "",
    title: "What is SiteIntel™",
    description: "Platform overview and introduction",
    section: "Overview",
    keywords: ["siteintel", "platform", "overview", "introduction", "feasibility"],
    headings: [
      { level: 2, text: "Platform Overview", anchor: "platform-overview" },
      { level: 2, text: "Key Features", anchor: "key-features" },
      { level: 2, text: "Getting Started", anchor: "getting-started" },
    ],
    content: "SiteIntel is a feasibility intelligence platform that transforms commercial real estate due diligence. It provides instant, data-driven site analysis using authoritative GIS data sources.",
  },
  {
    slug: "faas",
    title: "Feasibility-as-a-Service™",
    description: "FaaS overview and business model",
    section: "Overview",
    keywords: ["faas", "feasibility", "service", "api", "saas", "business"],
    headings: [
      { level: 2, text: "What is FaaS", anchor: "what-is-faas" },
      { level: 2, text: "Business Model", anchor: "business-model" },
      { level: 2, text: "API Access", anchor: "api-access" },
    ],
    content: "Feasibility-as-a-Service delivers instant site feasibility analysis through a simple API. Get lender-ready reports in minutes instead of weeks.",
  },

  // Architecture Section
  {
    slug: "master-architecture",
    title: "Master Architecture Diagram",
    description: "System overview and component relationships",
    section: "Architecture",
    keywords: ["architecture", "system", "diagram", "components", "infrastructure"],
    headings: [
      { level: 2, text: "System Overview", anchor: "system-overview" },
      { level: 2, text: "Data Flow", anchor: "data-flow" },
      { level: 2, text: "Component Relationships", anchor: "component-relationships" },
    ],
    content: "The SiteIntel architecture consists of a React frontend, Supabase backend, and multiple external GIS data integrations. The system processes parcel data through ingestion pipelines and delivers results via vector tiles.",
  },
  {
    slug: "replication-moat",
    title: "Data Replication Moat",
    description: "Competitive advantage through data",
    section: "Architecture",
    keywords: ["replication", "moat", "competitive", "advantage", "data", "strategy"],
    headings: [
      { level: 2, text: "Data Moat Strategy", anchor: "data-moat-strategy" },
      { level: 2, text: "Replication Architecture", anchor: "replication-architecture" },
      { level: 2, text: "Competitive Barriers", anchor: "competitive-barriers" },
    ],
    content: "SiteIntel's data replication moat creates a defensible competitive advantage by aggregating, normalizing, and enhancing authoritative GIS data at scale.",
  },
  {
    slug: "houston-workflow",
    title: "Houston Ingestion Workflow",
    description: "City of Houston data pipeline",
    section: "Architecture",
    keywords: ["houston", "ingestion", "workflow", "pipeline", "arcgis", "hcad"],
    headings: [
      { level: 2, text: "Data Sources", anchor: "data-sources" },
      { level: 2, text: "Ingestion Pipeline", anchor: "ingestion-pipeline" },
      { level: 2, text: "Transform Rules", anchor: "transform-rules" },
    ],
    content: "The Houston ingestion workflow pulls data from HCAD, City of Houston ArcGIS services, and FEMA to create a unified parcel dataset.",
  },
  {
    slug: "texas-pipeline",
    title: "Texas GIS Architecture",
    description: "Statewide scaling strategy",
    section: "Architecture",
    keywords: ["texas", "gis", "architecture", "scaling", "statewide", "multi-county"],
    headings: [
      { level: 2, text: "Multi-County Strategy", anchor: "multi-county-strategy" },
      { level: 2, text: "Data Federation", anchor: "data-federation" },
      { level: 2, text: "Scaling Considerations", anchor: "scaling-considerations" },
    ],
    content: "The Texas GIS architecture enables scaling from Houston to all 254 Texas counties using a federated data approach.",
  },

  // Data Standardization Section
  {
    slug: "canonical-schema",
    title: "Canonical Schema",
    description: "Master data model specification",
    section: "Data Standardization",
    keywords: ["canonical", "schema", "data", "model", "standardization", "fields"],
    headings: [
      { level: 2, text: "Schema Overview", anchor: "schema-overview" },
      { level: 2, text: "Field Definitions", anchor: "field-definitions" },
      { level: 2, text: "Type System", anchor: "type-system" },
    ],
    content: "The canonical schema defines the standardized data model for all parcel and property data across different county sources.",
  },
  {
    slug: "dsl-specification",
    title: "Transform Config DSL",
    description: "DSL reference for data transforms",
    section: "Data Standardization",
    keywords: ["dsl", "transform", "config", "specification", "language", "rules"],
    headings: [
      { level: 2, text: "DSL Overview", anchor: "dsl-overview" },
      { level: 2, text: "Transform Rules", anchor: "transform-rules" },
      { level: 2, text: "Examples", anchor: "examples" },
    ],
    content: "The transform_config DSL provides a declarative way to define data transformation rules for normalizing source data into canonical format.",
  },
  {
    slug: "versioning",
    title: "Dataset Versioning Strategy",
    description: "Version tracking and history",
    section: "Data Standardization",
    keywords: ["versioning", "dataset", "history", "tracking", "snapshots"],
    headings: [
      { level: 2, text: "Versioning Strategy", anchor: "versioning-strategy" },
      { level: 2, text: "Snapshot Management", anchor: "snapshot-management" },
      { level: 2, text: "History Tracking", anchor: "history-tracking" },
    ],
    content: "Dataset versioning enables tracking changes over time and maintaining historical snapshots of parcel data.",
  },

  // Tiles & Delivery Section
  {
    slug: "tile-architecture",
    title: "Tileserver GL + Cloudflare",
    description: "Vector tile serving infrastructure",
    section: "Tiles & Delivery",
    keywords: ["tiles", "vector", "tileserver", "cloudflare", "cdn", "maplibre"],
    headings: [
      { level: 2, text: "Tile Architecture", anchor: "tile-architecture" },
      { level: 2, text: "CDN Configuration", anchor: "cdn-configuration" },
      { level: 2, text: "Performance", anchor: "performance" },
    ],
    content: "Vector tiles are served through Tileserver GL and cached via Cloudflare for global low-latency delivery.",
  },
  {
    slug: "tile-schemas",
    title: "Vector Tile Schemas",
    description: "Tile layer structure and properties",
    section: "Tiles & Delivery",
    keywords: ["tile", "schema", "vector", "layers", "properties", "mvt"],
    headings: [
      { level: 2, text: "Layer Structure", anchor: "layer-structure" },
      { level: 2, text: "Property Definitions", anchor: "property-definitions" },
      { level: 2, text: "Zoom Levels", anchor: "zoom-levels" },
    ],
    content: "Vector tile schemas define the structure and properties available at each zoom level for map rendering.",
  },

  // Dashboards Section
  {
    slug: "map-server-dashboard",
    title: "Map Server Dashboard",
    description: "GIS endpoint monitoring",
    section: "Dashboards",
    keywords: ["dashboard", "map", "server", "monitoring", "gis", "endpoints"],
    headings: [
      { level: 2, text: "Dashboard Overview", anchor: "dashboard-overview" },
      { level: 2, text: "Metrics", anchor: "metrics" },
      { level: 2, text: "Alerts", anchor: "alerts" },
    ],
    content: "The map server dashboard monitors GIS endpoint health, response times, and data freshness.",
  },
  {
    slug: "dataset-health",
    title: "Dataset Health Dashboard",
    description: "Data quality monitoring",
    section: "Dashboards",
    keywords: ["dataset", "health", "quality", "monitoring", "freshness", "errors"],
    headings: [
      { level: 2, text: "Health Metrics", anchor: "health-metrics" },
      { level: 2, text: "Quality Indicators", anchor: "quality-indicators" },
      { level: 2, text: "Error Tracking", anchor: "error-tracking" },
    ],
    content: "Dataset health monitoring tracks data quality, freshness, completeness, and error rates across all sources.",
  },

  // AI Engines Section
  {
    slug: "zoning-engine",
    title: "Zoning Engine",
    description: "AI-powered zoning analysis",
    section: "AI Engines",
    keywords: ["zoning", "engine", "ai", "analysis", "land-use", "permits"],
    headings: [
      { level: 2, text: "Zoning Analysis", anchor: "zoning-analysis" },
      { level: 2, text: "Use Case Matching", anchor: "use-case-matching" },
      { level: 2, text: "Permit Requirements", anchor: "permit-requirements" },
    ],
    content: "The Zoning Engine uses AI to analyze zoning codes and determine permitted uses for any parcel.",
  },
  {
    slug: "flood-engine",
    title: "Flood Engine",
    description: "Flood risk assessment",
    section: "AI Engines",
    keywords: ["flood", "engine", "risk", "fema", "floodplain", "insurance"],
    headings: [
      { level: 2, text: "Flood Risk Analysis", anchor: "flood-risk-analysis" },
      { level: 2, text: "FEMA Integration", anchor: "fema-integration" },
      { level: 2, text: "Insurance Implications", anchor: "insurance-implications" },
    ],
    content: "The Flood Engine analyzes FEMA flood zones and historical data to assess flood risk and insurance requirements.",
  },
  {
    slug: "utilities-engine",
    title: "Utilities Engine",
    description: "Utility serviceability analysis",
    section: "AI Engines",
    keywords: ["utilities", "engine", "water", "sewer", "power", "infrastructure"],
    headings: [
      { level: 2, text: "Utility Analysis", anchor: "utility-analysis" },
      { level: 2, text: "Service Availability", anchor: "service-availability" },
      { level: 2, text: "Capacity Assessment", anchor: "capacity-assessment" },
    ],
    content: "The Utilities Engine determines water, sewer, and power availability for any parcel location.",
  },
  {
    slug: "feasibility-scoring",
    title: "Feasibility Scoring",
    description: "Score calculation methodology",
    section: "AI Engines",
    keywords: ["feasibility", "scoring", "methodology", "algorithm", "weights"],
    headings: [
      { level: 2, text: "Scoring Methodology", anchor: "scoring-methodology" },
      { level: 2, text: "Factor Weights", anchor: "factor-weights" },
      { level: 2, text: "Score Interpretation", anchor: "score-interpretation" },
    ],
    content: "Feasibility scoring combines multiple factors including zoning, flood risk, utilities, and market data into a single actionable score.",
  },

  // 3D Visualization Section
  {
    slug: "cityengine-integration",
    title: "CityEngine Integration",
    description: "3D massing pipeline overview",
    section: "3D Visualization",
    keywords: ["cityengine", "3d", "massing", "visualization", "pipeline", "esri"],
    headings: [
      { level: 2, text: "Pipeline Overview", anchor: "pipeline-overview" },
      { level: 2, text: "Job Lifecycle", anchor: "job-lifecycle" },
      { level: 2, text: "Export Formats", anchor: "export-formats" },
      { level: 2, text: "Texas Presets", anchor: "texas-presets" },
    ],
    content: "CityEngine integration enables automatic 3D massing generation from parcel and zoning data. The pipeline supports GLB, OBJ, and PNG exports.",
  },
  {
    slug: "export-formats",
    title: "Export Formats",
    description: "GLB, OBJ, PNG specifications",
    section: "3D Visualization",
    keywords: ["export", "formats", "glb", "obj", "png", "3d", "models"],
    headings: [
      { level: 2, text: "GLB Format", anchor: "glb-format" },
      { level: 2, text: "OBJ Format", anchor: "obj-format" },
      { level: 2, text: "PNG Renders", anchor: "png-renders" },
    ],
    content: "Export formats include GLB for web 3D viewers, OBJ for CAD software, and PNG renders for presentations.",
  },
  {
    slug: "cityengine-worker",
    title: "Worker Architecture",
    description: "External CityEngine job processor",
    section: "3D Visualization",
    keywords: ["worker", "architecture", "cityengine", "job", "processor", "queue"],
    headings: [
      { level: 2, text: "Worker Overview", anchor: "worker-overview" },
      { level: 2, text: "Job Queue", anchor: "job-queue" },
      { level: 2, text: "Processing Pipeline", anchor: "processing-pipeline" },
    ],
    content: "The CityEngine worker is an external service that processes 3D generation jobs from a Supabase queue.",
  },

  // Appendices Section
  {
    slug: "dataset-index",
    title: "Dataset Index",
    description: "Complete dataset catalog",
    section: "Appendices",
    keywords: ["dataset", "index", "catalog", "sources", "reference"],
    headings: [
      { level: 2, text: "Dataset Catalog", anchor: "dataset-catalog" },
      { level: 2, text: "Source Details", anchor: "source-details" },
      { level: 2, text: "Update Frequencies", anchor: "update-frequencies" },
    ],
    content: "Complete catalog of all datasets used in SiteIntel including sources, update frequencies, and field mappings.",
  },
  {
    slug: "glossary",
    title: "Glossary",
    description: "Terms and definitions",
    section: "Appendices",
    keywords: ["glossary", "terms", "definitions", "vocabulary", "reference"],
    headings: [
      { level: 2, text: "A-F", anchor: "a-f" },
      { level: 2, text: "G-L", anchor: "g-l" },
      { level: 2, text: "M-R", anchor: "m-r" },
      { level: 2, text: "S-Z", anchor: "s-z" },
    ],
    content: "Glossary of terms used throughout SiteIntel documentation including GIS, real estate, and technical terminology.",
  },
];

// Helper function to search documentation
export function searchDocs(query: string): DocPage[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(t => t.length > 1);
  
  return docsContent
    .map(doc => {
      let score = 0;
      
      // Title match (highest weight)
      if (doc.title.toLowerCase().includes(lowerQuery)) score += 100;
      terms.forEach(term => {
        if (doc.title.toLowerCase().includes(term)) score += 20;
      });
      
      // Description match
      if (doc.description.toLowerCase().includes(lowerQuery)) score += 50;
      terms.forEach(term => {
        if (doc.description.toLowerCase().includes(term)) score += 10;
      });
      
      // Keywords match
      doc.keywords.forEach(kw => {
        if (kw.includes(lowerQuery)) score += 30;
        terms.forEach(term => {
          if (kw.includes(term)) score += 5;
        });
      });
      
      // Content match
      if (doc.content.toLowerCase().includes(lowerQuery)) score += 20;
      terms.forEach(term => {
        if (doc.content.toLowerCase().includes(term)) score += 3;
      });
      
      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ doc }) => doc);
}

// Group search results by section
export function groupSearchResults(results: DocPage[]): Record<string, DocPage[]> {
  return results.reduce((acc, doc) => {
    if (!acc[doc.section]) {
      acc[doc.section] = [];
    }
    acc[doc.section].push(doc);
    return acc;
  }, {} as Record<string, DocPage[]>);
}
