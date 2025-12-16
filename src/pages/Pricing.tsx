import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, FileText, Crown, Building2, HelpCircle } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const tiers = [
  {
    name: "QuickCheck",
    price: "Free",
    description: "Instant feasibility snapshot",
    icon: Zap,
    features: [
      { name: "Instant Feasibility Score (A/B/C)", included: true },
      { name: "Basic Zoning Check", included: true },
      { name: "Flood Zone Indicator", included: true },
      { name: "Parcel Boundary Preview", included: true },
      { name: "Full AI-Generated Report", included: false },
      { name: "Detailed Utility Analysis", included: false },
      { name: "EPA Environmental Data", included: false },
      { name: "Traffic & AADT Data", included: false },
      { name: "PDF Export", included: false },
      { name: "Lender-Ready Documentation", included: false },
    ],
    cta: "Run Free QuickCheck",
    href: "/application?step=2",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Site Feasibility Intelligence™",
    price: "$1,495",
    priceDetail: "per report",
    description: "Complete lender-ready feasibility analysis",
    icon: FileText,
    features: [
      { name: "Instant Feasibility Score (A/B/C)", included: true },
      { name: "Basic Zoning Check", included: true },
      { name: "Flood Zone Indicator", included: true },
      { name: "Parcel Boundary Preview", included: true },
      { name: "Full AI-Generated Report", included: true },
      { name: "Detailed Utility Analysis", included: true },
      { name: "EPA Environmental Data", included: true },
      { name: "Traffic & AADT Data", included: true },
      { name: "PDF Export", included: true },
      { name: "Lender-Ready Documentation", included: true },
    ],
    cta: "Purchase Report",
    paymentType: "report" as const,
    variant: "default" as const,
    popular: true,
    isPrimary: true,
  },
  {
    name: "Pro Subscription",
    price: "$1,950",
    priceDetail: "/month",
    description: "For teams running multiple analyses",
    icon: Crown,
    features: [
      { name: "Instant Feasibility Score (A/B/C)", included: true },
      { name: "Basic Zoning Check", included: true },
      { name: "Flood Zone Indicator", included: true },
      { name: "Parcel Boundary Preview", included: true },
      { name: "Full AI-Generated Report", included: true },
      { name: "Detailed Utility Analysis", included: true },
      { name: "EPA Environmental Data", included: true },
      { name: "Traffic & AADT Data", included: true },
      { name: "PDF Export", included: true },
      { name: "Lender-Ready Documentation", included: true },
      { name: "10 Reports per Month", included: true },
      { name: "Unlimited QuickChecks", included: true },
      { name: "Priority Support", included: true },
      { name: "API Access", included: true },
    ],
    cta: "Subscribe Now",
    paymentType: "subscription" as const,
    variant: "default" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "How quickly do I receive my report?",
    answer: "Professional Reports are generated in under 10 minutes. Our AI pipeline pulls data from 8+ authoritative sources (FEMA, EPA, TxDOT, county CAD records, and more) and synthesizes it into a comprehensive feasibility analysis.",
  },
  {
    question: "Are the reports accepted by lenders?",
    answer: "Yes. Our reports are designed to meet lender requirements with proper citations, verified data sources, and audit-ready documentation. Every data point includes its source and timestamp for full transparency.",
  },
  {
    question: "What's included in the free QuickCheck?",
    answer: "QuickCheck provides an instant feasibility grade (A, B, or C) based on zoning compatibility, flood risk, and basic parcel data. It's perfect for quickly screening properties before committing to a full analysis.",
  },
  {
    question: "Can I upgrade from pay-per-report to Pro?",
    answer: "Absolutely! You can upgrade to Pro at any time. Your purchased report credits remain available, and you'll immediately gain access to your monthly allocation plus all Pro features.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe integration. For Enterprise accounts, we also support invoicing and ACH transfers.",
  },
  {
    question: "What's your refund policy?",
    answer: "If our system cannot generate a report due to insufficient data for your property, you will not be charged. For other issues, contact our support team within 7 days of purchase for a full refund.",
  },
  {
    question: "Do unused Pro credits roll over?",
    answer: "Monthly report credits reset each billing cycle and do not roll over. However, any individually purchased report credits remain available until used.",
  },
  {
    question: "What areas do you cover?",
    answer: "We currently provide comprehensive coverage for Harris, Fort Bend, and Montgomery counties in Texas. We're actively expanding to additional Texas metros and will announce new coverage areas soon.",
  },
];

