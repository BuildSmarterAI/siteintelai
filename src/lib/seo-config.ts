// SiteIntel™ SEO Configuration
// Centralized SEO settings for consistent metadata across all pages

export const seoConfig = {
  siteName: "SiteIntel™",
  siteUrl: "https://siteintel.lovable.app",
  defaultTitle: "AI Feasibility Software for Real Estate | SiteIntel™",
  defaultDescription:
    "Get lender-ready feasibility reports in 10 minutes for $795. Zoning, flood & utilities data from FEMA, ArcGIS, TxDOT. Replace $10K studies.",
  defaultOgImage: "https://siteintel.lovable.app/og-image.png",
  twitterHandle: "@siteintel",
  
  // Organization schema for JSON-LD
  organization: {
    name: "SiteIntel™",
    legalName: "BuildSmarter Holdings LLC",
    url: "https://siteintel.lovable.app",
    logo: "https://siteintel.lovable.app/logo.png",
    foundingDate: "2024",
    founders: ["BuildSmarter Holdings LLC"],
    address: {
      addressLocality: "Houston",
      addressRegion: "TX",
      addressCountry: "US",
    },
    contactPoint: {
      telephone: "",
      contactType: "sales",
      email: "hello@siteintel.com",
    },
    sameAs: [
      "https://linkedin.com/company/siteintel",
      "https://twitter.com/siteintel",
    ],
  },

  // Software application schema
  software: {
    name: "SiteIntel™ Feasibility",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      price: "795",
      priceCurrency: "USD",
    },
  },
};

// Helper to generate full title with site name
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return seoConfig.defaultTitle;
  return `${pageTitle} | ${seoConfig.siteName}`;
}

