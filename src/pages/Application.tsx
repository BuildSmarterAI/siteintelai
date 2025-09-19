import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Shield, Award, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Application() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    role: "",
    propertyType: "",
    budget: "",
    timeline: "",
    location: "",
    source: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.company) newErrors.company = "Company is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    if (step === 2) {
      if (!formData.role) newErrors.role = "Role is required";
      if (!formData.propertyType) newErrors.propertyType = "Property type is required";
      if (!formData.budget) newErrors.budget = "Budget range is required";
      if (!formData.timeline) newErrors.timeline = "Timeline is required";
    }

    if (step === 3) {
      if (!formData.location) newErrors.location = "Location is required";
      if (!formData.source) newErrors.source = "Please tell us how you heard about us";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(3)) {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and contact you within 24 hours.",
      });
    }
  };

  const getProgress = () => (currentStep / totalSteps) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="font-headline text-3xl md:text-4xl font-black text-charcoal mb-4 uppercase tracking-wide">
                Application Submitted Successfully
              </h1>
              <p className="font-body text-lg text-charcoal/80 mb-8">
                Thank you for your application. Our team will review your project details and contact you within 24 hours to discuss next steps.
              </p>
            </div>

            <Card className="border-2 border-green-500/30 shadow-xl">
              <CardContent className="p-8">
                <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                  What Happens Next?
                </h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">1</div>
                    <div>
                      <p className="font-body font-semibold text-charcoal">Initial Review (24 hours)</p>
                      <p className="font-body text-sm text-charcoal/70">Our team reviews your application and project requirements.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">2</div>
                    <div>
                      <p className="font-body font-semibold text-charcoal">Discovery Call (48 hours)</p>
                      <p className="font-body text-sm text-charcoal/70">We'll schedule a brief call to discuss your specific needs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">3</div>
                    <div>
                      <p className="font-body font-semibold text-charcoal">Proposal & Timeline</p>
                      <p className="font-body text-sm text-charcoal/70">Receive your customized feasibility package and timeline.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mini Hero */}
      <section className="bg-gradient-to-br from-charcoal/5 to-navy/5 py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-black text-charcoal mb-4 uppercase tracking-wide">
              Start Your Feasibility Review
            </h1>
            <h2 className="font-body text-lg md:text-xl text-charcoal/80 max-w-3xl mx-auto mb-6 leading-relaxed">
              Answer a few quick questions so we can tailor your feasibility package.
            </h2>
            
            {/* Scarcity Badge */}
            <div className="flex justify-center mb-8">
              <Badge variant="destructive" className="bg-maxx-red text-white px-4 py-2 text-sm font-cta">
                <Clock className="w-4 h-4 mr-2" />
                Only 5 Projects Accepted Monthly
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="font-body text-sm font-semibold text-charcoal">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="font-body text-sm text-charcoal/60">
                  {Math.round(getProgress())}% Complete
                </span>
              </div>
              <div className="w-full bg-charcoal/20 rounded-full h-3">
                <div 
                  className="bg-navy h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Form Section */}
              <div className="lg:col-span-2">
                <Card className="shadow-2xl border-2 border-charcoal/10">
                  <CardHeader className="bg-gradient-to-r from-charcoal to-navy text-white">
                    <CardTitle className="font-headline text-xl">
                      {currentStep === 1 && "Contact Information"}
                      {currentStep === 2 && "Project Details"}
                      {currentStep === 3 && "Additional Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit}>
                      
                      {/* Step 1: Contact Information */}
                      {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="name" className="font-body font-semibold text-charcoal">
                                Full Name *
                              </Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Your full name"
                                className={`mt-2 ${errors.name ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              {errors.name && <p className="text-maxx-red text-sm mt-1">{errors.name}</p>}
                            </div>
                            
                            <div>
                              <Label htmlFor="company" className="font-body font-semibold text-charcoal">
                                Company *
                              </Label>
                              <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                placeholder="Your company name"
                                className={`mt-2 ${errors.company ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              {errors.company && <p className="text-maxx-red text-sm mt-1">{errors.company}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="email" className="font-body font-semibold text-charcoal">
                                Email Address *
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="your@email.com"
                                className={`mt-2 ${errors.email ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              {errors.email && <p className="text-maxx-red text-sm mt-1">{errors.email}</p>}
                            </div>
                            
                            <div>
                              <Label htmlFor="phone" className="font-body font-semibold text-charcoal">
                                Phone Number *
                              </Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                className={`mt-2 ${errors.phone ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              {errors.phone && <p className="text-maxx-red text-sm mt-1">{errors.phone}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Project Details */}
                      {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="role" className="font-body font-semibold text-charcoal">
                                Your Role *
                              </Label>
                              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                                <SelectTrigger className={`mt-2 ${errors.role ? 'border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="developer">Developer</SelectItem>
                                  <SelectItem value="investor">Investor/PE</SelectItem>
                                  <SelectItem value="franchise">Franchise Leader</SelectItem>
                                  <SelectItem value="cre-team">CRE Team</SelectItem>
                                  <SelectItem value="healthcare">Healthcare/Multifamily</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.role && <p className="text-maxx-red text-sm mt-1">{errors.role}</p>}
                            </div>
                            
                            <div>
                              <Label htmlFor="propertyType" className="font-body font-semibold text-charcoal">
                                Property Type *
                              </Label>
                              <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                                <SelectTrigger className={`mt-2 ${errors.propertyType ? 'border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="multifamily">Multifamily</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="industrial">Industrial</SelectItem>
                                  <SelectItem value="hospitality">Hospitality</SelectItem>
                                  <SelectItem value="office">Office</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.propertyType && <p className="text-maxx-red text-sm mt-1">{errors.propertyType}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="budget" className="font-body font-semibold text-charcoal">
                                Project Budget *
                              </Label>
                              <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                                <SelectTrigger className={`mt-2 ${errors.budget ? 'border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select budget range" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="under-5m">Under $5M</SelectItem>
                                  <SelectItem value="5m-20m">$5M - $20M</SelectItem>
                                  <SelectItem value="20m-50m">$20M - $50M</SelectItem>
                                  <SelectItem value="over-50m">$50M+</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.budget && <p className="text-maxx-red text-sm mt-1">{errors.budget}</p>}
                            </div>
                            
                            <div>
                              <Label htmlFor="timeline" className="font-body font-semibold text-charcoal">
                                Project Timeline *
                              </Label>
                              <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                                <SelectTrigger className={`mt-2 ${errors.timeline ? 'border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="When do you plan to start?" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0-3months">0-3 months</SelectItem>
                                  <SelectItem value="3-6months">3-6 months</SelectItem>
                                  <SelectItem value="6-12months">6-12 months</SelectItem>
                                  <SelectItem value="12months">12+ months</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.timeline && <p className="text-maxx-red text-sm mt-1">{errors.timeline}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Additional Information */}
                      {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                          <div>
                            <Label htmlFor="location" className="font-body font-semibold text-charcoal">
                              Project Location *
                            </Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              placeholder="City, Texas"
                              className={`mt-2 ${errors.location ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                            />
                            {errors.location && <p className="text-maxx-red text-sm mt-1">{errors.location}</p>}
                          </div>

                          <div>
                            <Label htmlFor="source" className="font-body font-semibold text-charcoal">
                              How Did You Hear About Us? *
                            </Label>
                            <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                              <SelectTrigger className={`mt-2 ${errors.source ? 'border-maxx-red' : 'border-charcoal/20'}`}>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="google">Google Search</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                <SelectItem value="industry-event">Industry Event</SelectItem>
                                <SelectItem value="existing-client">Existing Client</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.source && <p className="text-maxx-red text-sm mt-1">{errors.source}</p>}
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex justify-between items-center mt-8 pt-6 border-t border-charcoal/20">
                        <div>
                          {currentStep > 1 && (
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={handlePrev}
                              className="px-6 py-3 font-cta"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Previous
                            </Button>
                          )}
                        </div>
                        
                        <div>
                          {currentStep < totalSteps ? (
                            <Button 
                              type="button"
                              variant="maxx-red"
                              onClick={handleNext}
                              className="px-8 py-3 font-cta text-lg"
                            >
                              Next Step
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              type="submit"
                              variant="maxx-red"
                              className="px-8 py-3 font-cta text-lg hover:scale-105 transition-all duration-300"
                            >
                              Submit Application
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Trust & Risk Reversal Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  
                  {/* Risk Reversal Card */}
                  <Card className="border-2 border-green-500/30 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-green-500" />
                        <h3 className="font-headline text-lg font-bold text-charcoal">
                          Zero Risk Guarantee
                        </h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="font-body text-charcoal/80">
                            <strong>100% of your feasibility fee</strong> is credited toward Preconstruction or Design-Build
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="font-body text-charcoal/80">
                            <strong>Confidential, NDA-ready</strong> reporting for all projects
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="font-body text-charcoal/80">
                            <strong>No obligation</strong> to proceed after review
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Indicators */}
                  <Card className="border-2 border-navy/30 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="w-8 h-8 text-navy" />
                        <h3 className="font-headline text-lg font-bold text-charcoal">
                          Trusted Partner
                        </h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <p className="font-body text-charcoal/80">
                          <strong>Trusted by developers</strong> managing $500M+ in Texas CRE projects
                        </p>
                        <p className="font-body text-charcoal/80">
                          <strong>Lender-grade analysis</strong> that satisfies due diligence requirements
                        </p>
                        <p className="font-body text-charcoal/80">
                          <strong>Texas market experts</strong> with 15+ years local experience
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Urgency Reminder */}
                  <Card className="border-2 border-maxx-red/30 bg-maxx-red/5 shadow-xl">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-12 h-12 text-maxx-red mx-auto mb-3" />
                      <h3 className="font-headline text-lg font-bold text-charcoal mb-2">
                        Limited Availability
                      </h3>
                      <p className="font-body text-sm text-charcoal/80">
                        We accept only <strong className="text-maxx-red">5 new projects monthly</strong> to ensure quality and attention to detail.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal/20 p-4 lg:hidden z-50">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-body font-semibold text-charcoal">Step {currentStep} of {totalSteps}</div>
            <div className="font-body text-xs text-charcoal/60">{Math.round(getProgress())}% Complete</div>
          </div>
          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext}
              variant="maxx-red"
              className="px-6 py-2 font-cta"
            >
              Next Step
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              variant="maxx-red"
              className="px-6 py-2 font-cta"
            >
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}