export default function Pricing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4 border-accent text-accent">
            Transparent Pricing
          </Badge>
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Flexible Pricing for Every Project
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From quick feasibility checks to comprehensive lender-ready reports. 
            Pay per report or save with a Pro subscription.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.popular 
                    ? "border-primary shadow-lg shadow-primary/20 scale-105" 
                    : "border-border"
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-muted w-fit">
                    <tier.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                    {tier.priceDetail && (
                      <span className="text-muted-foreground ml-1">{tier.priceDetail}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {tier.href ? (
                    <Button asChild variant={tier.variant} className="w-full">
                      <Link to={tier.href}>{tier.cta}</Link>
                    </Button>
                  ) : tier.paymentType && isAuthenticated ? (
                    <PaymentButton 
                      type={tier.paymentType} 
                      variant={tier.variant} 
                      className={`w-full ${tier.isPrimary ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      {tier.cta}
                    </PaymentButton>
                  ) : tier.paymentType ? (
                    <Button 
                      asChild 
                      variant={tier.variant} 
                      className={`w-full ${tier.isPrimary ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      <Link to="/auth">Sign in to {tier.cta}</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-headline text-3xl md:text-4xl text-center text-foreground mb-12">
            Compare All Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">QuickCheck</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Pro Sub</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Feasibility Score", quick: true, pro: true, sub: true },
                  { feature: "Zoning Check", quick: "Basic", pro: "Detailed", sub: "Detailed" },
                  { feature: "Flood Zone Analysis", quick: "Indicator", pro: "Full FEMA Data", sub: "Full FEMA Data" },
                  { feature: "Parcel Data", quick: "Preview", pro: "Complete", sub: "Complete" },
                  { feature: "Utility Analysis", quick: false, pro: true, sub: true },
                  { feature: "Environmental (EPA)", quick: false, pro: true, sub: true },
                  { feature: "Traffic Data (TxDOT)", quick: false, pro: true, sub: true },
                  { feature: "AI Narrative Report", quick: false, pro: true, sub: true },
                  { feature: "PDF Export", quick: false, pro: true, sub: true },
                  { feature: "Lender-Ready Format", quick: false, pro: true, sub: true },
                  { feature: "Reports Included", quick: "—", pro: "1", sub: "10/month" },
                  { feature: "API Access", quick: false, pro: false, sub: true },
                  { feature: "Priority Support", quick: false, pro: false, sub: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-3 px-4 text-foreground">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.quick === "boolean" ? (
                        row.quick ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">{row.quick}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center bg-primary/5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-foreground font-medium text-sm">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.sub === "boolean" ? (
                        row.sub ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">{row.sub}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Risk Reversal */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-primary/20">
            <h3 className="font-headline text-2xl md:text-3xl text-foreground mb-4">
              100% Satisfaction Guarantee
            </h3>
            <p className="text-muted-foreground mb-6">
              If our system cannot generate a complete report due to data limitations for your property, 
              you won't be charged. For any other issues, contact us within 7 days for a full refund.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                No charge if report fails
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                7-day refund window
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Cancel subscription anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 px-6 bg-secondary">
        <div className="container mx-auto max-w-4xl text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-headline text-3xl md:text-4xl text-foreground mb-4">
            Need Enterprise Volume?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            For teams processing 50+ properties per month, we offer custom pricing, 
            dedicated support, white-label options, and API integrations.
          </p>
          <Button asChild size="lg">
            <Link to="/contact">Contact Sales</Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-headline text-3xl md:text-4xl text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about our pricing and reports.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl md:text-4xl text-primary-foreground mb-6">
            Ready to Make Smarter Site Decisions?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Start with a free QuickCheck or get your first Professional Report today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/application?step=2">Run Free QuickCheck</Link>
            </Button>
            {isAuthenticated ? (
              <PaymentButton type="report" size="lg" className="bg-background/20 text-primary-foreground border-primary-foreground/30 hover:bg-background/30">
                Access Intelligence — $1,495
              </PaymentButton>
            ) : (
              <Button asChild size="lg" variant="outline" className="bg-background/20 text-primary-foreground border-primary-foreground/30 hover:bg-background/30">
                <Link to="/auth">Sign In to Purchase</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
