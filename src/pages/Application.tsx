import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, Shield, Award, ArrowRight, ArrowLeft, Zap, Database, Users, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Application() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Contact Information
    fullName: "",
    company: "",
    email: "",
    phone: "",
    
    // Step 2: Property Information
    propertyAddress: "",
    parcelId: "",
    lotSize: "",
    lotSizeUnit: "acres",
    currentUse: "",
    zoning: "",
    ownershipStatus: "",
    
    // Step 3: Project Intent & Building Parameters
    projectType: [] as string[],
    buildingSize: "",
    buildingSizeUnit: "sqft",
    stories: "",
    prototypeRequirements: "",
    qualityLevel: "",
    budget: "",
    
    // Step 4: Market & Risks
    submarket: "",
    accessPriorities: [] as string[],
    knownRisks: [] as string[],
    utilityAccess: [] as string[],
    environmentalConstraints: [] as string[],
    tenantRequirements: "",
    
    // Step 5: Final Questions
    hearAboutUs: "",
    contactMethod: "",
    bestTime: "",
    additionalNotes: "",
    ndaConsent: false,
    contactConsent: false,
    privacyConsent: false,
    marketingOptIn: false,
    
    // Hidden tracking fields
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    pageUrl: window.location.href,
    submissionTimestamp: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://hook.us1.make.com/1a0o8mufqrhb6intqppg4drjnllcgw9k");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const totalSteps = 5;

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleMultiSelectChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleInputChange(field, newValues);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = "Full name is required";
      if (!formData.company) newErrors.company = "Company is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    if (step === 2) {
      if (!formData.propertyAddress) newErrors.propertyAddress = "Property address is required";
      if (!formData.lotSize) newErrors.lotSize = "Lot size is required";
      if (!formData.currentUse) newErrors.currentUse = "Current use is required";
      if (!formData.ownershipStatus) newErrors.ownershipStatus = "Ownership status is required";
    }

    if (step === 3) {
      if (formData.projectType.length === 0) newErrors.projectType = "Project type is required";
      if (!formData.buildingSize) newErrors.buildingSize = "Building size is required";
      if (!formData.stories) newErrors.stories = "Number of stories is required";
      if (!formData.qualityLevel) newErrors.qualityLevel = "Quality level is required";
      if (!formData.budget) newErrors.budget = "Budget is required";
    }

    if (step === 4) {
      if (!formData.submarket) newErrors.submarket = "Submarket is required";
    }

    if (step === 5) {
      if (!formData.hearAboutUs) newErrors.hearAboutUs = "Please tell us how you heard about us";
      if (!formData.ndaConsent) newErrors.ndaConsent = "NDA consent is required";
      if (!formData.contactConsent) newErrors.contactConsent = "Contact consent is required";
      if (!formData.privacyConsent) newErrors.privacyConsent = "Privacy & Terms consent is required";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(5)) {
      setIsLoading(true);
      
      // Prepare data for Supabase submission
      const submissionData = {
        fullName: formData.fullName,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        propertyAddress: formData.propertyAddress,
        parcelIdApn: formData.parcelId,
        lotSizeValue: formData.lotSize,
        lotSizeUnit: formData.lotSizeUnit,
        existingImprovements: formData.currentUse,
        zoningClassification: formData.zoning,
        ownershipStatus: formData.ownershipStatus,
        projectType: formData.projectType,
        buildingSizeValue: formData.buildingSize,
        buildingSizeUnit: formData.buildingSizeUnit,
        storiesHeight: formData.stories,
        prototypeRequirements: formData.prototypeRequirements,
        qualityLevel: formData.qualityLevel,
        desiredBudget: formData.budget,
        submarket: formData.submarket,
        accessPriorities: formData.accessPriorities,
        knownRisks: formData.knownRisks,
        utilityAccess: formData.utilityAccess,
        environmentalConstraints: formData.environmentalConstraints,
        tenantRequirements: formData.tenantRequirements,
        heardAbout: formData.hearAboutUs,
        preferredContact: formData.contactMethod,
        bestTime: formData.bestTime,
        additionalNotes: formData.additionalNotes,
        attachments: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) : null,
        ndaConfidentiality: formData.ndaConsent,
        consentContact: formData.contactConsent,
        consentTermsPrivacy: formData.privacyConsent,
        marketingOptIn: formData.marketingOptIn,
        utmSource: new URLSearchParams(window.location.search).get('utm_source') || '',
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || '',
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
        utmTerm: new URLSearchParams(window.location.search).get('utm_term') || '',
        pageUrl: window.location.href
      };

      try {
        // Submit to Supabase via edge function
        const { data: result, error } = await supabase.functions.invoke('submit-application', {
          body: submissionData
        });

        if (error) {
          throw error;
        }

        // Also trigger webhook if provided
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify(submissionData),
          });
        }

        toast({
          title: "Application Submitted Successfully!",
          description: "Redirecting to next steps...",
        });

        // Redirect to thank you page
        setTimeout(() => {
          navigate("/thank-you");
        }, 1500);
      } catch (error) {
        console.error("Error submitting application:", error);
        toast({
          title: "Submission Error",
          description: "There was an issue submitting your application. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const calculateLeadScore = (): number => {
    let score = 0;
    
    // Budget scoring
    const budgetValue = parseInt(formData.budget.replace(/[^0-9]/g, ''));
    if (budgetValue >= 50000000) score += 100;
    else if (budgetValue >= 20000000) score += 80;
    else if (budgetValue >= 5000000) score += 60;
    else score += 40;
    
    // Project type scoring
    if (formData.projectType.includes("Mixed-Use") || formData.projectType.includes("Healthcare")) score += 20;
    
    // Ownership status scoring
    if (["Under Contract (Hard Money In)", "Closed", "Owned Long-Term"].includes(formData.ownershipStatus)) score += 30;
    
    return score;
  };

  const getProgress = () => (currentStep / totalSteps) * 100;

  const renderMultiSelectCheckboxes = (
    field: string,
    options: string[],
    values: string[]
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <Checkbox
            id={`${field}-${option}`}
            checked={values.includes(option)}
            onCheckedChange={(checked) => 
              handleMultiSelectChange(field, option, checked as boolean)
            }
          />
          <Label 
            htmlFor={`${field}-${option}`}
            className="text-sm font-body text-charcoal cursor-pointer"
          >
            {option}
          </Label>
        </div>
      ))}
    </div>
  );

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
              Answer a few quick questions so we can tailor your feasibility package. Only 5 projects accepted monthly.
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
          <div className="max-w-5xl mx-auto">
            

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Form Section */}
              <div className="lg:col-span-3">
                <Card className="shadow-2xl border-2 border-charcoal/10">
                  <CardHeader className="bg-gradient-to-r from-charcoal to-navy text-white">
                    <CardTitle className="font-headline text-xl">
                      {currentStep === 1 && "Contact Information"}
                      {currentStep === 2 && "Property Information"}
                      {currentStep === 3 && "Project Intent & Building Parameters"}
                      {currentStep === 4 && "Market & Risks"}
                      {currentStep === 5 && "Final Questions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit}>
                      
                      {/* Step 1: Contact Information */}
                      {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="fullName" className="font-body font-semibold text-charcoal">
                                Full Name *
                              </Label>
                              <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                placeholder="Your full name"
                                className={`mt-2 ${errors.fullName ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              {errors.fullName && <p className="text-maxx-red text-sm mt-1">{errors.fullName}</p>}
                            </div>
                            
                            <div>
                              <Label htmlFor="company" className="font-body font-semibold text-charcoal">
                                Company / Organization *
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
                                type="tel"
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

                      {/* Step 2: Property Information */}
                      {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                          <div>
                            <Label htmlFor="propertyAddress" className="font-body font-semibold text-charcoal">
                              Property Address *
                            </Label>
                            <Input
                              id="propertyAddress"
                              value={formData.propertyAddress}
                              onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                              placeholder="123 Main Street, City, State, ZIP"
                              className={`mt-2 ${errors.propertyAddress ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                            />
                            <p className="text-sm text-charcoal/60 mt-1">
                              Exact location helps us validate zoning and utility access.
                            </p>
                            {errors.propertyAddress && <p className="text-maxx-red text-sm mt-1">{errors.propertyAddress}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="parcelId" className="font-body font-semibold text-charcoal">
                                Parcel ID / APN
                              </Label>
                              <Input
                                id="parcelId"
                                value={formData.parcelId}
                                onChange={(e) => handleInputChange('parcelId', e.target.value)}
                                placeholder="123-456-789"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label className="font-body font-semibold text-charcoal">
                                Lot Size / Acreage *
                              </Label>
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={formData.lotSize}
                                  onChange={(e) => handleInputChange('lotSize', e.target.value)}
                                  placeholder="5.2"
                                  className={`${errors.lotSize ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                                />
                                <Select value={formData.lotSizeUnit} onValueChange={(value) => handleInputChange('lotSizeUnit', value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="acres">Acres</SelectItem>
                                    <SelectItem value="sqft">Sq Ft</SelectItem>
                                    <SelectItem value="hectares">Hectares</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {errors.lotSize && <p className="text-maxx-red text-sm mt-1">{errors.lotSize}</p>}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="currentUse" className="font-body font-semibold text-charcoal">
                              Current Use / Existing Improvements *
                            </Label>
                            <Select value={formData.currentUse} onValueChange={(value) => handleInputChange('currentUse', value)}>
                              <SelectTrigger className={`mt-2 ${errors.currentUse ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                <SelectValue placeholder="Select current use" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vacant-land">Vacant Land</SelectItem>
                                <SelectItem value="raw-land">Raw Land</SelectItem>
                                <SelectItem value="agricultural">Agricultural</SelectItem>
                                <SelectItem value="parking-lot">Parking Lot</SelectItem>
                                <SelectItem value="existing-occupied">Existing Structure (Occupied)</SelectItem>
                                <SelectItem value="existing-vacant">Existing Structure (Vacant)</SelectItem>
                                <SelectItem value="requires-demolition">Requires Demolition</SelectItem>
                                <SelectItem value="partially-improved">Partially Improved</SelectItem>
                                <SelectItem value="redevelopment-candidate">Redevelopment Candidate</SelectItem>
                                <SelectItem value="brownfield">Brownfield</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.currentUse && <p className="text-maxx-red text-sm mt-1">{errors.currentUse}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="zoning" className="font-body font-semibold text-charcoal">
                                Current Zoning Classification
                              </Label>
                              <Input
                                id="zoning"
                                value={formData.zoning}
                                onChange={(e) => handleInputChange('zoning', e.target.value)}
                                placeholder="C-2, R-3, M-1, etc."
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="ownershipStatus" className="font-body font-semibold text-charcoal">
                                Ownership / Acquisition Status *
                              </Label>
                              <Select value={formData.ownershipStatus} onValueChange={(value) => handleInputChange('ownershipStatus', value)}>
                                <SelectTrigger className={`mt-2 ${errors.ownershipStatus ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="exploring">Exploring Opportunities</SelectItem>
                                  <SelectItem value="site-identified">Site Identified</SelectItem>
                                  <SelectItem value="loi-drafted">LOI Drafted</SelectItem>
                                  <SelectItem value="loi-signed">LOI Signed</SelectItem>
                                  <SelectItem value="under-negotiation">Under Negotiation (PSA)</SelectItem>
                                  <SelectItem value="under-contract-dd">Under Contract (Due Diligence)</SelectItem>
                                  <SelectItem value="under-contract-hard">Under Contract (Hard Money In)</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="owned-long-term">Owned Long-Term</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.ownershipStatus && <p className="text-maxx-red text-sm mt-1">{errors.ownershipStatus}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Project Intent & Building Parameters */}
                      {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Project Type *
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select all that apply</p>
                            {renderMultiSelectCheckboxes('projectType', [
                              'Residential - Single Family',
                              'Residential - Multifamily',
                              'Retail - Shopping Center',
                              'Retail - Strip Mall',
                              'Hospitality - Hotel',
                              'Hospitality - Restaurant',
                              'Healthcare - Medical Office',
                              'Healthcare - Hospital',
                              'Industrial - Warehouse',
                              'Industrial - Manufacturing',
                              'Logistics - Distribution',
                              'Office - Class A',
                              'Office - Class B/C',
                              'Mixed-Use',
                              'Specialty - Self Storage',
                              'Specialty - Automotive',
                              'Franchise Prototype',
                              'Custom Build-to-Suit'
                            ], formData.projectType)}
                            {errors.projectType && <p className="text-maxx-red text-sm mt-1">{errors.projectType}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="font-body font-semibold text-charcoal">
                                Desired Building Size *
                              </Label>
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={formData.buildingSize}
                                  onChange={(e) => handleInputChange('buildingSize', e.target.value)}
                                  placeholder="50000"
                                  className={`${errors.buildingSize ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                                />
                                <Select value={formData.buildingSizeUnit} onValueChange={(value) => handleInputChange('buildingSizeUnit', value)}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sqft">Sq Ft</SelectItem>
                                    <SelectItem value="sqm">Sq M</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {errors.buildingSize && <p className="text-maxx-red text-sm mt-1">{errors.buildingSize}</p>}
                            </div>

                            <div>
                              <Label htmlFor="stories" className="font-body font-semibold text-charcoal">
                                Stories / Height *
                              </Label>
                              <Select value={formData.stories} onValueChange={(value) => handleInputChange('stories', value)}>
                                <SelectTrigger className={`mt-2 ${errors.stories ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select height" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">Single Story</SelectItem>
                                  <SelectItem value="2-stories">2 Stories</SelectItem>
                                  <SelectItem value="3-5-stories">3–5 Stories</SelectItem>
                                  <SelectItem value="mid-rise">Mid-Rise (6–10)</SelectItem>
                                  <SelectItem value="high-rise">High-Rise (10+)</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.stories && <p className="text-maxx-red text-sm mt-1">{errors.stories}</p>}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="prototypeRequirements" className="font-body font-semibold text-charcoal">
                              Prototype Requirements
                            </Label>
                            <Textarea
                              id="prototypeRequirements"
                              value={formData.prototypeRequirements}
                              onChange={(e) => handleInputChange('prototypeRequirements', e.target.value)}
                              placeholder="Describe any specific prototype or franchise requirements..."
                              className="mt-2"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="qualityLevel" className="font-body font-semibold text-charcoal">
                                Quality Level *
                              </Label>
                              <Select value={formData.qualityLevel} onValueChange={(value) => handleInputChange('qualityLevel', value)}>
                                <SelectTrigger className={`mt-2 ${errors.qualityLevel ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select quality level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="shell">Shell / Base Building</SelectItem>
                                  <SelectItem value="core-shell">Core+Shell</SelectItem>
                                  <SelectItem value="standard">Standard Build-Out (Class C)</SelectItem>
                                  <SelectItem value="mid-grade">Mid-Grade (Class B)</SelectItem>
                                  <SelectItem value="premium">Premium (Class A)</SelectItem>
                                  <SelectItem value="prototype">Prototype Standard</SelectItem>
                                  <SelectItem value="build-to-suit">Build-to-Suit</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.qualityLevel && <p className="text-maxx-red text-sm mt-1">{errors.qualityLevel}</p>}
                            </div>

                            <div>
                              <Label htmlFor="budget" className="font-body font-semibold text-charcoal">
                                Desired Budget *
                              </Label>
                              <Input
                                id="budget"
                                value={formData.budget}
                                onChange={(e) => handleInputChange('budget', e.target.value)}
                                placeholder="$25,000,000"
                                className={`mt-2 ${errors.budget ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                              />
                              <p className="text-sm text-charcoal/60 mt-1">
                                Approximate total project budget, land + construction + soft costs if known.
                              </p>
                              {errors.budget && <p className="text-maxx-red text-sm mt-1">{errors.budget}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Market & Risks */}
                      {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                          <div>
                            <Label htmlFor="submarket" className="font-body font-semibold text-charcoal">
                              Submarket / District *
                            </Label>
                            <Input
                              id="submarket"
                              value={formData.submarket}
                              onChange={(e) => handleInputChange('submarket', e.target.value)}
                              placeholder="e.g., Downtown Dallas, Energy Corridor, Plano"
                              className={`mt-2 ${errors.submarket ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                            />
                            {errors.submarket && <p className="text-maxx-red text-sm mt-1">{errors.submarket}</p>}
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Access Priorities
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select all that are important for your project</p>
                            {renderMultiSelectCheckboxes('accessPriorities', [
                              'Highway',
                              'Transit',
                              'Airport',
                              'Hospital',
                              'University',
                              'Population Density',
                              'Employment Center',
                              'Retail Corridor',
                              'Tourism',
                              'Port/Logistics',
                              'Other'
                            ], formData.accessPriorities)}
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Known Risks
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select any known or potential risks</p>
                            {renderMultiSelectCheckboxes('knownRisks', [
                              'Floodplain',
                              'Easements',
                              'Soil/Geotech',
                              'Legal/Title',
                              'Topography',
                              'Drainage',
                              'Political Opposition',
                              'Other'
                            ], formData.knownRisks)}
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Utility Access
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select available utilities</p>
                            {renderMultiSelectCheckboxes('utilityAccess', [
                              'Water',
                              'Sewer',
                              'Power',
                              'Gas',
                              'Fiber',
                              'Stormwater',
                              'Not Sure'
                            ], formData.utilityAccess)}
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Environmental Constraints
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select any environmental concerns</p>
                            {renderMultiSelectCheckboxes('environmentalConstraints', [
                              'Wetlands',
                              'Brownfield',
                              'Protected Land',
                              'Endangered Species',
                              'Historic Site',
                              'Air Quality',
                              'Noise',
                              'Other',
                              'Not Sure'
                            ], formData.environmentalConstraints)}
                          </div>

                          <div>
                            <Label htmlFor="tenantRequirements" className="font-body font-semibold text-charcoal">
                              Tenant / Prototype Requirements
                            </Label>
                            <Textarea
                              id="tenantRequirements"
                              value={formData.tenantRequirements}
                              onChange={(e) => handleInputChange('tenantRequirements', e.target.value)}
                              placeholder="Describe any specific tenant requirements, franchise standards, or operational needs..."
                              className="mt-2"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      {/* Step 5: Final Questions */}
                      {currentStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="hearAboutUs" className="font-body font-semibold text-charcoal">
                                How Did You Hear About Us? *
                              </Label>
                              <Select value={formData.hearAboutUs} onValueChange={(value) => handleInputChange('hearAboutUs', value)}>
                                <SelectTrigger className={`mt-2 ${errors.hearAboutUs ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                                  <SelectItem value="google">Google</SelectItem>
                                  <SelectItem value="referral">Referral</SelectItem>
                                  <SelectItem value="client-partner">Client/Partner</SelectItem>
                                  <SelectItem value="event">Event</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="youtube-podcast">YouTube/Podcast</SelectItem>
                                  <SelectItem value="press">Press</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.hearAboutUs && <p className="text-maxx-red text-sm mt-1">{errors.hearAboutUs}</p>}
                            </div>

                            <div>
                              <Label htmlFor="contactMethod" className="font-body font-semibold text-charcoal">
                                Preferred Contact Method
                              </Label>
                              <Select value={formData.contactMethod} onValueChange={(value) => handleInputChange('contactMethod', value)}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="text">Text/SMS</SelectItem>
                                  <SelectItem value="video-call">Video Call</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="bestTime" className="font-body font-semibold text-charcoal">
                              Best Time to Reach You
                            </Label>
                            <Select value={formData.bestTime} onValueChange={(value) => handleInputChange('bestTime', value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                                <SelectItem value="evening">Evening (5pm-7pm)</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="additionalNotes" className="font-body font-semibold text-charcoal">
                              Additional Notes
                            </Label>
                            <Textarea
                              id="additionalNotes"
                              value={formData.additionalNotes}
                              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                              placeholder="Any additional information that would help us better understand your project..."
                              className="mt-2"
                              rows={4}
                            />
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Upload Supporting Files
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">
                              Upload any relevant documents (PDF, DOCX, XLSX, CSV, JPG, PNG, DWG, ZIP - max 25MB)
                            </p>
                            <div className="border-2 border-dashed border-charcoal/20 rounded-lg p-6">
                              <div className="text-center">
                                <Upload className="w-8 h-8 mx-auto text-charcoal/40 mb-2" />
                                <Input
                                  type="file"
                                  multiple
                                  accept=".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.dwg,.zip"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="file-upload"
                                />
                                <Label 
                                  htmlFor="file-upload"
                                  className="cursor-pointer text-navy hover:text-navy/80 font-semibold"
                                >
                                  Click to upload files
                                </Label>
                              </div>
                              {uploadedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {uploadedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Consent Checkboxes */}
                          <div className="space-y-4 pt-6 border-t border-charcoal/20">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id="nda-consent"
                                checked={formData.ndaConsent}
                                onCheckedChange={(checked) => handleInputChange('ndaConsent', checked as boolean)}
                                className={errors.ndaConsent ? 'border-maxx-red' : ''}
                              />
                              <Label htmlFor="nda-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                I agree to maintain confidentiality and acknowledge that an NDA may be required for detailed project discussions. *
                              </Label>
                            </div>
                            {errors.ndaConsent && <p className="text-maxx-red text-sm">{errors.ndaConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id="contact-consent"
                                checked={formData.contactConsent}
                                onCheckedChange={(checked) => handleInputChange('contactConsent', checked as boolean)}
                                className={errors.contactConsent ? 'border-maxx-red' : ''}
                              />
                              <Label htmlFor="contact-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                I consent to be contacted by BuildSmarter™ regarding my feasibility application and project. *
                              </Label>
                            </div>
                            {errors.contactConsent && <p className="text-maxx-red text-sm">{errors.contactConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id="privacy-consent"
                                checked={formData.privacyConsent}
                                onCheckedChange={(checked) => handleInputChange('privacyConsent', checked as boolean)}
                                className={errors.privacyConsent ? 'border-maxx-red' : ''}
                              />
                              <Label htmlFor="privacy-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                I agree to the Privacy Policy and Terms of Service. *
                              </Label>
                            </div>
                            {errors.privacyConsent && <p className="text-maxx-red text-sm">{errors.privacyConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id="marketing-opt-in"
                                checked={formData.marketingOptIn}
                                onCheckedChange={(checked) => handleInputChange('marketingOptIn', checked as boolean)}
                              />
                              <Label htmlFor="marketing-opt-in" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                I would like to receive marketing communications and industry insights from BuildSmarter™.
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-12 pt-8 border-t border-charcoal/20">
                        {currentStep > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrev}
                            className="flex items-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                          </Button>
                        ) : (
                          <div />
                        )}

                        {currentStep < totalSteps ? (
                          <Button
                            type="button"
                            onClick={handleNext}
                            className="bg-maxx-red hover:bg-maxx-red/90 text-white flex items-center gap-2"
                          >
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-maxx-red hover:bg-maxx-red/90 text-white flex items-center gap-2"
                          >
                            {isLoading ? "Submitting..." : "Submit My Application"}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Trust & Risk Reversal Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8 shadow-xl border-2 border-navy/20">
                  <CardHeader className="bg-navy/5">
                    <CardTitle className="flex items-center gap-3 text-navy">
                      <Shield className="w-6 h-6" />
                      Trust & Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-body font-semibold text-charcoal mb-1">
                          100% Fee Credit
                        </p>
                        <p className="font-body text-sm text-charcoal/70">
                          Your feasibility fee is fully credited toward Preconstruction or Design-Build.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-maxx-red flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-body font-semibold text-charcoal mb-1">
                          Confidential Reporting
                        </p>
                        <p className="font-body text-sm text-charcoal/70">
                          All applications treated as confidential. NDA-ready reporting.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-navy flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-body font-semibold text-charcoal mb-1">
                          Proven Track Record
                        </p>
                        <p className="font-body text-sm text-charcoal/70">
                          Trusted by developers managing $500M+ in Texas CRE projects.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-maxx-red flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-body font-semibold text-charcoal mb-1">
                          Limited Availability
                        </p>
                        <p className="font-body text-sm text-charcoal/70">
                          Only 5 projects accepted monthly to ensure quality service.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal/20 p-4 lg:hidden z-50">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-body font-semibold text-charcoal">Step {currentStep} of {totalSteps}</span>
            <span className="text-charcoal/60 ml-2">({Math.round(getProgress())}% complete)</span>
          </div>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-maxx-red hover:bg-maxx-red/90 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-maxx-red hover:bg-maxx-red/90 text-white"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}