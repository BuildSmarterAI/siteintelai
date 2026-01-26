import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Building2, HelpCircle, Database, Clock, Shield } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import { BillingToggle } from "@/components/subscription/BillingToggle";
import { SubscriptionTierCard } from "@/components/subscription/SubscriptionTierCard";
import { SUBSCRIPTION_TIERS, TIER_ORDER, BillingCycle } from "@/config/subscription-tiers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  "AI Feasibility Score (0-100)",
  "Detailed Zoning Analysis", 
  "FEMA Flood Zone Data",
  "Parcel Boundary & CAD Data",
  "Utility Infrastructure Analysis",
  "EPA Environmental Data",
  "TxDOT Traffic & AADT Data",
  "Market Demographics",
  "AI-Generated Narrative Report",
  "Lender-Ready PDF Export",
  "60-Second Delivery",
];

const faqs = [
  {
    question: "How quickly do I receive my report?",
    answer: "Reports are generated in under 60 seconds. Our AI pipeline pulls data from 8+ authoritative sources (FEMA, EPA, TxDOT, county CAD records, and more) and synthesizes it into a comprehensive feasibility analysis.",
  },
  {
    question: "What's included in the $999 report?",
    answer: "Everything you need for site due diligence: AI feasibility score, detailed zoning analysis, FEMA flood zone data, utility infrastructure analysis, EPA environmental data, TxDOT traffic counts, market demographics, AI-generated narrative report, and a lender-ready PDF export.",
  },
  {
    question: "Are the reports accepted by lenders?",
    answer: "Yes. Our reports are designed to meet lender requirements with proper citations, verified data sources, and audit-ready documentation. Every data point includes its source and timestamp for full transparency.",
  },
  {
    question: "How is this different from a traditional feasibility study?",
    answer: "Traditional feasibility studies cost $5,000-$15,000 and take 2-4 weeks. SiteIntel delivers the same authoritative data analysis in 60 seconds for $999, with full source citations and lender-ready formatting.",
  },
  {
    question: "What's the difference between one-off and subscription?",
    answer: "One-off reports are $999 each with no commitment. Subscriptions offer monthly report credits at a lower per-report cost, plus additional features like dashboard access, Excel exports, and API access depending on your tier.",
  },
  {
    question: "Can I change my subscription plan?",
    answer: "Yes, you can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe integration. For Enterprise accounts, we also support invoicing and ACH transfers.",
  },
  {
    question: "What's your refund policy?",
    answer: "If our system cannot generate a report due to insufficient data for your property, you will not be charged. For other issues, contact our support team within 7 days of purchase for a full refund.",
  },
];

export default function Pricing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

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
    <>
      <SEOHead
        title="Pricing - $999 Feasibility Report | Subscriptions from $199/mo"
        description="Get a complete lender-ready feasibility report for $999 or subscribe for monthly credits. AI-powered analysis with FEMA, EPA, TxDOT data delivered in 60 seconds."
        keywords={["feasibility pricing", "report cost", "real estate software pricing", "subscription plans"]}
      />
      <ProductJsonLd
        name="Site Feasibility Intelligence Report"
        description="Complete lender-ready feasibility analysis with zoning, flood, utility, and environmental data."
        price="999"
      />
      <FAQJsonLd items={faqs} />
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4 border-accent text-accent">
            Launch Pricing
          </Badge>
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Flexible Plans for Every Developer
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From single reports to unlimited enterprise access. Get lender-ready feasibility intelligence in 60 seconds.
          </p>
        </div>
      </section>

      {/* One-Off Report */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Single Report</h2>
          <Card className="relative border-primary shadow-lg shadow-primary/20">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
              No Commitment
            </Badge>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-muted w-fit">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Site Feasibility Intelligence™</CardTitle>
              <CardDescription>Complete lender-ready feasibility analysis</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold text-foreground">$999</span>
                <span className="text-muted-foreground ml-2">per report</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isAuthenticated ? (
                <PaymentButton 
                  type="report" 
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  Get Your Report - $999
                </PaymentButton>
              ) : (
                <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  <Link to="/auth">Get Your Report - $999</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Subscription Plans
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Save up to 33% with annual billing. Get monthly report credits at a lower per-report cost.
            </p>
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIER_ORDER.map((tierId) => (
              <SubscriptionTierCard
                key={tierId}
                tier={SUBSCRIPTION_TIERS[tierId]}
                billingCycle={billingCycle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" />
              <span className="text-sm">FEMA • EPA • TxDOT</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <span className="text-sm">60-Second Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">Lender-Ready</span>
            </div>
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
                Secure payment via Stripe
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
              Everything you need to know about our reports and pricing.
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
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Get complete feasibility intelligence in 60 seconds.
          </p>
          {isAuthenticated ? (
            <PaymentButton 
              type="report" 
              variant="secondary" 
              className="text-lg px-8 py-6"
            >
              Get Your Report - $999
            </PaymentButton>
          ) : (
            <Button asChild variant="secondary" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth">Get Your Report - $999</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
    </>
  );
}
