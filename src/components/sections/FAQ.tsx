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
      answer: "That is the ideal outcome. Our report provides the intelligence to either walk away from a bad deal—saving millions—or renegotiate terms from a position of undeniable strength."
    },
    {
      question: "How is this different from what my architect or GC provides?",
      answer: "We provide a conflict-free, third-party validation focused exclusively on pre-investment risk for capital stakeholders. Backed by the entire Maxx ecosystem, our AI-enhanced analysis offers a level of depth and objectivity designed for one purpose: to protect your capital."
    },
    {
      question: "How does the 100% fee credit work?",
      answer: "When you engage Maxx Builders or Maxx Designers for downstream services, the full fee from your feasibility study is applied as a direct credit to your first invoice. It's that simple."
    },
    {
      question: "Is my project information kept confidential?",
      answer: "Yes. We operate with the discretion of a consulting partner and will execute an NDA upon request before any engagement begins."
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