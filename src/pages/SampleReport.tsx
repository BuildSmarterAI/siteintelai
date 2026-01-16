import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  FileText,
  MapPin,
  Droplets,
  Zap,
  Car,
  Leaf,
  Users,
  CheckCircle2,
  Lock,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";

const reportSections = [
  {
    icon: FileText,
    title: "Executive Summary",
    description: "AI-generated overview with feasibility score (A/B/C), key findings, and go/no-go recommendation.",
    preview: "Feasibility Score: A (87/100)",
  },
  {
    icon: MapPin,
    title: "Zoning Analysis",
    description: "Complete zoning classification, permitted uses, setbacks, FAR, height limits, and overlay districts.",
    preview: "Zone: C-2 Commercial | FAR: 2.5 | Max Height: 75'",
  },
  {
    icon: Droplets,
    title: "Flood Zone Assessment",
    description: "FEMA flood zone determination, BFE, historical claims data, and flood insurance requirements.",
    preview: "Zone X (Unshaded) | No BFE Required",
  },
  {
    icon: Zap,
    title: "Utilities Assessment",
    description: "Water, sewer, electric, gas, and broadband availability with provider information and capacity.",
    preview: "All Utilities Available | Fiber: Yes",
  },
  {
    icon: Car,
    title: "Traffic Analysis",
    description: "AADT counts, road classification, peak hour volumes, and access point analysis.",
    preview: "AADT: 24,500 | Signalized Access Available",
  },
  {
    icon: Leaf,
    title: "Environmental Screening",
    description: "EPA facility proximity, wetlands presence, soil conditions, and environmental constraints.",
    preview: "No Wetlands | 0 EPA Facilities within 1mi",
  },
  {
    icon: Users,
    title: "Market Demographics",
    description: "Population, income, education, employment, and retail spending within drive-time radii.",
    preview: "Pop 5mi: 185,000 | Median HHI: $78,500",
  },
];

const dataSources = [
  "FEMA NFHL",
  "ArcGIS",
  "TxDOT",
  "EPA ECHO",
  "USFWS NWI",
  "U.S. Census",
  "HCAD",
  "FBCAD",
];

export default function SampleReport() {
  return (
    <>
      <SEOHead
        title="Sample Feasibility Report"
        description="Preview a complete SiteIntel feasibility report. See zoning, flood, utilities, traffic, and market analysis before you buy. Lender-ready format."
        keywords={["sample report", "feasibility example", "report preview", "lender-ready report"]}
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
                <FileText className="w-3 h-3 mr-1" />
                Report Preview
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                See What a $795 Report{" "}
                <span className="text-primary">Actually Delivers</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI-powered feasibility reports include everything lenders need: 
                zoning, flood, utilities, traffic, environmental, and demographics—all 
                with verified data citations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/products/feasibility">
                    Get Your Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample PDF
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Report Sections Preview */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                What's Inside Every Report
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Seven comprehensive sections covering every aspect of site feasibility, 
                powered by 20+ verified data sources.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {reportSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <section.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-2">
                            {section.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {section.description}
                          </p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-xs font-mono">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{section.preview}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sources Strip */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Every data point is verified and cited from authoritative sources
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {dataSources.map((source) => (
                  <Badge key={source} variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    {source}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Report Format Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Lender-Ready Format
                </h2>
                <p className="text-muted-foreground mb-6">
                  Our reports are designed to meet commercial lending requirements. 
                  Standardized formatting, complete citations, and professional 
                  presentation that loan committees expect.
                </p>
                <ul className="space-y-3">
                  {[
                    "Professional PDF format with branded cover page",
                    "Complete data sources appendix with timestamps",
                    "Executive summary with clear recommendations",
                    "Maps and visualizations for each analysis section",
                    "Signed URL for secure sharing with stakeholders",
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
                <Card className="border-2 border-primary/20 overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                    <div className="aspect-[8.5/11] bg-background rounded-lg shadow-xl p-6 relative">
                      {/* Mock report preview */}
                      <div className="space-y-4">
                        <div className="h-8 bg-primary/20 rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-24 bg-muted/50 rounded mt-6" />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="h-16 bg-muted/50 rounded" />
                          <div className="h-16 bg-muted/50 rounded" />
                        </div>
                      </div>
                      {/* Blur overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-8">
                        <Button asChild>
                          <Link to="/products/feasibility">
                            Unlock Full Report
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <blockquote className="text-xl md:text-2xl text-foreground italic mb-6">
                "I was skeptical an AI report could replace my usual consultant. 
                After seeing the depth of data and citations, I'm convinced. 
                My lender accepted it without questions."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">JM</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">James Mitchell</p>
                  <p className="text-sm text-muted-foreground">Developer, Houston TX</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready for Your Own Report?
              </h2>
              <p className="text-muted-foreground mb-8">
                Enter any address in Harris, Fort Bend, or Montgomery County. 
                Get a complete feasibility report in under 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/products/feasibility">
                    Start Your Report - $795
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">View Pricing Plans</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
