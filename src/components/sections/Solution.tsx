import { CheckCircle, Clock, ArrowRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Solution = () => {
  const comparisonRows = [
    {
      title: "Speed",
      traditional: "3–4 weeks for initial report, often delayed by consultant availability",
      siteintel: "10 minutes — instant AI-powered analysis with no waiting"
    },
    {
      title: "Cost",
      traditional: "$8,000–$15,000 per study, plus additional fees for revisions",
      siteintel: "$999 Access Fee — unlimited revisions included in Pro tier"
    },
    {
      title: "Scope",
      traditional: "Limited to consultant's local expertise and data access",
      siteintel: "Comprehensive statewide coverage across all Texas counties with 8+ federal data sources"
    },
    {
      title: "Data Accuracy",
      traditional: "Manual research, subject to human error and outdated records",
      siteintel: "Real-time API integration with FEMA, ArcGIS, EPA, and TxDOT — auto-updated"
    },
    {
      title: "Report Format",
      traditional: "PDF summary with limited citations and no interactive analysis",
      siteintel: "Professional PDF + interactive dashboard with full citation transparency"
    },
    {
      title: "Scalability",
      traditional: "One property at a time — bulk analysis requires separate contracts",
      siteintel: "Analyze 10, 50, or 500 sites simultaneously with API or CSV upload"
    },
    {
      title: "Transparency",
      traditional: "Black box methodology — unclear how conclusions were reached",
      siteintel: "Every data point cited with source, timestamp, and methodology exposed"
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4 relative inline-block">
            Traditional Feasibility vs. SiteIntel™ — A New Standard for Speed and Accuracy
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-maxx-red"></span>
          </h2>
          <p className="font-body text-lg md:text-xl text-charcoal/70 max-w-2xl mx-auto mt-6 leading-relaxed">
            Compare the old consultant-driven process to the new standard in automated land feasibility study and construction feasibility study workflows.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-lg border border-charcoal/10 shadow-md">
            {/* Header Row */}
            <div className="grid grid-cols-2 border-t-4 border-maxx-red bg-charcoal/5">
              <div className="p-6 border-r border-charcoal/10">
                <h3 className="font-headline text-xl text-charcoal font-semibold">Traditional Consultant-Based Feasibility</h3>
              </div>
              <div className="p-6">
                <h3 className="font-headline text-xl text-charcoal font-semibold">SiteIntel™ Automated Feasibility</h3>
              </div>
            </div>

            {/* Comparison Rows */}
            {comparisonRows.map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-2 ${index % 2 === 0 ? 'bg-white' : 'bg-charcoal/[0.02]'} hover:bg-accent/5 transition-colors duration-200`}
              >
                <div className="p-6 border-r border-charcoal/10">
                  <h4 className="font-body text-lg font-semibold text-charcoal mb-2">{row.title}</h4>
                  <div className="flex items-start space-x-2">
                    <Clock className="w-5 h-5 text-charcoal/40 flex-shrink-0 mt-0.5" />
                    <p className="font-body text-base text-charcoal/70">{row.traditional}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-body text-lg font-semibold text-charcoal mb-2">{row.title}</h4>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-label="Advantage in this category" />
                    <p className="font-body text-base text-charcoal">{row.siteintel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile/Tablet Accordion */}
          <div className="lg:hidden space-y-4">
            {comparisonRows.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-lg border border-charcoal/10 shadow-sm overflow-hidden"
              >
                <div className="border-l-4 border-maxx-red p-6">
                  <h4 className="font-headline text-xl text-charcoal mb-4">{row.title}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-body text-sm font-semibold text-charcoal/60 mb-2">Traditional</p>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-charcoal/40 flex-shrink-0 mt-1" />
                        <p className="font-body text-base text-charcoal/70">{row.traditional}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-body text-sm font-semibold text-charcoal/60 mb-2">SiteIntel™</p>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                        <p className="font-body text-base text-charcoal">{row.siteintel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supporting Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-body text-lg md:text-xl text-charcoal/70 max-w-3xl mx-auto text-center mb-10 leading-relaxed"
        >
          The feasibility process hasn't changed in 30 years — until now. SiteIntel™ brings construction feasibility study precision and land feasibility study speed into the AI era, empowering developers to make faster, data-backed decisions without sacrificing accuracy.
        </motion.p>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button 
            variant="maxx-red"
            size="lg"
            className="text-base px-8 py-4 h-auto font-cta group w-full sm:w-auto"
            onClick={() => window.location.href = '/application?step=2'}
          >
            Run a Feasibility Comparison
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="text-base px-8 py-4 h-auto font-cta border-accent text-accent hover:bg-accent/10 w-full sm:w-auto group"
            onClick={() => window.open('/sample-report.pdf', '_blank')}
          >
            View Sample Report
            <FileCheck className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};