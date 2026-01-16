import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Ruler,
  FileSearch,
  Clock,
  Layers,
  CheckCircle,
  Zap,
  AlertTriangle,
  Map,
  Droplets,
} from "lucide-react";

const benefits = [
  {
    icon: FileSearch,
    title: "Pre-Design Site Validation",
    description: "Validate site constraints before starting design. Know zoning setbacks, height limits, and FAR requirements upfront.",
  },
  {
    icon: AlertTriangle,
    title: "Early Constraint Identification",
    description: "Identify flood zones, wetlands, environmental issues, and utility gaps before they become costly design revisions.",
  },
  {
    icon: Clock,
    title: "Client Consultation Support",
    description: "Impress clients with instant site intelligence. Answer feasibility questions in the first meeting, not weeks later.",
  },
  {
    icon: Layers,
    title: "Design Optimization Data",
    description: "Get the data you need to optimize your design: setbacks, building envelopes, utility locations, and traffic access.",
  },
  {
    icon: Map,
    title: "Geospatial Intelligence",
    description: "Access verified GIS data from FEMA, county sources, and state agencies. All in one standardized report.",
  },
  {
    icon: Droplets,
    title: "Flood & Drainage Data",
    description: "Get FEMA flood zone determination, base flood elevation, and drainage considerations before site planning.",
  },
];

const dataPoints = [
  { label: "Zoning Code", description: "Permitted uses, setbacks, FAR, height limits" },
  { label: "Flood Zone", description: "FEMA designation, BFE, historical flood events" },
  { label: "Utilities", description: "Water, sewer, storm, electric availability" },
  { label: "Traffic", description: "AADT counts, access points, road classification" },
  { label: "Environmental", description: "EPA sites, wetlands, soil conditions" },
  { label: "Parcel Data", description: "Acreage, owner, legal description, boundaries" },
];

export default function ArchitectsEngineers() {
  return (
    <>
      <SEOHead
        title="For Architects & Engineers"
        description="Validate site constraints before design begins. Get zoning, utilities, flood, and environmental data instantly for informed design decisions."
        keywords={["architects", "engineers", "site validation", "pre-design", "site constraints"]}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <Badge variant="outline" className="mb-6 border-primary text-primary">
                <Ruler className="w-3 h-3 mr-1" />
                For Architects & Engineers
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Know Your Site{" "}
                <span className="text-primary">Before You Design.</span>
              </h1>
              <p className="text-xl text-secondary-foreground/80 mb-8">
                Get instant access to zoning requirements, flood data, utility locations, 
                and environmental constraints. Design with confidence from day one.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link to="/get-started">
                    Analyze a Site
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  <Link to="/sample-report">View Sample Report</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-8 mb-16"
              >
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="pt-6">
                    <AlertTriangle className="w-8 h-8 text-destructive mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">The Problem</h3>
                    <p className="text-muted-foreground">
                      Design teams often start work before fully understanding site constraints. 
                      This leads to costly revisions when flood zones, zoning limits, or utility 
                      gaps are discovered mid-project.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="pt-6">
                    <Zap className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">The Solution</h3>
                    <p className="text-muted-foreground">
                      SiteIntel delivers comprehensive site intelligence in 10 minutes. 
                      Know every constraint before the first sketch, and design with 
                      confidence from the start.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Design Smarter, Not Harder
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get the site intelligence you need at the start of every project.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Points */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Data You Need for Design
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every SiteIntel report includes the key data points 
                architects and engineers need.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataPoints.map((point, index) => (
                <motion.div
                  key={point.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/30"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{point.label}</div>
                    <div className="text-sm text-muted-foreground">{point.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Design with Confidence?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Get complete site intelligence before your next project. 
                10 minutes to data, not 3 weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/get-started">
                    Analyze Your First Site
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/data-sources">View Data Sources</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
