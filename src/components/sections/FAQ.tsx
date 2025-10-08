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
      answer: "That's the ideal outcome. Our feasibility report helps you avoid seven-figure losses by walking away from bad sites or renegotiating terms with leverage."
    },
    {
      question: "How is this different from what my architect or GC provides?",
      answer: "We provide third-party, conflict-free analysis focused on capital protection. Architects design, and GCs build — BuildSmarter™ validates feasibility before either step begins."
    },
    {
      question: "How fast can I get results?",
      answer: "Free QuickCheck: 60 seconds. Professional Report: 10 minutes. Pro Subscription includes 10 reports per month with priority processing."
    },
    {
      question: "Do I lose my fee if I hire Maxx Builders?",
      answer: "No. 100% of your feasibility fee is credited toward Preconstruction or Design-Build with Maxx Builders."
    },
    {
      question: "Is my information confidential?",
      answer: "Yes. Every engagement is covered by NDA standards. All project data remains private and protected."
    },
    {
      question: "Which property types does this cover?",
      answer: "Retail, multifamily, healthcare, franchise, logistics, industrial, hospitality, religious institutions, and more."
    }
  ];

  return (
    <section className="bg-white py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-6 tracking-wider uppercase">
            FREQUENTLY ASKED QUESTIONS
          </h3>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4 md:space-y-6">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <span className="font-body font-semibold text-lg md:text-xl text-navy pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="pt-2">
                    <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                      {faq.answer.split('BuildSmarter™').map((part, i) => (
                        i === 0 ? part : (
                          <span key={i}>
                            <span className="text-maxx-red font-semibold">BuildSmarter™</span>
                            {part}
                          </span>
                        )
                      ))}
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