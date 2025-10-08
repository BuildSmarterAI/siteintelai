import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, MapPin, FileText, Shield, TrendingUp } from "lucide-react";

export const InteractiveProcess = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      title: "Input Site",
      duration: "60 Seconds",
      description: "Enter your property address or parcel ID. Our system instantly validates the location and prepares for data retrieval.",
      details: [
        "Property address or parcel ID",
        "Development type (retail, multifamily, etc.)",
        "Optional: Project scope",
        "Instant validation"
      ],
      icon: MapPin,
      color: "maxx-red"
    },
    {
      title: "AI Data Retrieval",
      duration: "2-3 Minutes", 
      description: "AI queries official government APIs in real-time: FEMA NFHL, ArcGIS county parcels, TxDOT, EPA, and USFWS datasets.",
      details: [
        "FEMA flood zone data (NFHL)",
        "ArcGIS parcel boundaries", 
        "TxDOT infrastructure data",
        "EPA environmental records"
      ],
      icon: FileText,
      color: "navy"
    },
    {
      title: "Automated Report Generation",
      duration: "5-6 Minutes",
      description: "AI processes retrieved data, calculates feasibility score (0-100), and generates structured JSON with full source citations.",
      details: [
        "Feasibility score calculation",
        "Risk factor analysis",
        "Cost and timeline projections",
        "Source citation mapping"
      ],
      icon: Shield,
      color: "charcoal"
    },
    {
      title: "Instant PDF Output",
      duration: "1-2 Minutes",
      description: "Receive your lender-ready PDF report. Every section cites its data source with API endpoint for verification.",
      details: [
        "Executive summary with AI score",
        "Detailed findings by category",
        "Full source citations",
        "Downloadable PDF + JSON"
      ],
      icon: TrendingUp,
      color: "green-600"
    }
  ];

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  const handleCompleteStep = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    if (stepIndex < steps.length - 1) {
      setActiveStep(stepIndex + 1);
    }
  };

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl text-charcoal mb-4 tracking-wide uppercase">
            INSIDE THE AI PIPELINE
          </h3>
          <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto mb-8">
            Click through each step to see how we generate lender-ready reports in 10 minutes
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Step Progress Bar */}
          <div className="flex justify-between items-center mb-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = activeStep === index;
              const isCompleted = completedSteps.includes(index);
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => handleStepClick(index)}
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                        ? `bg-${step.color} border-${step.color} text-white` 
                        : 'bg-white border-charcoal/30 text-charcoal/50 hover:border-charcoal/60'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <IconComponent className="w-8 h-8" />
                    )}
                  </button>
                  <div className={`mt-4 text-center transition-all duration-300 ${
                    isActive ? 'text-charcoal' : 'text-charcoal/60'
                  }`}>
                    <div className="font-body font-semibold text-sm">
                      {step.title}
                    </div>
                    <div className="font-body text-xs text-charcoal/50 flex items-center justify-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block absolute w-full h-0.5 mt-8 transition-all duration-500 ${
                      completedSteps.includes(index) ? 'bg-green-500' : 'bg-charcoal/20'
                    }`} style={{
                      left: `${(100 / steps.length) * (index + 0.5)}%`,
                      width: `${100 / steps.length}%`,
                      zIndex: -1
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Step Content */}
          <Card className="border-2 border-charcoal/20 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className={`w-20 h-20 rounded-full bg-${steps[activeStep].color}/10 border-2 border-${steps[activeStep].color}/30 flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = steps[activeStep].icon;
                    return <IconComponent className={`w-10 h-10 text-${steps[activeStep].color}`} />;
                  })()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-headline text-2xl font-bold text-charcoal">
                      {steps[activeStep].title}
                    </h4>
                    <div className="flex items-center gap-2 text-charcoal/60">
                      <Clock className="w-4 h-4" />
                      <span className="font-body text-sm font-medium">
                        {steps[activeStep].duration}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-body text-lg text-charcoal/80 mb-6 leading-relaxed">
                    {steps[activeStep].description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {steps[activeStep].details.map((detail, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="font-body text-sm text-charcoal/80">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleCompleteStep(activeStep)}
                      variant="maxx-red"
                      className="px-6 py-3 font-cta hover:scale-105 transition-all duration-300"
                      disabled={completedSteps.includes(activeStep)}
                    >
                      {completedSteps.includes(activeStep) ? 'Completed' : 'Complete Step'}
                    </Button>
                    
                    {activeStep < steps.length - 1 && !completedSteps.includes(activeStep) && (
                      <Button
                        onClick={() => setActiveStep(activeStep + 1)}
                        variant="outline"
                        className="px-6 py-3 font-cta"
                      >
                        Skip to Next
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          {completedSteps.length === steps.length && (
            <div className="text-center mt-12 animate-fade-in">
              <div className="bg-gradient-to-r from-maxx-red to-navy text-white p-8 rounded-lg">
                <h4 className="font-headline text-2xl font-bold mb-4">
                  Ready to Get Your Report?
                </h4>
                <p className="font-body text-lg mb-6 text-white/90">
                  Run a Free QuickCheck or purchase a Professional Report in 10 minutes.
                </p>
                <Button 
                  variant="secondary"
                  size="lg"
                  className="px-8 py-4 text-lg font-cta bg-white text-charcoal hover:bg-white/90"
                  onClick={() => window.location.href = '/application?step=2'}
                >
                  Run Free QuickCheck →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};