import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building,
  FileCheck,
  Clock,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  MapPin,
  Zap,
} from "lucide-react";

const benefits = [
  {
    icon: FileCheck,
    title: "Permit Pre-Screening",
    description: "Instantly verify zoning compatibility, flood zone status, and utility availability before applicants invest in full permit submissions.",
  },
  {
    icon: TrendingUp,
    title: "Economic Development",
    description: "Attract developers with data-ready site packages. Show them exactly what's buildable before they even visit.",
  },
  {
    icon: Clock,
    title: "Faster Reviews",
    description: "Reduce back-and-forth with developers by providing clear feasibility data upfront. Streamline your approval process.",
  },
  {
    icon: Shield,
    title: "Compliance Verification",
    description: "Ensure developments meet flood, environmental, and infrastructure requirements with verified data from FEMA, EPA, and more.",
  },
  {
    icon: MapPin,
    title: "Strategic Planning",
    description: "Identify underutilized parcels and target zones for development. Use data to guide growth initiatives.",
  },
  {
    icon: Users,
    title: "Public Transparency",
    description: "Provide citizens and council members with clear, data-backed reports on proposed developments.",
  },
];

const useCases = [
  {
    title: "Pre-Application Conferences",
    description: "Generate feasibility reports before developer meetings to have informed discussions about site constraints and opportunities.",
  },
  {
    title: "Economic Development Marketing",
    description: "Create data-rich site packages for available parcels to attract commercial and industrial investment.",
  },
  {
    title: "Capital Improvement Planning",
    description: "Analyze infrastructure gaps across parcels to prioritize water, sewer, and road investments.",
  },
  {
    title: "Zoning Amendment Reviews",
    description: "Quickly assess impacts of proposed zoning changes with real data on flood zones, traffic, and utilities.",
  },
];

export default function Municipalities() {
  return (
    <>
      <SEOHead
        title="For Municipalities & Economic Development"
        description="Help municipalities attract development with instant feasibility pre-screening and compliance verification. Streamline permit reviews."
        keywords={["municipalities", "economic development", "permit screening", "city planning"]}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-secondary text-secondary-foreground">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/90" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <Badge variant="outline" className="mb-6 border-primary text-primary">
                <Building className="w-3 h-3 mr-1" />
                For Municipalities
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Smarter Planning.{" "}
                <span className="text-primary">Faster Development.</span>
              </h1>
              <p className="text-xl text-secondary-foreground/80 mb-8">
                Empower your planning and economic development teams with instant, 
                verified feasibility data. Attract investment, streamline reviews, 
                and build your community with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link to="/contact">
                    Schedule a Demo
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

        {/* Benefits Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Transform Your Planning Process
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From pre-application to approval, SiteIntel provides the verified data 
                your team needs to make informed decisions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Common Use Cases
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{useCase.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Data You Can Trust
              </h2>
              <p className="text-muted-foreground mb-8">
                Every report pulls from the same authoritative sources your staff already uses: 
                FEMA flood maps, county appraisal districts, TxDOT traffic counts, EPA environmental 
                databases, and more. All data is cited with timestamps.
              </p>
              <Button asChild variant="outline">
                <Link to="/data-sources">View All Data Sources</Link>
              </Button>
            </motion.div>
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
                Ready to Modernize Your Planning Process?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Join forward-thinking municipalities using SiteIntel to attract 
                development and serve their communities better.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link to="/contact">
                  Request a Municipal Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
