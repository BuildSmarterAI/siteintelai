import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Why is SiteIntel proprietary?",
    answer: "The inference stack, normalization layers, reasoning engine, and scoring logic are internally developed, legally protected, and non-replicable.",
  },
  {
    question: "Why is access restricted?",
    answer: "Early users help calibrate the CFI™ and validate inference models. To protect engine integrity, we limit access to qualified teams.",
  },
  {
    question: "Do I need GIS or engineering expertise?",
    answer: "No. SiteIntel abstracts complexity into a single feasibility output.",
  },
  {
    question: "Is the product publicly available?",
    answer: "No. This is a private prelaunch with controlled onboarding.",
  },
];

export const ProprietaryFAQ = () => {
  return (
    <section className="py-24 bg-muted/30">
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
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border rounded-lg px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
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
