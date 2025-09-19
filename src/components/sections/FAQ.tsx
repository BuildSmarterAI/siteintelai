import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "What if the report identifies major risks?",
      answer: "Perfect outcome. Walk away from bad deals or renegotiate from strength."
    },
    {
      question: "How is this different from my architect or GC?",
      answer: "Conflict-free third-party validation focused on pre-investment risk protection."
    },
    {
      question: "How does the 100% fee credit work?",
      answer: "Full feasibility fee credited to your first Maxx Builders or Designers invoice."
    },
    {
      question: "Is project information confidential?",
      answer: "Yes. NDA executed upon request before engagement begins."
    }
  ];

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
            FREQUENTLY ASKED QUESTIONS
          </h3>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-border rounded-lg px-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-cta font-semibold text-charcoal">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4">
                    <p className="font-body text-charcoal/70 leading-relaxed">
                      {faq.answer}
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