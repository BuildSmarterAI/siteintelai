import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  X,
  Clock,
  DollarSign,
  Database,
  FileCheck,
  RefreshCw,
  Users,
  Zap,
  Scale,
} from "lucide-react";

const comparisonData = [
  {
    feature: "Cost",
    traditional: "$5,000 - $15,000",
    siteintel: "$795",
    icon: DollarSign,
    highlight: true,
  },
  {
    feature: "Delivery Time",
    traditional: "2-4 weeks",
    siteintel: "10 minutes",
    icon: Clock,
    highlight: true,
  },
  {
    feature: "Data Sources",
    traditional: "Manual research",
    siteintel: "20+ verified APIs",
    icon: Database,
  },
  {
    feature: "Lender Ready",
    traditional: "Often requires edits",
    siteintel: "Yes, standardized format",
    icon: FileCheck,
  },
  {
    feature: "Report Updates",
    traditional: "Re-engagement required",
    siteintel: "Instant re-run",
    icon: RefreshCw,
  },
  {
    feature: "Citations & Sources",
    traditional: "Varies by consultant",
    siteintel: "100% cited with timestamps",
    icon: Scale,
  },
  {
    feature: "Scalability",
    traditional: "1 site at a time",
    siteintel: "Unlimited parallel analysis",
    icon: Users,
  },
  {
    feature: "AI-Powered Insights",
    traditional: false,
    siteintel: true,
    icon: Zap,
  },
];

export default function Compare() {
  return (
    <>
      <SEOHead
        title="SiteIntel vs Traditional Consultants"
        description="Compare SiteIntel AI feasibility reports to traditional consultants. Save 90% cost and get results in 10 minutes instead of weeks."
        keywords={["compare feasibility", "consultant alternative", "cost savings", "AI vs manual"]}
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
              <Badge variant="outline" className="mb-6 border-primary text-primary">
                <Scale className="w-3 h-3 mr-1" />
                Side-by-Side Comparison
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                SiteIntel vs Traditional{" "}
                <span className="text-primary">Feasibility Consultants</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                See why developers and investors are switching to AI-powered feasibility.
                Same data quality, fraction of the cost, delivered in minutes.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Table Header */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Feature
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Traditional Consultant
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                    SiteIntel™
                  </div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {comparisonData.map((row, index) => (
                  <motion.div
                    key={row.feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-3 gap-4 p-4 rounded-lg ${
                      row.highlight
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <row.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{row.feature}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      {typeof row.traditional === "boolean" ? (
                        row.traditional ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm text-center">
                          {row.traditional}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {typeof row.siteintel === "boolean" ? (
                        row.siteintel ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <span className="text-primary font-medium text-sm text-center">
                          {row.siteintel}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cost Comparison Visual */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
                The Cost of Waiting
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Traditional */}
                <div className="bg-card border border-border rounded-xl p-8">
                  <div className="text-muted-foreground text-sm uppercase tracking-wide mb-4">
                    Traditional Consultant
                  </div>
                  <div className="text-5xl font-bold text-foreground mb-2">$10,000</div>
                  <div className="text-muted-foreground mb-6">+ 3 weeks waiting</div>
                  <div className="space-y-3 text-left text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span>Deal may be gone by delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span>Additional cost for revisions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span>Limited to one site at a time</span>
                    </div>
                  </div>
                </div>

                {/* SiteIntel */}
                <div className="bg-primary/5 border-2 border-primary rounded-xl p-8 relative">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    92% Savings
                  </Badge>
                  <div className="text-primary text-sm uppercase tracking-wide mb-4">
                    SiteIntel™
                  </div>
                  <div className="text-5xl font-bold text-foreground mb-2">$795</div>
                  <div className="text-primary mb-6">10 minutes delivery</div>
                  <div className="space-y-3 text-left text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Move fast on opportunities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Unlimited updates included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Analyze multiple sites in parallel</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground mb-6 italic">
                "We used to wait 3 weeks for a consultant report. Now we get the same 
                quality data in 10 minutes. It's changed how we compete for deals."
              </blockquote>
              <div className="text-muted-foreground">
                — Development Director, Houston-based CRE Firm
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Switch to AI-Powered Feasibility?
              </h2>
              <p className="text-secondary-foreground/80 mb-8">
                Join hundreds of developers who've made the switch. 
                Get your first report in 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="default">
                  <Link to="/get-started">
                    Get Started Now
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
      </main>
    </>
  );
}
