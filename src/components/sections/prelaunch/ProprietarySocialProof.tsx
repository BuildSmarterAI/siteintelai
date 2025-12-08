import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "This isn't GIS. This is a proprietary feasibility intelligence system built for institutional underwriting.",
    author: "Managing Partner",
    company: "National CRE Development Fund",
  },
  {
    quote: "It computes feasibility the way no consultant or platform can. The underlying models are truly proprietary.",
    author: "Chief Credit Officer",
    company: "Regional Lender",
  },
];

export const ProprietarySocialProof = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground">
            Used by operators where feasibility failure is not an option.
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
              className="relative p-8 bg-background border border-border rounded-xl"
            >
              <Quote className="absolute top-6 left-6 w-8 h-8 text-primary/20" />
              <div className="relative z-10 pl-6">
                <p className="text-lg text-foreground/90 italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
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
