import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";

const columns = [
  {
    title: "The old way",
    isNegative: true,
    body: "Developers and lenders stitch together zoning opinions, flood maps, utility emails, traffic studies, wetlands memos, and ROM estimates. It takes 2–4 weeks, burns cash on dead deals, and still leaves blind spots.",
    bullets: [
      "5–10 portals per site (zoning, FEMA, GIS, utilities, traffic)",
      "Multiple consultants for each report",
      "No standard feasibility score or kill-factor flags",
    ],
  },
  {
    title: "The SiteIntel way",
    isNegative: false,
    body: "One intake. One engine. One lender-ready report. SiteIntel standardizes feasibility into a repeatable pipeline that surfaces kill-factors in minutes and delivers full reports in 24 hours.",
    bullets: [
      "Automated zoning, flood, wetlands, utilities, topography, traffic",
      "Kill-factors and feasibility score on page one",
      "Consistent, defendable reports across every deal",
    ],
  },
];

export const TwoColumnSection = () => {
  return (
    <section id="problem" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge 
            variant="outline" 
            className="border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium mb-6"
          >
            The Feasibility Gap
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Manual feasibility is slow, fragmented, and expensive.
          </h2>
        </motion.div>

        {/* Columns */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {columns.map((column, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`p-8 rounded-2xl border ${
                column.isNegative 
                  ? "bg-destructive/5 border-destructive/20" 
                  : "bg-primary/5 border-primary/20"
              }`}
            >
              <h3 className={`font-heading text-xl font-semibold mb-4 ${
                column.isNegative ? "text-destructive" : "text-primary"
              }`}>
                {column.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                {column.body}
              </p>
              
              <ul className="space-y-3">
                {column.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-3">
                    {column.isNegative ? (
                      <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm text-foreground/80">{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
