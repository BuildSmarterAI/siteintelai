import { motion, useInView } from "framer-motion";
import { Clock, CheckCircle, X, ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const BeforeAfterComparison = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  const comparisonData = [
    { factor: "Time", traditional: "2–6 weeks", siteintel: "60 seconds" },
    { factor: "Cost", traditional: "$5,000–$15,000", siteintel: "$999" },
    { factor: "Data Sources", traditional: "3–5 manual lookups", siteintel: "20+ automated" },
    { factor: "Accuracy", traditional: "Variable, human-dependent", siteintel: "97.3% verified" },
    { factor: "Format", traditional: "Inconsistent reports", siteintel: "Lender-ready PDF" },
    { factor: "Kill-Factor Detection", traditional: "Often missed", siteintel: "AI-automated" },
    { factor: "Citations", traditional: "Rarely included", siteintel: "100% sourced" },
    { factor: "Scalability", traditional: "One at a time", siteintel: "Unlimited pipeline" },
  ];

  return (
    <section ref={ref} className="bg-gradient-to-b from-white to-[#F4F4F5] py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[#0A0F2C] mb-4">
            What Used to Take Weeks Now Takes 60 Seconds
          </h2>
          <p className="font-body text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            See exactly how SiteIntel transforms your feasibility workflow.
          </p>
        </motion.div>

        {/* Comparison Table - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block max-w-5xl mx-auto mb-12"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-[#0A0F2C]">
              <div className="p-6 border-r border-white/10">
                <span className="text-white/60 font-medium">Factor</span>
              </div>
              <div className="p-6 border-r border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  <span className="text-white font-semibold">Traditional Approach</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#FF7A00]" />
                  <span className="text-white font-semibold">SiteIntel™</span>
                </div>
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-[#FF7A00]/5 transition-colors`}
              >
                <div className="p-5 border-r border-slate-100 font-medium text-[#0A0F2C]">
                  {row.factor}
                </div>
                <div className="p-5 border-r border-slate-100 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-slate-600">{row.traditional}</span>
                </div>
                <div className="p-5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                  <span className="text-[#0A0F2C] font-medium">{row.siteintel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Cards - Mobile/Tablet */}
        <div className="lg:hidden space-y-4 mb-12">
          {comparisonData.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-md border border-slate-200 p-5"
            >
              <h4 className="font-semibold text-[#0A0F2C] mb-4">{row.factor}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <X className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-600 font-medium">Traditional</span>
                  </div>
                  <p className="text-sm text-slate-600">{row.traditional}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">SiteIntel™</span>
                  </div>
                  <p className="text-sm text-[#0A0F2C] font-medium">{row.siteintel}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* The Math That Matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-br from-[#0A0F2C] to-[#1a2550] rounded-2xl p-8 md:p-10 max-w-4xl mx-auto mb-12"
        >
          <h3 className="font-heading text-2xl font-semibold text-white mb-6 text-center">
            The Math That Matters
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-slate-400 text-sm mb-2">10 sites analyzed traditionally</p>
              <p className="text-2xl font-bold text-red-400">$150,000 + 6 months</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-[#FF7A00] rotate-90 md:rotate-0" />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">10 sites with SiteIntel</p>
              <p className="text-2xl font-bold text-[#22C55E]">$14,950 + 10 minutes</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[#FF7A00] text-lg font-semibold">
              Savings: $135,000 and 5+ months per 10 deals
            </p>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-heading font-semibold rounded-full px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all group"
            onClick={() => navigate('/tools/roi-calculator')}
          >
            <Calculator className="mr-2 w-5 h-5" />
            Calculate Your Savings
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0A0F2C] text-[#0A0F2C] hover:bg-[#0A0F2C]/5 font-heading rounded-full px-10 py-7 text-lg"
            onClick={() => navigate('/compare')}
          >
            See Full Feature Comparison
          </Button>
        </motion.div>
      </div>
    </section>
  );
};