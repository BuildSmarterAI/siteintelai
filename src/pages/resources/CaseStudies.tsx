import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Clock, DollarSign, Building2, Landmark, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const caseStudies = [
  {
    id: "miszoned-parcel",
    title: "How a Developer Avoided a $250K Mistake",
    subtitle: "Miszoned parcel identified before closing",
    industry: "Developer",
    icon: Building2,
    problem: "A Houston-based developer was under contract for a 5-acre parcel in Fort Bend County, planning a 120-unit multifamily project. Traditional due diligence was quoted at $12,000 and 3 weeks.",
    solution: "SiteIntel's QuickCheck revealed a critical issue: the parcel was zoned Agricultural (AG), not the assumed Multi-Family (MF-2). The full report confirmed no variance history and identified a pending conservation overlay.",
    outcome: "The developer renegotiated the contract, saving an estimated $250,000 in entitlement costs and 18 months of rezoning delays. Total SiteIntel cost: $795.",
    metrics: [
      { label: "Cost Avoided", value: "$250K+" },
      { label: "Time to Discovery", value: "10 min" },
      { label: "Report Cost", value: "$795" },
    ],
  },
  {
    id: "lender-ready",
    title: "Lender-Ready in 10 Minutes",
    subtitle: "Bridge loan approved same day",
    industry: "Lender",
    icon: Landmark,
    problem: "A private lender needed feasibility documentation for a bridge loan on a retail center acquisition. The borrower's deal had a 5-day close timeline. Traditional consultants couldn't deliver.",
    solution: "The borrower ordered a SiteIntel Feasibility report. Within 10 minutes, the lender received a complete report with zoning, flood zone (Zone X), utilities confirmation, and traffic analysis with AADT data.",
    outcome: "The loan committee approved the deal the same day. The standardized format and verified citations met their underwriting requirements without additional documentation requests.",
    metrics: [
      { label: "Approval Time", value: "Same Day" },
      { label: "Report Delivery", value: "10 min" },
      { label: "Close Timeline Met", value: "Yes" },
    ],
  },
  {
    id: "portfolio-screening",
    title: "50 Sites Screened in One Week",
    subtitle: "Investment fund portfolio analysis",
    industry: "Investor",
    icon: Briefcase,
    problem: "A private equity fund acquired a portfolio of 50 land parcels across the Houston metro. They needed feasibility screening on all sites to prioritize development sequencing and identify any fatal flaws.",
    solution: "Using SiteIntel's Pro subscription, the fund ran QuickChecks on all 50 parcels, then ordered full reports on the top 15 candidates. The entire process took one analyst one week.",
    outcome: "Three parcels were flagged with wetlands issues, two had flood zone complications. The fund prioritized the 10 cleanest sites for immediate development, saving months of scattered due diligence.",
    metrics: [
      { label: "Sites Screened", value: "50" },
      { label: "Issues Found", value: "5" },
      { label: "Time Spent", value: "1 week" },
    ],
  },
];

export default function CaseStudies() {
  return (
    <>
      <SEOHead
        title="Case Studies - Customer Success Stories"
        description="See how developers, lenders, and investors use SiteIntel to save time and money on feasibility analysis. Real results from real projects."
        keywords={["case studies", "success stories", "real estate ROI", "feasibility examples"]}
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
                <TrendingUp className="w-3 h-3 mr-1" />
                Success Stories
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Real Results from{" "}
                <span className="text-primary">Real Projects</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                See how developers, lenders, and investors are using SiteIntel 
                to make faster, smarter decisions on commercial real estate.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="space-y-12 max-w-5xl mx-auto">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <study.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {study.industry}
                            </Badge>
                            <h2 className="text-xl font-bold text-foreground">
                              {study.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {study.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {study.metrics.map((metric) => (
                            <div key={metric.label} className="text-center px-4 py-2 rounded-lg bg-background">
                              <p className="text-lg font-bold text-primary">{metric.value}</p>
                              <p className="text-xs text-muted-foreground">{metric.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">1</span>
                            The Problem
                          </h3>
                          <p className="text-sm text-muted-foreground">{study.problem}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-xs flex items-center justify-center font-bold">2</span>
                            The Solution
                          </h3>
                          <p className="text-sm text-muted-foreground">{study.solution}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-bold">3</span>
                            The Outcome
                          </h3>
                          <p className="text-sm text-muted-foreground">{study.outcome}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                By the Numbers
              </h2>
              <p className="text-muted-foreground">
                Aggregate impact across all SiteIntel users
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Clock, value: "10 min", label: "Average report time" },
                { icon: DollarSign, value: "92%", label: "Cost savings vs consultants" },
                { icon: TrendingUp, value: "500+", label: "Reports delivered" },
                { icon: Building2, value: "3", label: "Texas counties covered" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
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
                Start Your Success Story
              </h2>
              <p className="text-muted-foreground mb-8">
                Join the developers, lenders, and investors already saving time 
                and money with AI-powered feasibility analysis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/products/feasibility">
                    Get Your Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Share Your Story</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
