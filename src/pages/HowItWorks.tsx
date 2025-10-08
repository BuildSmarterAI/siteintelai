import { motion } from "framer-motion";
import { Database, Cpu, Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      icon: Database,
      title: "Data Fusion Engine",
      description: "BuildSmarter aggregates 20+ municipal, construction, and geospatial datasets into a unified intelligence layer.",
      details: [
        "Municipal zoning and permitting records",
        "Environmental and flood zone data",
        "Utility infrastructure mapping",
        "Construction cost databases",
      ],
    },
    {
      icon: Cpu,
      title: "AI Verification Layer",
      description: "Our proprietary AI engine cross-validates all data sources, identifying conflicts and ensuring accuracy.",
      details: [
        "Cross-reference validation",
        "Conflict detection algorithms",
        "Real-time data freshness checks",
        "Automated quality scoring",
      ],
    },
    {
      icon: Shield,
      title: "Risk Intelligence",
      description: "Advanced analytics identify constraints, opportunities, and potential issues before they become problems.",
      details: [
        "Regulatory compliance analysis",
        "Cost risk modeling",
        "Timeline impact assessment",
        "Feasibility scoring (0-100)",
      ],
    },
    {
      icon: FileCheck,
      title: "Verified Report Generation",
      description: "Comprehensive feasibility report with complete transparency—every data point traced to its source.",
      details: [
        "Executive summary with key findings",
        "Detailed site analysis",
        "Cost estimates and timelines",
        "Complete data source citations",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-white mb-6 text-center">
              How <span className="text-[#FF7A00]">BuildSmarter™</span> Works
            </h1>
            <p className="text-xl text-white/80 mb-16 text-center max-w-3xl mx-auto">
              From fragmented data to verified intelligence—our proprietary engine transforms
              complexity into clarity.
            </p>
          </motion.div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#FF7A00] flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/80 mb-4 text-lg">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIdx) => (
                        <li key={detailIdx} className="flex items-center gap-2 text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white/5 backdrop-blur-sm border border-[#06B6D4]/30 rounded-2xl p-8 mb-8">
              <p className="text-[#06B6D4] text-lg font-semibold mb-2">
                Powered by BuildSmarter's proprietary intelligence engine
              </p>
              <p className="text-white/70">
                Fusing 20+ verified datasets into one model for true development clarity
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-8 text-lg"
            >
              <Link to="/application?step=2">Experience It Yourself →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
