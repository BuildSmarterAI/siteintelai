import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "This isn't another GIS tool — it's a proprietary feasibility intelligence system engineered for institutional underwriting.",
    author: "Managing Partner",
    company: "National CRE Development Fund",
  },
  {
    quote: "SiteIntel evaluates zoning, flood, utilities, and constraints with a precision we've never seen. It is genuinely proprietary.",
    author: "Chief Credit Officer",
    company: "Regional Commercial Lender",
  },
];

export const ProprietarySocialProof = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground">
            Used by teams where feasibility failure is not an option.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative p-8 bg-muted/30 border border-border rounded-xl"
            >
              <Quote className="absolute top-6 left-6 w-10 h-10 text-primary/10" />
              <div className="relative z-10 pl-4">
                <p className="text-lg text-foreground/90 italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-border/50 pt-4">
                  <p className="font-medium text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
