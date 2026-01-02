// Field tooltips for application form contextual help
export const FIELD_TOOLTIPS = {
  // Step 1: Contact Information
  fullName: {
    content: "Enter your full legal name as it appears on contracts and legal documents",
    example: "John Smith",
    whyWeAsk: "Required for professional reports and legal compliance"
  },
  company: {
    content: "Your company or development entity name",
    example: "Acme Development LLC",
    whyWeAsk: "Required for professional reports and correspondence"
  },
  email: {
    content: "Primary email address for receiving reports and updates",
    example: "john@acmedevelopment.com",
    whyWeAsk: "We'll send your feasibility report and important updates to this email"
  },
  phone: {
    content: "Best contact number for follow-up questions",
    example: "(555) 123-4567",
    whyWeAsk: "Our team may need to clarify project details or schedule consultations"
  },
  
  // Step 2: Property Information
  propertyAddress: {
    content: "Full street address of the property you're evaluating for development",
    example: "123 Main St, Houston, TX 77002",
    whyWeAsk: "We use this to pull zoning, flood zone, traffic data, and market analytics from 20+ official sources"
  },
  parcelId: {
    content: "Also called APN (Assessor Parcel Number). Auto-populated from county records when available.",
    example: "0123-4567-8900-0001",
    whyWeAsk: "Uniquely identifies the property in county databases for accurate tax and zoning data"
  },
  lotSize: {
    content: "Total lot size. We auto-populate this from county records when available.",
    example: "2.5 acres or 108,900 sq ft",
    whyWeAsk: "Essential for calculating building density, parking requirements, and development capacity"
  },
  currentUse: {
    content: "How is the property currently being used?",
    example: "Vacant land, or Warehouse, or Retail store",
    whyWeAsk: "Helps us understand existing improvements and potential redevelopment costs"
  },
  zoning: {
    content: "Current zoning classification. We auto-populate this from county GIS data when available.",
    example: "Commercial - C2 or Industrial - I1",
    whyWeAsk: "Critical for determining what you can build and whether you need rezoning"
  },
  
  // Step 3: Project Intent
  projectType: {
    content: "Select all project types that apply to your development plans",
    example: "Multifamily, Retail, or Mixed-Use",
    whyWeAsk: "Different uses have different zoning, parking, utility, and market requirements"
  },
  buildingSize: {
    content: "Total building square footage you're planning to develop",
    example: "50,000 sq ft",
    whyWeAsk: "Used to calculate parking needs, utility capacity, and construction costs"
  },
  stories: {
    content: "Number of stories and total building height",
    example: "3 stories, 45 feet",
    whyWeAsk: "Determines if your project meets height restrictions and requires variance approvals"
  },
  prototypeRequirements: {
    content: "Any specific building design or operational requirements",
    example: "Drive-thru, Loading docks, Ground floor retail",
    whyWeAsk: "Special requirements impact site layout, zoning compliance, and feasibility"
  },
  qualityLevel: {
    content: "Target construction quality and finish level",
    example: "Class A, Class B, or Budget/Value",
    whyWeAsk: "Impacts cost estimates and target tenant/buyer profiles"
  },
  budget: {
    content: "Total development budget including land, construction, and soft costs",
    example: "$5,000,000",
    whyWeAsk: "Helps us assess financial feasibility and recommend appropriate financing strategies"
  },
  
  // Step 4: Market & Risks
  submarket: {
    content: "Specific neighborhood or submarket name",
    example: "Uptown, Downtown, Medical Center",
    whyWeAsk: "Used for market comparables and demographic analysis"
  },
  accessPriorities: {
    content: "What access features are most important to your project?",
    example: "Highway visibility, Transit access, Pedestrian traffic",
    whyWeAsk: "Helps us evaluate site suitability for your specific use case"
  },
  knownRisks: {
    content: "Any issues you're already aware of",
    example: "Flood history, Contamination, Legal disputes",
    whyWeAsk: "Helps our AI prioritize risk analysis in your feasibility report"
  },
  utilityAccess: {
    content: "Which utilities are critical for your project?",
    example: "Water, Sewer, Fiber internet",
    whyWeAsk: "We'll verify availability and capacity for your required utilities"
  },
  environmentalConstraints: {
    content: "Known environmental considerations",
    example: "Wetlands, Protected species, Brownfield",
    whyWeAsk: "Critical for permitting timeline and cost estimates"
  },
  tenantRequirements: {
    content: "Any specific tenant or end-user needs",
    example: "24/7 access, High power capacity, LEED certification",
    whyWeAsk: "Ensures feasibility analysis addresses your operational requirements"
  },
  
  // Step 5: Final Questions
  hearAboutUs: {
    content: "How did you discover SiteIntel?",
    example: "Google search, Referral, Conference",
    whyWeAsk: "Helps us improve our service and reach more developers like you"
  },
  contactMethod: {
    content: "Preferred way for our team to reach you",
    example: "Email, Phone, Text",
    whyWeAsk: "We'll use your preferred method for important updates"
  },
  bestTime: {
    content: "Best time of day to contact you",
    example: "Morning, Afternoon, Evening",
    whyWeAsk: "Ensures we reach you at a convenient time"
  },
  ndaConsent: {
    content: "We protect all your project data with enterprise-grade security and confidentiality",
    whyWeAsk: "Required for legal compliance and data protection. Your project details are never shared."
  },
  contactConsent: {
    content: "Permission for our team to contact you about your feasibility report",
    whyWeAsk: "We may need to clarify details or provide additional analysis"
  },
  privacyConsent: {
    content: "Agreement to our Terms of Service and Privacy Policy",
    whyWeAsk: "Required for all users. Review our policies at buildsmarter.ai/terms"
  },
};

export type FieldTooltipKey = keyof typeof FIELD_TOOLTIPS;
