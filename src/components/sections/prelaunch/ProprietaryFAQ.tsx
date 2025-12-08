import { motion, type Variants } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is SiteIntel™?",
    answer: "A proprietary, AI-driven commercial feasibility engine that automates zoning analysis, floodplain mapping, environmental risk, utility feasibility, topography, access constraints, and ROM costs.",
  },
  {
    question: "How is this different from GIS tools?",
    answer: "SiteIntel uses proprietary inference models and a Composite Feasibility Index™ — not manual map layers or consultant interpretation.",
  },
  {
    question: "Why is access limited?",
    answer: "To maintain model integrity and protect proprietary computation logic.",
  },
  {
    question: "Can this replace feasibility consultants?",
    answer: "For the majority of early feasibility, yes. SiteIntel automates >80% of the due-diligence pipeline.",
  },
  {
    question: "Is this suitable for lenders?",
    answer: "Yes. The system is engineered around credit committee workflow, risk modeling, and underwriting metrics.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const ProprietaryFAQ = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            FAQ: Proprietary AI Feasibility Engine
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-background border border-border rounded-lg px-6 transition-shadow duration-300 hover:shadow-md data-[state=open]:shadow-lg data-[state=open]:shadow-primary/5"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary transition-colors duration-200">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
