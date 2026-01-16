import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const faqCategories = {
  general: [
    {
      question: "What is SiteIntel?",
      answer: "SiteIntel is an AI-powered feasibility platform that delivers lender-ready site analysis reports in minutes. We aggregate data from 20+ authoritative sources including FEMA, ArcGIS, TxDOT, and EPA to provide comprehensive zoning, flood, utilities, and market analysis.",
    },
    {
      question: "How long does it take to get a report?",
      answer: "Most reports are generated in under 10 minutes. Our AI processes data from multiple sources simultaneously, compared to traditional consultants who may take 2-4 weeks.",
    },
    {
      question: "What areas do you cover?",
      answer: "Currently, we provide comprehensive coverage for Harris, Fort Bend, and Montgomery counties in Texas. We're expanding to additional Texas metros and other states in 2025.",
    },
    {
      question: "Is SiteIntel a replacement for environmental consultants?",
      answer: "SiteIntel provides preliminary feasibility screening based on publicly available data. For Phase I Environmental Site Assessments or detailed engineering studies, you'll still need licensed professionals. However, our reports help you avoid costly studies on non-viable sites.",
    },
  ],
  pricing: [
    {
      question: "How much does a feasibility report cost?",
      answer: "A complete lender-ready feasibility report costs $795. This includes zoning analysis, flood zone assessment, utilities mapping, traffic data, environmental screening, and demographic analysis.",
    },
    {
      question: "Do you offer subscription plans?",
      answer: "Yes! Our Pro subscription ($1,950/month) includes 10 reports per month at a significant discount. Enterprise plans with API access are available for high-volume users.",
    },
    {
      question: "What's included in the free QuickCheck?",
      answer: "The free QuickCheck provides an instant feasibility score (A/B/C rating) with basic zoning and flood zone indicators. To unlock the full report with detailed analysis, citations, and lender-ready formatting, upgrade for $795.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a Report Guarantee: if your lender doesn't accept our report format, we'll work with you to address their requirements or provide a full refund within 30 days.",
    },
  ],
  technical: [
    {
      question: "Where does your data come from?",
      answer: "We pull from authoritative sources including FEMA (flood zones), Harris/Fort Bend/Montgomery County Appraisal Districts (parcels), TxDOT (traffic counts), EPA ECHO (environmental facilities), USFWS (wetlands), and U.S. Census (demographics). All data is cited with timestamps.",
    },
    {
      question: "How often is the data updated?",
      answer: "Data freshness varies by source: parcel data updates bi-weekly, FEMA flood maps update as new FIRM panels are released, traffic counts are updated annually by TxDOT, and demographic data follows Census ACS 5-year estimates.",
    },
    {
      question: "Can I access your data via API?",
      answer: "Yes! Our Enterprise tier includes API access for integrating SiteIntel data into your own systems. Contact our sales team at hello@siteintel.com for API documentation and pricing.",
    },
    {
      question: "What coordinate system do you use?",
      answer: "We standardize all outputs to WGS84 (EPSG:4326) for compatibility. Source data from Texas counties in NAD83 State Plane (EPSG:2278) is automatically transformed.",
    },
  ],
  lenders: [
    {
      question: "Are your reports accepted by lenders?",
      answer: "Yes! Our reports are designed to meet commercial real estate lending requirements. They include standardized formatting, complete data citations, and the analytical depth that loan committees expect.",
    },
    {
      question: "What's included in a lender-ready report?",
      answer: "Each report includes: executive summary, feasibility score with methodology, zoning analysis with permitted uses, FEMA flood zone determination with BFE, utilities assessment, traffic analysis, environmental screening, demographic summary, and a complete data sources appendix.",
    },
    {
      question: "Can you provide reports for SBA loans?",
      answer: "Our reports support SBA 504 and 7(a) loan applications by providing the site feasibility documentation typically required. We recommend confirming specific requirements with your SBA lender.",
    },
    {
      question: "Do you provide Phase I ESAs?",
      answer: "No, SiteIntel provides preliminary environmental screening based on EPA ECHO data and wetlands mapping. For ASTM-compliant Phase I Environmental Site Assessments, you'll need a licensed environmental consultant. Our reports help you identify sites that may warrant further investigation.",
    },
  ],
};

// Flatten all FAQs for JSON-LD
const allFaqs = Object.values(faqCategories).flat();

export default function FAQ() {
  return (
    <>
      <SEOHead
        title="FAQ - Frequently Asked Questions"
        description="Get answers about SiteIntel feasibility reports, pricing, data sources, and lender acceptance. Everything you need to know about AI-powered site analysis."
        keywords={["FAQ", "feasibility questions", "real estate FAQ", "SiteIntel help"]}
      />
      <FAQJsonLd items={allFaqs} />

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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Help Center</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about SiteIntel feasibility reports, 
                pricing, data sources, and lender requirements.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Tabs Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="general" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="lenders">For Lenders</TabsTrigger>
              </TabsList>

              {Object.entries(faqCategories).map(([category, faqs]) => (
                <TabsContent key={category} value={category}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`${category}-${index}`}>
                          <AccordionTrigger className="text-left text-foreground hover:text-primary">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
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
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-8">
                Our team is here to help. Reach out for personalized assistance 
                or schedule a demo to see SiteIntel in action.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/contact">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/how-it-works">See How It Works</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
