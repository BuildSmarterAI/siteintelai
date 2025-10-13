import { MapPin, Calculator, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const PlatformOverview = () => {
  const products = [
    {
      title: "Feasibility Intelligence",
      icon: MapPin,
      description: "Land feasibility and project validation."
    },
    {
      title: "Cost Intelligence",
      icon: Calculator,
      description: "Real-time construction feasibility analysis."
    },
    {
      title: "Schedule Intelligence",
      icon: Clock,
      description: "Timeline forecasting for property development."
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-charcoal mb-4">
            Comprehensive Feasibility & Due Diligence Platform
          </h2>
          <p className="font-body text-lg md:text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
            Three integrated intelligence modules that transform how developers, lenders, and investors 
            validate commercial real estate opportunities across Texas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => {
            const IconComponent = product.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.15
                }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-md border border-charcoal/10 hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-maxx-red before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100">
                  <div className="w-16 h-16 rounded-full bg-maxx-red/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-maxx-red" strokeWidth={2} />
                  </div>
                  <h3 className="font-headline text-2xl text-charcoal mb-3 group-hover:text-maxx-red transition-colors duration-300">
                    {product.title}
                  </h3>
                  <p className="font-body text-base text-charcoal/70 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Button 
            variant="maxx-red"
            size="lg"
            className="text-base px-8 py-4 h-auto font-cta group"
            onClick={() => window.location.href = '/products'}
          >
            Explore the Platform
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
