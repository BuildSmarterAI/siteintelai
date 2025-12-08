import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Why is SiteIntel proprietary?",
    answer: "Because the core models, normalization layers, inference graphs, and scoring engines are internally built, internally calibrated, and legally protected.",
  },
  {
    question: "Is this public software?",
    answer: "No. Early access is private, controlled, and approved on a rolling basis.",
  },
  {
    question: "What makes it irreplicable?",
    answer: "Your structural IP: Proprietary models, multi-pass reasoning systems, calibration schemas, inference engines, data normalization pipelines, weighting logic, and kill-factor detectors.",
  },
  {
    question: "Do I need GIS or engineering expertise?",
    answer: "No. The intelligence engine abstracts everything into a unified feasibility narrative.",
  },
];

export const ProprietaryFAQ = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-muted/30 border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