// Helper to generate canonical URL
export function generateCanonical(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${seoConfig.siteUrl}${cleanPath}`;
}

// Page-specific SEO configurations
export const pageSeoConfig: Record<string, { title: string; description: string; keywords?: string[] }> = {
  "/": {
    title: "AI Feasibility Software for Real Estate",
    description: "Get lender-ready feasibility reports in 10 minutes for $795. Zoning, flood & utilities data from FEMA, ArcGIS, TxDOT. Replace $10K studies.",
    keywords: ["feasibility report", "real estate feasibility", "zoning analysis", "commercial real estate", "site analysis"],
  },
  "/products": {
    title: "Products",
    description: "Explore SiteIntel's suite of AI-powered real estate intelligence products: Feasibility, Cost Intelligence, and Schedule Intelligence.",
    keywords: ["real estate software", "feasibility software", "cost estimation", "construction scheduling"],
  },
  "/products/feasibility": {
    title: "Feasibility Intelligence",
    description: "AI-powered feasibility reports with zoning, flood, utilities, and market analysis. Lender-ready in 10 minutes.",
    keywords: ["feasibility report", "site feasibility", "zoning analysis", "flood zone analysis"],
  },
  "/products/cost-intelligence": {
    title: "Cost Intelligence",
    description: "Real-time construction cost estimates powered by local market data. ROM budgets in minutes, not weeks.",
    keywords: ["construction costs", "cost estimation", "ROM budget", "construction budget"],
  },
  "/products/schedule-intelligence": {
    title: "Schedule Intelligence",
    description: "AI-generated construction schedules based on project scope, local permitting timelines, and market conditions.",
    keywords: ["construction schedule", "project timeline", "permitting schedule"],
  },
  "/pricing": {
    title: "Pricing & Plans",
    description: "Transparent pricing for SiteIntel feasibility reports. Starting at $795 for a complete lender-ready report.",
    keywords: ["feasibility pricing", "report cost", "subscription plans"],
  },
  "/how-it-works": {
    title: "How It Works",
    description: "Enter an address, get a lender-ready feasibility report in 10 minutes. See how SiteIntel automates due diligence.",
    keywords: ["how it works", "feasibility process", "automated due diligence"],
  },
  "/about": {
    title: "About Us",
    description: "SiteIntel is building the future of real estate feasibility. Learn about our mission and team.",
    keywords: ["about siteintel", "company", "team", "mission"],
  },
  "/contact": {
    title: "Contact Sales",
    description: "Get in touch with SiteIntel. Schedule a demo or ask questions about our feasibility platform.",
    keywords: ["contact", "demo", "sales", "support"],
  },
  "/industries/developers": {
    title: "For Developers",
    description: "Accelerate site selection and due diligence with AI-powered feasibility reports. Screen more deals faster.",
    keywords: ["real estate developers", "site selection", "due diligence"],
  },
  "/industries/lenders": {
    title: "For Lenders",
    description: "Reduce loan committee prep time with standardized, data-backed feasibility reports. Risk assessment in minutes.",
    keywords: ["CRE lenders", "loan committee", "risk assessment", "underwriting"],
  },
  "/parcel-explorer": {
    title: "Parcel Explorer",
    description: "Browse HCAD parcels on an interactive map. Search by address and run instant feasibility analysis.",
    keywords: ["parcel map", "HCAD", "property search", "Houston parcels"],
  },
  "/beta": {
    title: "Join Beta",
    description: "Join the SiteIntel beta program and get early access to AI-powered feasibility tools.",
    keywords: ["beta", "early access", "waitlist"],
  },
  "/faq": {
    title: "FAQ - Frequently Asked Questions",
    description: "Get answers about SiteIntel feasibility reports, pricing, data sources, and lender acceptance.",
    keywords: ["FAQ", "feasibility questions", "real estate FAQ"],
  },
  "/sample-report": {
    title: "Sample Feasibility Report",
    description: "Preview a complete SiteIntel feasibility report. See zoning, flood, utilities, and market analysis.",
    keywords: ["sample report", "feasibility example", "report preview"],
  },
  "/resources/case-studies": {
    title: "Case Studies - Customer Success Stories",
    description: "See how developers, lenders, and investors use SiteIntel to save time and money.",
    keywords: ["case studies", "success stories", "real estate ROI"],
  },
  "/data-sources": {
    title: "Data Sources & Methodology",
    description: "SiteIntel uses verified data from FEMA, ArcGIS, TxDOT, EPA. 100% transparent citations.",
    keywords: ["data sources", "FEMA", "ArcGIS", "verified data"],
  },
  "/compare": {
    title: "SiteIntel vs Traditional Consultants",
    description: "Compare SiteIntel AI feasibility reports to traditional consultants. Save 90% cost and get results in 10 minutes.",
    keywords: ["compare feasibility", "consultant alternative", "cost savings"],
  },
  "/tools/roi-calculator": {
    title: "ROI Calculator - Calculate Your Savings",
    description: "Calculate how much you can save with SiteIntel AI feasibility reports. Free ROI calculator.",
    keywords: ["ROI calculator", "feasibility savings", "cost calculator"],
  },
  "/industries/municipalities": {
    title: "For Municipalities & Economic Development",
    description: "Help municipalities attract development with instant feasibility pre-screening and compliance verification.",
    keywords: ["municipalities", "economic development", "permit screening"],
  },
  "/industries/land-brokers": {
    title: "For Land Brokers & Commercial Real Estate Agents",
    description: "Differentiate your listings with instant feasibility reports. Help buyers make faster decisions.",
    keywords: ["land brokers", "commercial real estate", "listing tools"],
  },
  "/industries/architects-engineers": {
    title: "For Architects & Engineers",
    description: "Validate site constraints before design begins. Get zoning, utilities, and environmental data instantly.",
    keywords: ["architects", "engineers", "site validation", "pre-design"],
  },
  "/partners": {
    title: "Partner Program - Earn Referral Credits",
    description: "Join the SiteIntel partner network. Earn $100 per referral or integrate our API into your platform.",
    keywords: ["partner program", "referral", "API partner", "reseller"],
  },
};
