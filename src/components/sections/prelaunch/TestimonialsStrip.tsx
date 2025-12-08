import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "We used to spend two weeks cobbling together zoning, flood, and utility answers. SiteIntel turns that chaos into a single, lender-ready report.",
    name: "Managing Partner",
    company: "Texas CRE Development Firm",
    role: "Developer",
  },
  {
    quote: "For credit committees, the kill-factors and feasibility score are everything. SiteIntel makes our first screen fast and defensible.",
    name: "Chief Credit Officer",
    company: "Regional Commercial Bank",
    role: "Lender",
  },
];

export const TestimonialsStrip = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Designed around how real deals live or die in feasibility.
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative p-8 bg-card border border-border rounded-2xl"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20" />
              
              <blockquote className="text-lg text-foreground leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {testimonial.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
