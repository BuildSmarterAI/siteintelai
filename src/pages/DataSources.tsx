import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  Shield,
  MapPin,
  Droplets,
  Car,
  Leaf,
  Building2,
  Users,
  Zap,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

const dataSources = [
  {
    name: "FEMA National Flood Hazard Layer",
    abbreviation: "FEMA NFHL",
    icon: Droplets,
    category: "Flood Risk",
    dataTypes: ["Flood zones", "Base Flood Elevation", "FIRM panels", "NFIP claims history"],
    updateFrequency: "As FIRM panels are updated",
    coverage: "Nationwide",
  },
  {
    name: "Harris County Appraisal District",
    abbreviation: "HCAD",
    icon: Building2,
    category: "Parcels",
    dataTypes: ["Parcel boundaries", "Owner information", "Appraised values", "Legal descriptions"],
    updateFrequency: "Bi-weekly",
    coverage: "Harris County, TX",
  },
  {
    name: "Fort Bend Central Appraisal District",
    abbreviation: "FBCAD",
    icon: Building2,
    category: "Parcels",
    dataTypes: ["Parcel boundaries", "Owner information", "Appraised values", "Legal descriptions"],
    updateFrequency: "Annually",
    coverage: "Fort Bend County, TX",
  },
  {
    name: "Texas Department of Transportation",
    abbreviation: "TxDOT",
    icon: Car,
    category: "Traffic",
    dataTypes: ["AADT counts", "Road classification", "Speed limits", "Historical traffic trends"],
    updateFrequency: "Annually (5-year cycle)",
    coverage: "Texas statewide",
  },
  {
    name: "EPA Enforcement & Compliance History",
    abbreviation: "EPA ECHO",
    icon: Leaf,
    category: "Environmental",
    dataTypes: ["Regulated facilities", "Permit status", "Compliance history", "Facility locations"],
    updateFrequency: "Continuous",
    coverage: "Nationwide",
  },
  {
    name: "U.S. Fish & Wildlife Service",
    abbreviation: "USFWS NWI",
    icon: Globe,
    category: "Wetlands",
    dataTypes: ["Wetland boundaries", "Cowardin classification", "Wetland types"],
    updateFrequency: "Biannually",
    coverage: "Nationwide",
  },
  {
    name: "U.S. Census Bureau",
    abbreviation: "Census ACS",
    icon: Users,
    category: "Demographics",
    dataTypes: ["Population", "Income", "Education", "Employment", "Housing"],
    updateFrequency: "ACS 5-year estimates",
    coverage: "Nationwide",
  },
  {
    name: "City of Houston GIS",
    abbreviation: "COH",
    icon: Zap,
    category: "Utilities",
    dataTypes: ["Water mains", "Sewer lines", "Storm drains", "Force mains"],
    updateFrequency: "As maintained",
    coverage: "City of Houston",
  },
  {
    name: "ArcGIS / Esri Services",
    abbreviation: "ArcGIS",
    icon: MapPin,
    category: "Geospatial",
    dataTypes: ["Basemaps", "Geocoding", "Spatial analysis", "Feature services"],
    updateFrequency: "Continuous",
    coverage: "Global",
  },
];

const methodologySteps = [
  {
    step: 1,
    title: "Address Geocoding",
    description: "We convert your address to precise coordinates using multiple geocoding services for accuracy.",
  },
  {
    step: 2,
    title: "Parcel Identification",
    description: "We query county appraisal district databases to identify the exact parcel and retrieve ownership data.",
  },
  {
    step: 3,
    title: "Spatial Overlay Analysis",
    description: "We perform spatial queries against flood, wetland, and zoning layers to identify constraints.",
  },
  {
    step: 4,
    title: "Proximity Analysis",
    description: "We calculate distances to utilities, traffic counts, and environmental facilities within defined radii.",
  },
  {
    step: 5,
    title: "AI Synthesis",
    description: "Our AI aggregates all data points, applies scoring logic, and generates the narrative report.",
  },
  {
    step: 6,
    title: "Citation & Verification",
    description: "Every data point is timestamped and cited to its authoritative source for lender verification.",
  },
];

export default function DataSources() {
  return (
    <>
      <SEOHead
        title="Data Sources & Methodology"
        description="SiteIntel uses verified data from FEMA, ArcGIS, TxDOT, EPA, and more. See our complete list of authoritative sources and transparent methodology."
        keywords={["data sources", "FEMA", "ArcGIS", "TxDOT", "verified data", "methodology", "transparent"]}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-6">
                <Database className="w-3 h-3 mr-1" />
                Transparency
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Verified Data.{" "}
                <span className="text-primary">Complete Transparency.</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Every data point in your SiteIntel report comes from authoritative 
                government and industry sources. No guesses. No estimations. 
                Just verified intelligence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {["100% Cited Sources", "Lender Verified", "Timestamped Data", "Open API Access"].map((badge) => (
                <Badge key={badge} variant="outline" className="text-sm py-2 px-4">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sources Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Data Sources
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We integrate with 20+ authoritative data sources to provide 
                comprehensive feasibility analysis.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {dataSources.map((source, index) => (
                <motion.div
                  key={source.abbreviation}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <source.icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {source.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">
                        {source.abbreviation}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {source.name}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Data Types</p>
                        <div className="flex flex-wrap gap-1">
                          {source.dataTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {source.dataTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{source.dataTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          {source.updateFrequency}
                        </span>
                        <span>{source.coverage}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How We Process Your Data
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our methodology ensures accuracy, consistency, and complete 
                traceability for every report.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {methodologySteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Lender Verification Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Lender-Grade Verification
                </h2>
                <p className="text-muted-foreground mb-6">
                  Every SiteIntel report includes a complete Data Sources Appendix 
                  with timestamps, source URLs, and methodology notes. Loan committees 
                  can verify any data point directly with the source.
                </p>
                <ul className="space-y-3">
                  {[
                    "Complete data citations in every report",
                    "Timestamps showing data freshness",
                    "Direct links to source systems",
                    "Methodology documentation available",
                    "API access for enterprise verification",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                      Sample Data Citation
                    </h3>
                    <div className="space-y-3 text-sm font-mono bg-background p-4 rounded-lg">
                      <div>
                        <span className="text-muted-foreground">Source:</span>{" "}
                        <span className="text-foreground">FEMA NFHL</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Field:</span>{" "}
                        <span className="text-foreground">FLD_ZONE</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>{" "}
                        <span className="text-primary">Zone X (Unshaded)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retrieved:</span>{" "}
                        <span className="text-foreground">2025-01-16T14:32:00Z</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Panel:</span>{" "}
                        <span className="text-foreground">48201C0405L</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Experience Verified Intelligence
              </h2>
              <p className="text-muted-foreground mb-8">
                See for yourself how SiteIntel delivers transparent, 
                verifiable feasibility data in under 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/products/feasibility">
                    Get Your Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/sample-report">View Sample Report</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
