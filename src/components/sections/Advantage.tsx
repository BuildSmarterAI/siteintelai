import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Advantage = () => {
  const advantages = [
    {
      title: "The Maxx Ecosystem: Vision + Execution",
      content: "Our feasibility studies are powered by the combined strength of the Maxx ecosystem. Insights from Maxx Designers (Vision) and Maxx Builders (Execution) ensure your report is not just data, but a practical, buildable, and forward-looking strategy."
    },
    {
      title: "Proprietary AI Modules",
      content: "Gain an unfair advantage with our AI-powered tools. Our proprietary cost intelligence platform provides real-time Texas market data, while our AI-powered scheduling models predict accurate project timelines. This is intelligence that traditional consultants simply cannot replicate."
    },
    {
      title: "100% Fee Credit: Intelligence That Pays for Itself", 
      content: "Your investment in clarity is never a sunk cost. We credit 100% of your feasibility fee towards any Preconstruction or Design-Build contract, turning your due diligence into a down payment on project success."
    }
  ];

  return (
    <section className="bg-light-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            INTELLIGENCE, BACKED BY VISION AND EXECUTION.
          </h3>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {advantages.map((advantage, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-background border border-navy/10 rounded-lg px-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-headline text-lg text-navy">
                    {advantage.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4">
                    <p className="font-body text-charcoal/70 leading-relaxed">
                      {advantage.content}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};