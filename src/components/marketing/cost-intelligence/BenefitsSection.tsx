import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, Target, RefreshCw, Handshake } from "lucide-react";
import blueprintImage from "@/assets/hero-blueprint.jpg";
import heatmapImage from "@/assets/risk-heatmap.jpg";

const benefits = [
  {
    icon: Target,
    title: "Make Confident Decisions from the Start",
    description: "Enter due diligence with verified cost intelligence. No more guessing, no more outdated assumptions—just real-time market data that validates your proforma before commitment.",
    bullets: [
      "Eliminate budget surprises",
      "Validate proformas before commitment",
      "Reduce redesign risk"
    ],
    image: blueprintImage,
    reverse: false
  },
  {
    icon: RefreshCw,
    title: "Reduce Redesign Cycles and Cost Surprises",
    description: "Align design expectations with market realities. Track material costs, labor rates, and supply chain shifts in real-time to avoid expensive mid-project adjustments.",
    bullets: [
      "Real-time material cost tracking",
      "Labor rate benchmarking",
      "Supply chain risk alerts"
    ],
    image: heatmapImage,
    reverse: true
  },
  {
    icon: Handshake,
    title: "Build Investor and Lender Confidence",
    description: "Present data-backed cost projections that stakeholders trust. Every number is cited, every assumption is market-verified, and every report is lender-ready.",
    bullets: [
      "Transparent data sources",
      "Citation-backed reports",
      "Market-aligned assumptions"
    ],
    image: blueprintImage,
    reverse: false
  }
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-headline text-4xl md:text-5xl text-foreground mb-4">
            Business Outcomes That Matter
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform cost uncertainty into strategic advantage.
          </p>
        </motion.div>

        <div className="space-y-32">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            
            return (
              <BenefitBlock 
                key={benefit.title}
                benefit={benefit}
                Icon={Icon}
                index={idx}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
};

const BenefitBlock = ({ benefit, Icon, index }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div 
      ref={ref}
      className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
        index % 2 === 0 ? 'bg-background' : 'bg-muted'
      } ${index % 2 === 0 ? '' : 'lg:py-16 -mx-6 lg:-mx-8 px-6 lg:px-8 rounded-3xl'}`}
    >
      
      {/* Image */}
      <motion.div
        initial={{ opacity: 0, x: benefit.reverse ? 20 : -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        className={`${benefit.reverse ? 'lg:order-2' : ''}`}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-elev">
          <img 
            src={benefit.image} 
            alt={benefit.title}
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, x: benefit.reverse ? -20 : 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`space-y-6 ${benefit.reverse ? 'lg:order-1' : ''}`}
      >
        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Icon className="w-8 h-8 text-primary" />
        </div>

        <h3 className="font-headline text-3xl md:text-4xl text-foreground leading-tight">
          {benefit.title}
        </h3>

        <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-xl">
          {benefit.description}
        </p>

        <ul className="space-y-3">
          {benefit.bullets.map((bullet: string) => (
            <li key={bullet} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
              <span className="font-body text-foreground">{bullet}</span>
            </li>
          ))}
        </ul>
      </motion.div>

    </div>
  );
};
