import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Handshake,
  DollarSign,
  Code,
  Building2,
  CheckCircle,
  Users,
  Zap,
  Gift,
} from "lucide-react";

const partnerTiers = [
  {
    name: "Referral Partner",
    icon: Gift,
    description: "Earn rewards by referring clients to SiteIntel",
    benefits: [
      "$100 credit per successful referral",
      "Custom referral tracking link",
      "Monthly payout reports",
      "No minimum commitment",
    ],
    cta: "Start Referring",
    highlight: false,
  },
  {
    name: "Integration Partner",
    icon: Code,
    description: "Build on top of SiteIntel with our API",
    benefits: [
      "Full API access",
      "Developer documentation",
      "Technical support",
      "Co-marketing opportunities",
    ],
    cta: "Apply for API Access",
    highlight: true,
  },
  {
    name: "Reseller Partner",
    icon: Building2,
    description: "White-label SiteIntel for your clients",
    benefits: [
      "White-label reports",
      "Volume pricing",
      "Dedicated account manager",
      "Custom branding options",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const whyPartner = [
  {
    icon: DollarSign,
    title: "Earn More Revenue",
    description: "Add a new revenue stream with generous referral commissions and reseller margins.",
  },
  {
    icon: Users,
    title: "Serve Clients Better",
    description: "Offer your clients instant feasibility intelligence they can't get anywhere else.",
  },
  {
    icon: Zap,
    title: "Fast Integration",
    description: "Our API is designed for quick integration. Most partners are live within days.",
  },
  {
    icon: Handshake,
    title: "Real Support",
    description: "Dedicated partner success team to help you grow. We succeed when you succeed.",
  },
];

export default function Partners() {
  return (
    <>
      <SEOHead
        title="Partner Program - Earn Referral Credits"
        description="Join the SiteIntel partner network. Earn $100 per referral or integrate our API into your platform."
        keywords={["partner program", "referral", "API partner", "reseller", "affiliate"]}
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
                <Handshake className="w-3 h-3 mr-1" />
                Partner Program
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Grow With <span className="text-primary">SiteIntel</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join our partner network and help your clients make smarter real estate 
                decisions. Earn rewards, access our API, or white-label our platform.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Partner Tiers */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Choose Your Partnership Level
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're referring clients or building integrations, we have a 
                partnership tier that fits your needs.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {partnerTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full ${tier.highlight ? "border-primary border-2 relative" : ""}`}>
                    {tier.highlight && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <tier.icon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <p className="text-muted-foreground text-sm">{tier.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {tier.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="w-full" variant={tier.highlight ? "default" : "outline"}>
                        <Link to="/contact">{tier.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Partner */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Partner With SiteIntel?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {whyPartner.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                How Referrals Work
              </h2>
              <div className="space-y-8">
                {[
                  { step: 1, title: "Sign Up", description: "Create your partner account and get your unique referral link." },
                  { step: 2, title: "Share", description: "Share your link with clients, colleagues, and your network." },
                  { step: 3, title: "Earn", description: "Get $100 credit for every referral who purchases a report." },
                  { step: 4, title: "Grow", description: "Use credits for your own reports or cash out monthly." },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Partner With Us?
              </h2>
              <p className="text-secondary-foreground/80 mb-8">
                Join our growing network of partners and start earning today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="default">
                  <Link to="/contact">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  <Link to="/api-docs">View API Docs</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
