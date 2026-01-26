import { motion, useInView } from "framer-motion";
import { Puzzle, Hourglass, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";

export const ProblemAgitation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showStrikethrough, setShowStrikethrough] = useState(false);

  useEffect(() => {
    if (isInView) {
      // Animate cost counter after a delay
      const timeout = setTimeout(() => {
        setShowStrikethrough(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isInView]);

  const problems = [
    {
      icon: Puzzle,
      title: "Fragmented Data, Fragmented Decisions",
      description: "You shouldn't need to log into FEMA, county appraisal districts, EPA databases, traffic portals, and Census tools just to answer one question: Can I build here?",
    },
    {
      icon: Hourglass,
      title: "Time That Compounds Against You",
      description: "While you're waiting 2-6 weeks for a consultant's report, your competition is closing. Traditional feasibility studies cost $5,000–$15,000 and arrive too late to matter.",
    },
    {
      icon: AlertTriangle,
      title: "Invisible Kill Factors",
      description: "Floodways. Wetlands. Zoning conflicts. Missing utilities. These deal-breakers hide in plain sight across disconnected systems—until they surface at the worst possible moment.",
    },
  ];

  const realCosts = [
    "3 weeks of due diligence = 3 weeks of holding costs",
    "Missed constraints = redesign costs, permit delays, or dead deals",
    "Manual research = inconsistent methodology, human error",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <section ref={ref} className="bg-[#F4F4F5] py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[#0A0F2C] mb-4">
            20 Systems. 3 Weeks. $15,000. One Missed Constraint.
          </h2>
          <p className="font-body text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            The hidden cost of manual feasibility analysis isn't just time and money—it's the deals you never see and the risks you don't catch.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12"
        >
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6"
                >
                  <IconComponent className="w-8 h-8 text-red-500" />
                </motion.div>
                <h3 className="font-heading text-xl font-semibold text-[#0A0F2C] mb-3">
                  {problem.title}
                </h3>
                <p className="font-body text-slate-600 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* The Real Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-slate-200 max-w-4xl mx-auto mb-12"
        >
          <h3 className="font-heading text-2xl font-semibold text-[#0A0F2C] mb-6 text-center">
            The Real Cost
          </h3>
          <div className="space-y-4 mb-8">
            {realCosts.map((cost, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <p className="font-body text-slate-700">{cost}</p>
              </motion.div>
            ))}
          </div>

          {/* Cost Comparison Animation */}
          <div className="flex items-center justify-center gap-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <motion.div
                className="relative"
                animate={showStrikethrough ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <span className={`text-3xl md:text-4xl font-bold text-slate-400 ${showStrikethrough ? 'line-through' : ''}`}>
                  $15,000
                </span>
              </motion.div>
              <p className="text-sm text-slate-500 mt-1">Traditional Study</p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={showStrikethrough ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ArrowRight className="w-8 h-8 text-[#FF7A00]" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={showStrikethrough ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
              className="text-center"
            >
              <span className="text-3xl md:text-4xl font-bold text-[#FF7A00]">
                $1,495
              </span>
              <p className="text-sm text-[#FF7A00] mt-1 font-medium">SiteIntel™</p>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-[#FF7A00] hover:bg-[#FF9240] text-white font-heading font-semibold rounded-full px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all group"
            onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See How SiteIntel Solves This
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};