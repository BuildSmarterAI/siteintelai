import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  Zap,
  Target,
  Award,
} from "lucide-react";

const benefits = [
  {
    icon: FileText,
    title: "Differentiate Your Listings",
    description: "Stand out from competitors with data-rich feasibility packages attached to every listing. Give buyers the intel they need instantly.",
  },
  {
    icon: Clock,
    title: "Accelerate Buyer Decisions",
    description: "Eliminate weeks of due diligence delays. Buyers can evaluate feasibility before scheduling site visits.",
  },
  {
    icon: Target,
    title: "Qualify Buyers Faster",
    description: "Serious buyers ask for feasibility data. Provide it upfront and focus on qualified prospects.",
  },
  {
    icon: TrendingUp,
    title: "Higher Close Rates",
    description: "Deals with complete feasibility data close faster and with fewer surprises during due diligence.",
  },
  {
    icon: Award,
    title: "Build Your Reputation",
    description: "Be known as the broker who provides complete, professional packages. Earn referrals and repeat business.",
  },
  {
    icon: Users,
    title: "Serve Developers Better",
    description: "Your developer clients expect speed and data. Deliver both with instant feasibility reports.",
  },
];

const features = [
  "Complete zoning analysis with permitted uses",
  "FEMA flood zone determination with BFE",
  "Utility availability assessment",
  "Traffic counts and access analysis",
  "Environmental screening",
  "Demographic summary for the trade area",
];

export default function LandBrokers() {
  return (
    <>
      <SEOHead
        title="For Land Brokers & Commercial Real Estate Agents"
        description="Differentiate your listings with instant feasibility reports. Help buyers make faster decisions and close more deals."
        keywords={["land brokers", "commercial real estate", "listing tools", "property marketing"]}
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
                <Briefcase className="w-3 h-3 mr-1" />
                For Land Brokers
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Win More Listings.{" "}
                <span className="text-primary">Close Faster.</span>
              </h1>
              <p className="text-xl text-secondary-foreground/80 mb-8">
                Give your buyers instant feasibility intelligence on every listing. 
                Differentiate yourself, accelerate decisions, and become the broker 
                developers trust for complete property packages.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link to="/get-started">
                    Try It On a Listing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  <Link to="/sample-report">See Sample Report</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  The Competitive Edge You Need
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  In a competitive market, the broker with the best data wins. 
                  SiteIntel gives you that advantage.
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
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    What's in Every Report
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Each SiteIntel report gives buyers everything they need to 
                    evaluate feasibility before writing an offer.
                  </p>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-foreground mb-2">$795</div>
                  <div className="text-muted-foreground mb-4">per report</div>
                  <div className="text-sm text-muted-foreground mb-6">
                    Delivered in 10 minutes • Lender-ready format
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/get-started">Generate a Report</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
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
                "I attach a SiteIntel report to every listing now. Buyers love it, 
                and I've had multiple deals close faster because the data was already there."
              </blockquote>
              <div className="text-muted-foreground">
                — Commercial Land Broker, Houston
              </div>
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
                Ready to Elevate Your Listings?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Try SiteIntel on your next listing and see the difference 
                data-driven marketing makes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/get-started">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
