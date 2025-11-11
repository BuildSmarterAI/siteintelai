import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClipboardList, Search, FileText } from "lucide-react";

export const Process = () => {
  const steps = [
    {
      icon: ClipboardList,
      iconColor: "text-maxx-red",
      title: "1. Input Site",
      description: "Enter property address or parcel ID. Takes 60 seconds."
    },
    {
      icon: Search,
      iconColor: "text-navy",
      title: "2. AI Data Retrieval",
      description: "Our proprietary AI engine retrieves data from 20+ verified federal and municipal sources in real-time, synthesizing official datasets through our secure integration network."
    },
    {
      icon: FileText,
      iconColor: "text-green-600",
      title: "3. Automated Report Generation",
      description: "Our Texas-trained AI models process data through proprietary risk scoring algorithms, calculating feasibility scores (0-100) and generating structured reports with full source citations."
    },
    {
      icon: FileText,
      iconColor: "text-charcoal",
      title: "4. Instant PDF Output",
      description: "Receive lender-ready PDF report with cited data in under 60 seconds. Every section includes source endpoints for verification."
    }
  ];

  return (
    <section className="bg-white py-20 md:py-25">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h3 className="font-headline text-2xl md:text-3xl text-charcoal mb-4 md:mb-6">
            The AI-Powered 4-Step Pipeline
          </h3>
          <h4 className="font-body text-lg md:text-xl text-charcoal/80 leading-relaxed">
            From address input to lender-ready report in under 60 seconds.
          </h4>
        </div>
        
        <div className="max-w-4xl mx-auto mb-10 md:mb-15">
          <Accordion type="single" collapsible className="space-y-4 md:space-y-6">
            {steps.map((step, index) => (
              <AccordionItem 
                key={index} 
                value={`step-${index}`}
                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
                  <div className="flex items-center space-x-4 text-left w-full">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 flex-shrink-0">
                      <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-body font-semibold text-lg md:text-xl text-navy text-left">
                        {step.title}
                      </h5>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="ml-16 pt-2">
                    <p className="font-body text-base md:text-lg text-charcoal leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="text-center">
          <Button 
            variant="maxx-red" 
            size="lg"
            className="text-lg md:text-xl px-8 py-4 h-auto font-cta"
            onClick={() => window.location.href = '/application?step=2'}
          >
            Start My Feasibility Review
          </Button>
        </div>
      </div>
    </section>
  );
};