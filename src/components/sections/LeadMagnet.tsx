import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";

export const LeadMagnet = () => {
  const checklistItems = [
    "Zoning compliance verification",
    "Utility capacity assessment",
    "Cost estimation red flags",
    "Timeline risk factors"
  ];

  return (
    <section className="bg-light-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div>
            <h3 className="font-headline text-4xl md:text-5xl text-charcoal mb-6">
              DOWNLOAD THE TEXAS FEASIBILITY CHECKLIST (FREE)
            </h3>
            
            <p className="font-body text-xl text-charcoal/80 mb-8 leading-relaxed">
              A quick-start guide to zoning, utility, and cost red flags every Texas developer must check.
            </p>
            
            <ul className="space-y-3 mb-8">
              {checklistItems.map((item, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-navy flex-shrink-0" />
                  <span className="font-body text-charcoal/70">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            
            <Button 
              variant="navy" 
              size="lg"
              className="text-lg px-8 py-4 h-auto"
            >
              <Download className="w-5 h-5 mr-2" />
              Get My Free Checklist
            </Button>
            
            <p className="font-body text-sm text-muted-foreground mt-4">
              No spam. Instant download. Unsubscribe anytime.
            </p>
          </div>
          
          {/* PDF Mockup */}
          <div className="relative">
            <div className="bg-background border border-border rounded-lg shadow-xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="bg-maxx-red/10 rounded-t-lg p-4 mb-6">
                <h4 className="font-headline text-lg text-charcoal text-center">
                  TEXAS FEASIBILITY CHECKLIST
                </h4>
                <p className="font-body text-sm text-charcoal/70 text-center">
                  BuildSmarter™ Essential Guide
                </p>
              </div>
              
              <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-4 h-4 border border-navy/30 rounded" />
                    <div className="h-2 bg-charcoal/20 rounded flex-1" />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-maxx-red/20 rounded" />
                  <div>
                    <div className="h-2 bg-charcoal/30 rounded w-24 mb-1" />
                    <div className="h-1.5 bg-charcoal/20 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Download Icon */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-navy rounded-full flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-navy-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};