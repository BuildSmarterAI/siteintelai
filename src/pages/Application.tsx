import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, Shield, Award, ArrowRight, ArrowLeft, Zap, Database, Users, Upload, Edit, AlertCircle } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { AuthPrompt } from "@/components/AuthPrompt";

export default function Application() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load completed steps from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('application_completed_steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save to localStorage whenever completedSteps changes
  useEffect(() => {
    localStorage.setItem('application_completed_steps', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  // Set initial step based on URL parameter with completion enforcement
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const requestedStep = parseInt(stepParam, 10);
      if (requestedStep >= 1 && requestedStep <= 6) {
        // Check if all previous steps are completed
        const canAccessStep = Array.from({ length: requestedStep - 1 }, (_, i) => i + 1)
          .every(step => completedSteps.has(step));
        
        if (canAccessStep) {
          setCurrentStep(requestedStep);
        } else {
          // Redirect to the first incomplete step
          const firstIncompleteStep = Array.from({ length: 5 }, (_, i) => i + 1)
            .find(step => !completedSteps.has(step)) || 1;
          setCurrentStep(firstIncompleteStep);
        }
      }
    }
  }, [searchParams, completedSteps]);
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
    geoLat: null as number | null,
    geoLng: null as number | null,
    county: "",
    city: "",
    state: "",
    zipCode: "",
    neighborhood: "",
    sublocality: "",
    placeId: "",
    
    // Step 3: Project Intent & Building Parameters
    projectType: [] as string[],
    projectTypeOther: "",
    buildingSize: "",
    buildingSizeUnit: "sqft",
    stories: "",
    buildingHeight: "",
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
    submissionTimestamp: "",
    
    // Hidden GIS enriched fields (auto-populated)
    situsAddress: "",
    administrativeAreaLevel2: "",
    parcelOwner: "",
    acreageCad: null as number | null,
    zoningCode: "",
    overlayDistrict: "",
    floodplainZone: "",
    baseFloodElevation: null as number | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://hook.us1.make.com/1a0o8mufqrhb6intqppg4drjnllcgw9k");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  // Track which fields were auto-enriched (to show lock UI)
  const [enrichedFields, setEnrichedFields] = useState<{
    parcelId: boolean;
    lotSize: boolean;
    zoning: boolean;
    county: boolean;
    city: boolean;
    state: boolean;
    zipCode: boolean;
    neighborhood: boolean;
  }>({
    parcelId: false,
    lotSize: false,
    zoning: false,
    county: false,
    city: false,
    state: false,
    zipCode: false,
    neighborhood: false
  });

  // Track which fields user manually unlocked
  const [unlockedFields, setUnlockedFields] = useState<{
    parcelId: boolean;
    lotSize: boolean;
    zoning: boolean;
    county: boolean;
    city: boolean;
    state: boolean;
    zipCode: boolean;
    neighborhood: boolean;
  }>({
    parcelId: false,
    lotSize: false,
    zoning: false,
    county: false,
    city: false,
    state: false,
    zipCode: false,
    neighborhood: false
  });

  // Track loading state for address autocomplete
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Store original HCAD values for conflict detection
  const [hcadValues, setHcadValues] = useState<{
    parcelId?: string;
    lotSize?: string;
    zoning?: string;
  }>({});

  const totalSteps = 5;

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('[Form Update]', field, '=', value);
      return updated;
    });
    
    // Clear error for this field when user makes a change
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
      console.log('[Step 2 Validation]', {
        propertyAddress: formData.propertyAddress,
        ownershipStatus: formData.ownershipStatus
      });
      if (!formData.propertyAddress) newErrors.propertyAddress = "Property address is required";
      if (!formData.ownershipStatus) newErrors.ownershipStatus = "Ownership status is required";
    }

    if (step === 3) {
      // All fields in step 3 are now optional
    }

    if (step === 4) {
      // No validation needed for step 4 as all fields are optional now
    }

    if (step === 5) {
      if (!formData.ndaConsent) newErrors.ndaConsent = "NDA consent is required";
      if (!formData.contactConsent) newErrors.contactConsent = "Contact consent is required";
      if (!formData.privacyConsent) newErrors.privacyConsent = "Privacy & Terms consent is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log('[Next Button Clicked] Current Step:', currentStep, 'Form Data:', {
      propertyAddress: formData.propertyAddress,
      ownershipStatus: formData.ownershipStatus
    });
    
    if (validateStep(currentStep)) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Move to next step
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      console.log('[Validation Failed] Errors:', errors);
    }
  };

  const handlePrev = () => {
    // Don't allow going back from Step 2 to Step 1 (contact info is locked)
    if (currentStep === 2) {
      toast({
        title: "Contact Information Locked",
        description: "Your contact details have been saved and cannot be modified during this session.",
      });
      return;
    }
    
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(5)) {
      setIsLoading(true);
      
      // Detect conflicts between user input and HCAD data
      const dataFlags = [];

      if (unlockedFields.parcelId && hcadValues.parcelId && formData.parcelId !== hcadValues.parcelId) {
        dataFlags.push({
          type: 'user_override',
          field: 'parcel_id',
          user_value: formData.parcelId,
          hcad_value: hcadValues.parcelId,
          confidence: 'low',
          message: 'User manually overrode HCAD parcel ID'
        });
      }

      if (unlockedFields.lotSize && hcadValues.lotSize) {
        const userLotSize = parseFloat(formData.lotSize);
        const hcadLotSize = parseFloat(hcadValues.lotSize);
        const percentDiff = Math.abs((userLotSize - hcadLotSize) / hcadLotSize) * 100;
        
        if (percentDiff > 10) {
          dataFlags.push({
            type: 'user_override',
            field: 'lot_size',
            user_value: `${formData.lotSize} ${formData.lotSizeUnit}`,
            hcad_value: `${hcadValues.lotSize} acres`,
            confidence: percentDiff > 25 ? 'very_low' : 'low',
            percent_difference: percentDiff.toFixed(1),
            message: `User lot size differs from HCAD by ${percentDiff.toFixed(1)}%`
          });
        }
      }

      if (unlockedFields.zoning && hcadValues.zoning && formData.zoning !== hcadValues.zoning) {
        dataFlags.push({
          type: 'user_override',
          field: 'zoning',
          user_value: formData.zoning,
          hcad_value: hcadValues.zoning,
          confidence: 'low',
          message: 'User manually overrode HCAD zoning classification'
        });
      }
      
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
        geoLat: formData.geoLat,
        geoLng: formData.geoLng,
        county: formData.county,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        neighborhood: formData.neighborhood,
        sublocality: formData.sublocality,
        placeId: formData.placeId,
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
        pageUrl: window.location.href,
        
        // Include enriched GIS data from formData state
        situsAddress: formData.situsAddress,
        administrativeAreaLevel2: formData.administrativeAreaLevel2,
        parcelOwner: formData.parcelOwner,
        acreageCad: formData.acreageCad,
        zoningCode: formData.zoningCode,
        overlayDistrict: formData.overlayDistrict,
        floodplainZone: formData.floodplainZone,
        baseFloodElevation: formData.baseFloodElevation,
        
        // Add conflict flags if any exist
        dataFlags: dataFlags.length > 0 ? dataFlags : null
      };

      try {
        // Get current session to pass auth token
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {};

        // Submit to Supabase via edge function
        const { data: result, error } = await supabase.functions.invoke('submit-application', {
          body: submissionData,
          headers
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

        // Clear completed steps from localStorage on successful submission
        localStorage.removeItem('application_completed_steps');
        
        // Redirect to thank you page with application ID
        setTimeout(() => {
          navigate(`/thank-you?applicationId=${result.id}`);
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
                     {/* Required Fields Legend */}
                     <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                         <span className="text-maxx-red">*</span>
                         Required fields must be completed to proceed to the next step
                       </p>
                     </div>
                    <form onSubmit={handleSubmit}>
                      
                      {/* Step 1: Contact Information */}
                      {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                          {/* Auth Prompt Component */}
                          <AuthPrompt 
                            onAuthSuccess={(user, profile) => {
                              // Auto-fill form with profile data
                              if (profile.full_name) {
                                handleInputChange('fullName', profile.full_name);
                              }
                              if (profile.email) {
                                handleInputChange('email', profile.email);
                              }
                              if (profile.company) {
                                handleInputChange('company', profile.company);
                              }
                              if (profile.phone) {
                                handleInputChange('phone', profile.phone);
                              }
                            }}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="fullName" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                 Full Name <span className="text-maxx-red text-lg">*</span>
                               </Label>
                              <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                placeholder="Your full name"
                                 className={`mt-2 ${errors.fullName ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                               />
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Your primary contact name for project communications.
                               </p>
                              {errors.fullName && <p className="text-maxx-red text-sm mt-1">{errors.fullName}</p>}
                            </div>
                            
                             <div>
                               <Label htmlFor="company" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                 Company / Organization <span className="text-maxx-red text-lg">*</span>
                               </Label>
                              <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                placeholder="Your company name"
                                 className={`mt-2 ${errors.company ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                               />
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Organization responsible for the project and decision-making.
                               </p>
                              {errors.company && <p className="text-maxx-red text-sm mt-1">{errors.company}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="email" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                 Email Address <span className="text-maxx-red text-lg">*</span>
                               </Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="your@email.com"
                                 className={`mt-2 ${errors.email ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                               />
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Primary email for project communications and feasibility report delivery.
                               </p>
                              {errors.email && <p className="text-maxx-red text-sm mt-1">{errors.email}</p>}
                            </div>
                            
                             <div>
                               <Label htmlFor="phone" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                 Phone Number <span className="text-maxx-red text-lg">*</span>
                               </Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                 className={`mt-2 ${errors.phone ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                               />
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Direct contact for urgent project discussions and coordination.
                               </p>
                              {errors.phone && <p className="text-maxx-red text-sm mt-1">{errors.phone}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Property Information */}
                      {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                          {/* Validation Summary Banner */}
                          {Object.keys(errors).length > 0 && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-maxx-red rounded-r">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-maxx-red flex-shrink-0 mt-0.5" />
                                <div>
                                  <h3 className="font-semibold text-maxx-red mb-1">Please Complete Required Fields</h3>
                                  <ul className="list-disc list-inside text-sm text-charcoal space-y-1">
                                    {errors.propertyAddress && <li>Property Address is required</li>}
                                    {errors.ownershipStatus && <li>Ownership / Acquisition Status is required</li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                           <AddressAutocomplete
                             value={formData.propertyAddress}
                             onChange={(value, coordinates, addressDetails) => {
                               handleInputChange('propertyAddress', value);
                               
                               // Set loading state when address is being populated
                               setIsAddressLoading(true);
                               
                               if (coordinates || addressDetails) {
                                 setFormData(prev => ({
                                   ...prev,
                                   geoLat: coordinates?.lat || prev.geoLat,
                                   geoLng: coordinates?.lng || prev.geoLng,
                                   county: addressDetails?.county || prev.county,
                                   city: addressDetails?.city || prev.city,
                                   state: addressDetails?.state || prev.state,
                                   zipCode: addressDetails?.zipCode || prev.zipCode,
                                   neighborhood: addressDetails?.neighborhood || prev.neighborhood,
                                   sublocality: addressDetails?.sublocality || prev.sublocality,
                                   placeId: addressDetails?.placeId || prev.placeId
                                 }));
                                 
                                 // Mark Google-populated fields as enriched
                                 setEnrichedFields(prev => ({
                                   ...prev,
                                   county: !!addressDetails?.county,
                                   city: !!addressDetails?.city,
                                   state: !!addressDetails?.state,
                                   zipCode: !!addressDetails?.zipCode,
                                   neighborhood: !!addressDetails?.neighborhood
                                 }));
                                 
                                 // Auto-unlock Google fields after 2 seconds (they're basic info)
                                 setTimeout(() => {
                                   setIsAddressLoading(false);
                                   setUnlockedFields(prev => ({
                                     ...prev,
                                     county: true,
                                     city: true,
                                     state: true,
                                     zipCode: true,
                                     neighborhood: true
                                   }));
                                 }, 2000);
                               }
                             }}
                  onEnrichmentComplete={(data) => {
                                if (data?.success && data?.data) {
                                  setEnrichedData(data.data);
                                  // Resolve lot size from multiple possible sources
                                  const lotSizeFromApiMetaSqft = data?.api_meta?.hcad_parcel?.parcel_data?.land_sqft;
                                  const resolvedLotSize =
                                    (typeof data.data.lot_size_value === 'number' && data.data.lot_size_value)
                                      || (typeof data.data.acreage_cad === 'number' && data.data.acreage_cad)
                                      || (typeof lotSizeFromApiMetaSqft === 'number' ? +(lotSizeFromApiMetaSqft / 43560).toFixed(4) : undefined);

                                  console.log('[Enrichment] Lot size candidates:', {
                                    lot_size_value: data.data.lot_size_value,
                                    acreage_cad: data.data.acreage_cad,
                                    land_sqft: lotSizeFromApiMetaSqft,
                                    resolvedLotSize
                                  });

                                  // Auto-fill both visible and hidden enriched fields
                                  setFormData(prev => ({
                                    ...prev,
                                    // Visible fields
                                    parcelId: data.data.parcel_id || prev.parcelId,
                                    zoning: data.data.zoning_code || prev.zoning,
                                    lotSize: typeof resolvedLotSize === 'number' ? String(resolvedLotSize) : prev.lotSize,
                                    lotSizeUnit: (data.data.lot_size_unit as string) || prev.lotSizeUnit,
                                    // Hidden enriched fields
                                    situsAddress: data.data.situs_address || prev.situsAddress,
                                    administrativeAreaLevel2: data.data.administrative_area_level_2 || prev.administrativeAreaLevel2,
                                    parcelOwner: data.data.parcel_owner || prev.parcelOwner,
                                    acreageCad: data.data.acreage_cad || prev.acreageCad,
                                    zoningCode: data.data.zoning_code || prev.zoningCode,
                                    overlayDistrict: data.data.overlay_district || prev.overlayDistrict,
                                    floodplainZone: data.data.floodplain_zone || prev.floodplainZone,
                                    baseFloodElevation: data.data.base_flood_elevation || prev.baseFloodElevation
                                  }));

                                  // Mark which fields were successfully enriched
                                  setEnrichedFields(prev => ({
                                    ...prev, // Preserve Google-populated field flags
                                    parcelId: !!data.data.parcel_id,
                                    lotSize: !!resolvedLotSize,
                                    zoning: !!data.data.zoning_code
                                  }));

                                  // Store HCAD values for conflict detection
                                  setHcadValues({
                                    parcelId: data.data.parcel_id,
                                    lotSize: typeof resolvedLotSize === 'number' ? String(resolvedLotSize) : undefined,
                                    zoning: data.data.zoning_code
                                  });

                                  const hasFlags = Array.isArray(data.data_flags) && data.data_flags.length > 0;
                                  if (hasFlags) {
                                    toast({
                                      title: "GIS Data Partially Loaded",
                                      description: "Some fields could not be auto-filled. You can proceed with manual entry.",
                                    });
                                  } else {
                                    toast({
                                      title: "GIS Data Loaded ✅",
                                      description: "Property information has been automatically filled from public records.",
                                    });
                                  }
                                } else if (!data?.success) {
                                  toast({
                                    title: "Auto-fill unavailable",
                                    description: data?.error || "Unable to load GIS data for this location.",
                                  });
                                }
                              }}
                             placeholder="123 Main Street, City, State, ZIP"
                             label="Property Address"
                             error={errors.propertyAddress}
                             required={true}
                           />
                           
                           {/* Hidden GIS Enriched Fields (auto-populated from enrich-feasibility API)
                               These fields are stored in formData state and submitted automatically:
                               - situsAddress: Normalized address from Google Geocoding
                               - administrativeAreaLevel2: County name
                               - parcelOwner: Property owner from parcel records
                               - acreageCad: Lot acreage from CAD parcel data
                               - zoningCode: Zoning classification code
                               - overlayDistrict: Zoning overlay district
                               - floodplainZone: FEMA flood zone designation
                               - baseFloodElevation: Base flood elevation from FEMA
                           */}

                          {/* Google-Populated Fields (Auto-locked during loading) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                              <Label htmlFor="county" className="font-body font-semibold text-charcoal">
                                County
                              </Label>
                              <div className="relative">
                                <Input
                                  id="county"
                                  value={formData.county}
                                  onChange={(e) => handleInputChange('county', e.target.value)}
                                  placeholder="Enter county"
                                  className="mt-2"
                                  readOnly={isAddressLoading || (enrichedFields.county && !unlockedFields.county)}
                                />
                                {isAddressLoading && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                              {enrichedFields.county && !isAddressLoading && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                                  ✓ From Google Places
                                </Badge>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="city" className="font-body font-semibold text-charcoal">
                                City
                              </Label>
                              <div className="relative">
                                <Input
                                  id="city"
                                  value={formData.city}
                                  onChange={(e) => handleInputChange('city', e.target.value)}
                                  placeholder="Enter city"
                                  className="mt-2"
                                  readOnly={isAddressLoading || (enrichedFields.city && !unlockedFields.city)}
                                />
                                {isAddressLoading && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                              {enrichedFields.city && !isAddressLoading && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                                  ✓ From Google Places
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="state" className="font-body font-semibold text-charcoal">
                                State
                              </Label>
                              <div className="relative">
                                <Input
                                  id="state"
                                  value={formData.state}
                                  onChange={(e) => handleInputChange('state', e.target.value)}
                                  placeholder="TX"
                                  className="mt-2"
                                  readOnly={isAddressLoading || (enrichedFields.state && !unlockedFields.state)}
                                />
                                {isAddressLoading && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                              {enrichedFields.state && !isAddressLoading && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                                  ✓ From Google Places
                                </Badge>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="zipCode" className="font-body font-semibold text-charcoal">
                                ZIP Code
                              </Label>
                              <div className="relative">
                                <Input
                                  id="zipCode"
                                  value={formData.zipCode}
                                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                  placeholder="77069"
                                  className="mt-2"
                                  readOnly={isAddressLoading || (enrichedFields.zipCode && !unlockedFields.zipCode)}
                                />
                                {isAddressLoading && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                              {enrichedFields.zipCode && !isAddressLoading && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                                  ✓ From Google Places
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="neighborhood" className="font-body font-semibold text-charcoal">
                              Neighborhood / Area
                            </Label>
                            <div className="relative">
                              <Input
                                id="neighborhood"
                                value={formData.neighborhood}
                                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                                placeholder="Enter neighborhood"
                                className="mt-2"
                                readOnly={isAddressLoading || (enrichedFields.neighborhood && !unlockedFields.neighborhood)}
                              />
                              {isAddressLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                              )}
                            </div>
                            {enrichedFields.neighborhood && !isAddressLoading && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                                ✓ From Google Places
                              </Badge>
                            )}
                            <p className="text-sm text-charcoal/60 mt-1">
                              Helps determine local market conditions and comparable properties.
                            </p>
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
                                placeholder={enrichedFields.parcelId && !unlockedFields.parcelId ? "Auto-filled from HCAD" : "123-456-789"}
                                className="mt-2"
                                readOnly={enrichedFields.parcelId && !unlockedFields.parcelId}
                              />
                              {enrichedFields.parcelId && (
                                <div className="flex items-center gap-2 mt-1">
                                  {!unlockedFields.parcelId ? (
                                    <>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        ✓ Verified from HCAD
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setUnlockedFields(prev => ({ ...prev, parcelId: true }));
                                          toast({
                                            title: "Manual Override Enabled",
                                            description: "You can now edit the Parcel ID. We'll flag this for review.",
                                          });
                                        }}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <p className="text-sm text-charcoal/60 mt-1">
                                Official parcel identifier helps verify property boundaries and records.
                              </p>
                            </div>

                            <div>
                              <Label className="font-body font-semibold text-charcoal">
                                Lot Size / Acreage
                              </Label>
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={formData.lotSize}
                                  onChange={(e) => handleInputChange('lotSize', e.target.value)}
                                  placeholder={enrichedFields.lotSize && !unlockedFields.lotSize ? "Auto-filled from HCAD" : "5.2"}
                                  className={`${errors.lotSize ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}
                                  readOnly={enrichedFields.lotSize && !unlockedFields.lotSize}
                                />
                                <Select 
                                  value={formData.lotSizeUnit} 
                                  onValueChange={(value) => handleInputChange('lotSizeUnit', value)}
                                  disabled={enrichedFields.lotSize && !unlockedFields.lotSize}
                                >
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
                              {enrichedFields.lotSize && (
                                <div className="flex items-center gap-2 mt-1">
                                  {!unlockedFields.lotSize ? (
                                    <>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        ✓ Verified from HCAD
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setUnlockedFields(prev => ({ ...prev, lotSize: true }));
                                          toast({
                                            title: "Manual Override Enabled",
                                            description: "You can now edit the Lot Size. Official HCAD value will be preserved for reference.",
                                          });
                                        }}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <p className="text-sm text-charcoal/60 mt-1">
                                Property size determines development capacity and zoning requirements.
                              </p>
                              {errors.lotSize && <p className="text-maxx-red text-sm mt-1">{errors.lotSize}</p>}
                            </div>
                          </div>

                           <div>
                             <Label htmlFor="currentUse" className="font-body font-semibold text-charcoal">
                               Current Use / Existing Improvements
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Existing conditions impact development costs and permitting timeline.
                             </p>
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
                                placeholder={enrichedFields.zoning && !unlockedFields.zoning ? "Auto-filled from HCAD" : "C-2, R-3, M-1, etc."}
                                className="mt-2"
                                readOnly={enrichedFields.zoning && !unlockedFields.zoning}
                              />
                              {enrichedFields.zoning && (
                                <div className="flex items-center gap-2 mt-1">
                                  {!unlockedFields.zoning ? (
                                    <>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        ✓ Verified from HCAD
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setUnlockedFields(prev => ({ ...prev, zoning: true }));
                                          toast({
                                            title: "Manual Override Enabled",
                                            description: "You can now edit the Zoning. HCAD data will be flagged for comparison.",
                                          });
                                        }}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <p className="text-sm text-charcoal/60 mt-1">
                                Zoning determines allowed uses and development requirements.
                              </p>
                            </div>

                             <div>
                               <Label htmlFor="ownershipStatus" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                 Ownership / Acquisition Status <span className="text-maxx-red text-lg">*</span>
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Acquisition timeline affects feasibility study scope and urgency.
                               </p>
                              {errors.ownershipStatus && (
                                <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <AlertCircle className="w-4 h-4 text-maxx-red flex-shrink-0" />
                                  <p className="text-maxx-red text-sm font-medium">{errors.ownershipStatus}</p>
                                </div>
                              )}
                              {formData.ownershipStatus && !errors.ownershipStatus && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Status selected ✓</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Project Intent & Building Parameters */}
                      {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                           <div>
                             <Label className="font-body font-semibold text-charcoal">
                               Desired Project Type
                             </Label>
                            <p className="text-sm text-charcoal/60 mb-4">
                              Select all project types that apply. Expand categories to see options. Your selection determines zoning checks, cost benchmarking, and feasibility analysis focus.
                            </p>
                            
                            <Accordion type="multiple" className="w-full space-y-2">
                              {/* Retail */}
                              <AccordionItem value="retail" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🛍 Retail
                                    {formData.projectType.some(type => ['shopping_center', 'strip_mall', 'big_box', 'grocery_specialty'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['shopping_center', 'strip_mall', 'big_box', 'grocery_specialty'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'shopping_center', label: 'Shopping Center' },
                                      { value: 'strip_mall', label: 'Strip Mall' },
                                      { value: 'big_box', label: 'Big Box / Anchor Store' },
                                      { value: 'grocery_specialty', label: 'Grocery / Specialty Retail' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Hospitality */}
                              <AccordionItem value="hospitality" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏨 Hospitality
                                    {formData.projectType.some(type => ['hotel', 'resort', 'restaurant_qsr', 'entertainment_venue', 'casino_gaming'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['hotel', 'resort', 'restaurant_qsr', 'entertainment_venue', 'casino_gaming'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'hotel', label: 'Hotel' },
                                      { value: 'resort', label: 'Resort' },
                                      { value: 'restaurant_qsr', label: 'Restaurant / QSR' },
                                      { value: 'entertainment_venue', label: 'Entertainment Venue / Theater' },
                                      { value: 'casino_gaming', label: 'Casino / Gaming Facility' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Healthcare */}
                              <AccordionItem value="healthcare" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏥 Healthcare
                                    {formData.projectType.some(type => ['medical_office_building', 'hospital', 'urgent_care_clinic', 'specialty_clinic', 'ambulatory_surgery_center', 'rehabilitation_center'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['medical_office_building', 'hospital', 'urgent_care_clinic', 'specialty_clinic', 'ambulatory_surgery_center', 'rehabilitation_center'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'medical_office_building', label: 'Medical Office Building (MOB)' },
                                      { value: 'hospital', label: 'Hospital' },
                                      { value: 'urgent_care_clinic', label: 'Urgent Care / Clinic' },
                                      { value: 'specialty_clinic', label: 'Specialty Clinic (Dental, Dialysis, Surgery Center)' },
                                      { value: 'ambulatory_surgery_center', label: 'Ambulatory Surgery Center' },
                                      { value: 'rehabilitation_center', label: 'Rehabilitation Center' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Industrial */}
                              <AccordionItem value="industrial" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏭 Industrial
                                    {formData.projectType.some(type => ['warehouse', 'manufacturing_facility', 'flex_industrial', 'rd_facility'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['warehouse', 'manufacturing_facility', 'flex_industrial', 'rd_facility'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'warehouse', label: 'Warehouse' },
                                      { value: 'manufacturing_facility', label: 'Manufacturing Facility' },
                                      { value: 'flex_industrial', label: 'Flex Industrial' },
                                      { value: 'rd_facility', label: 'R&D Facility' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Logistics */}
                              <AccordionItem value="logistics" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🚚 Logistics
                                    {formData.projectType.some(type => ['distribution_center', 'last_mile_facility', 'cold_storage_facility', 'data_center', 'trucking_terminal'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['distribution_center', 'last_mile_facility', 'cold_storage_facility', 'data_center', 'trucking_terminal'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'distribution_center', label: 'Distribution Center' },
                                      { value: 'last_mile_facility', label: 'Last-Mile Facility' },
                                      { value: 'cold_storage_facility', label: 'Cold Storage Facility' },
                                      { value: 'data_center', label: 'Data Center' },
                                      { value: 'trucking_terminal', label: 'Trucking Terminal' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Office */}
                              <AccordionItem value="office" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏢 Office
                                    {formData.projectType.some(type => ['office_class_a', 'office_class_b', 'office_class_c', 'corporate_headquarters', 'coworking_flex_office', 'call_center_operations'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['office_class_a', 'office_class_b', 'office_class_c', 'corporate_headquarters', 'coworking_flex_office', 'call_center_operations'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'office_class_a', label: 'Office Class A' },
                                      { value: 'office_class_b', label: 'Office Class B' },
                                      { value: 'office_class_c', label: 'Office Class C' },
                                      { value: 'corporate_headquarters', label: 'Corporate Headquarters / Campus' },
                                      { value: 'coworking_flex_office', label: 'Coworking / Flex Office' },
                                      { value: 'call_center_operations', label: 'Call Center / Operations' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Mixed-Use */}
                              <AccordionItem value="mixed-use" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏗 Mixed-Use
                                    {formData.projectType.some(type => ['mixed_use_retail_residential', 'mixed_use_office_residential', 'mixed_use_retail_office'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['mixed_use_retail_residential', 'mixed_use_office_residential', 'mixed_use_retail_office'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'mixed_use_retail_residential', label: 'Mixed-Use (Retail + Residential)' },
                                      { value: 'mixed_use_office_residential', label: 'Mixed-Use (Office + Residential)' },
                                      { value: 'mixed_use_retail_office', label: 'Mixed-Use (Retail + Office)' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Specialty */}
                              <AccordionItem value="specialty" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🎯 Specialty
                                    {formData.projectType.some(type => ['self_storage', 'automotive_dealership', 'car_wash', 'gas_station_convenience', 'educational_facility', 'religious_institutional', 'civic_community_recreational', 'research_lab_life_sciences', 'sports_facility_arena', 'agricultural_agri_tech', 'performing_arts_center', 'stadium_arena'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['self_storage', 'automotive_dealership', 'car_wash', 'gas_station_convenience', 'educational_facility', 'religious_institutional', 'civic_community_recreational', 'research_lab_life_sciences', 'sports_facility_arena', 'agricultural_agri_tech', 'performing_arts_center', 'stadium_arena'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { value: 'self_storage', label: 'Self Storage' },
                                      { value: 'automotive_dealership', label: 'Automotive Dealership' },
                                      { value: 'car_wash', label: 'Car Wash' },
                                      { value: 'gas_station_convenience', label: 'Gas Station / Convenience Store' },
                                      { value: 'educational_facility', label: 'Educational / School / Training Facility' },
                                      { value: 'religious_institutional', label: 'Religious / Institutional Facility' },
                                      { value: 'civic_community_recreational', label: 'Civic / Community / Recreational Center' },
                                      { value: 'research_lab_life_sciences', label: 'Research / Lab / Life Sciences' },
                                      { value: 'sports_facility_arena', label: 'Sports Facility / Arena' },
                                      { value: 'agricultural_agri_tech', label: 'Agricultural / Agri-Tech Facility' },
                                      { value: 'performing_arts_center', label: 'Performing Arts Center' },
                                      { value: 'stadium_arena', label: 'Stadium / Arena' }
                                    ].map((option) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`projectType-${option.value}`}
                                          checked={formData.projectType.includes(option.value)}
                                          onCheckedChange={(checked) => {
                                            handleMultiSelectChange('projectType', option.value, !!checked);
                                          }}
                                        />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Other */}
                              <AccordionItem value="other" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏷 Other
                                    {formData.projectType.some(type => ['franchise_prototype', 'custom_build_to_suit', 'other'].includes(type)) && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['franchise_prototype', 'custom_build_to_suit', 'other'].includes(type)).length} selected
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {[
                                        { value: 'franchise_prototype', label: 'Franchise Prototype (Custom)' },
                                        { value: 'custom_build_to_suit', label: 'Custom Build-to-Suit' },
                                        { value: 'other', label: 'Other' }
                                      ].map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`projectType-${option.value}`}
                                            checked={formData.projectType.includes(option.value)}
                                            onCheckedChange={(checked) => {
                                              handleMultiSelectChange('projectType', option.value, !!checked);
                                            }}
                                          />
                                          <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                            {option.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Other text input */}
                                    {formData.projectType.includes('other') && (
                                      <div className="mt-3">
                                        <Input
                                          placeholder="Please specify other project type..."
                                          value={formData.projectTypeOther || ''}
                                          onChange={(e) => handleInputChange('projectTypeOther', e.target.value)}
                                          className="max-w-md"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                            
                            {errors.projectType && <p className="text-maxx-red text-sm mt-2">{errors.projectType}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                             <Label className="font-body font-semibold text-charcoal">
                               Desired Building Size
                             </Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={formData.buildingSize}
                                onChange={(e) => handleInputChange('buildingSize', e.target.value)}
                                placeholder="e.g., 50000 or 'Maximum Possible' or 'Don't Know'"
                                className="border-charcoal/20"
                              />
                               <Select value={formData.buildingSizeUnit} onValueChange={(value) => handleInputChange('buildingSizeUnit', value)}>
                                 <SelectTrigger className="w-24">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="sqft">Sq Ft</SelectItem>
                                 </SelectContent>
                               </Select>
                            </div>
                            <p className="text-sm text-charcoal/60 mt-1">
                              Enter desired size, or specify 'Maximum Possible' or 'Don't Know' if unsure.
                            </p>
                          </div>

                             <div>
                               <Label htmlFor="stories" className="font-body font-semibold text-charcoal">
                                 Desired Stories
                               </Label>
                              <Select value={formData.stories} onValueChange={(value) => handleInputChange('stories', value)}>
                                <SelectTrigger className={`mt-2 ${errors.stories ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`}>
                                  <SelectValue placeholder="Select number of stories" />
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Number of floors for the building.
                               </p>
                              {errors.stories && <p className="text-maxx-red text-sm mt-1">{errors.stories}</p>}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="buildingHeight" className="font-body font-semibold text-charcoal">
                              Desired Overall Building Height
                            </Label>
                            <Input
                              id="buildingHeight"
                              value={formData.buildingHeight}
                              onChange={(e) => handleInputChange('buildingHeight', e.target.value)}
                              placeholder="e.g., 120 feet or 'Don't Know'"
                              className="mt-2 border-charcoal/20"
                            />
                            <p className="text-sm text-charcoal/60 mt-1">
                              Total building height including roofing and mechanical equipment.
                            </p>
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Prototype requirements affect design flexibility and approval process.
                             </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="qualityLevel" className="font-body font-semibold text-charcoal">
                                 Quality Level
                               </Label>
                              <Select value={formData.qualityLevel} onValueChange={(value) => handleInputChange('qualityLevel', value)}>
                                <SelectTrigger className="mt-2 border-charcoal/20">
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Quality level determines material specifications and construction costs.
                               </p>
                            </div>

                           <div>
                             <Label htmlFor="budget" className="font-body font-semibold text-charcoal">
                               Desired Budget
                             </Label>
                            <div className="relative mt-2">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60">$</span>
                              <Input
                                id="budget"
                                value={formData.budget}
                                onChange={(e) => handleInputChange('budget', e.target.value)}
                                placeholder="25,000,000"
                                className="pl-7 border-charcoal/20"
                              />
                            </div>
                            <p className="text-sm text-charcoal/60 mt-1">
                              Approximate total project budget (land + construction + soft costs). Leave blank if unknown.
                            </p>
                          </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Market & Risks */}
                      {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">

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
                              'Other',
                              'Not Sure'
                             ], formData.accessPriorities)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Access priorities help evaluate location advantages and tenant appeal.
                             </p>
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
                              'Other',
                              'Not Sure'
                             ], formData.knownRisks)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Known risks help prioritize due diligence and budget contingencies.
                             </p>
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Utility availability affects infrastructure costs and development timeline.
                             </p>
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Environmental factors impact permitting requirements and project costs.
                             </p>
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Tenant requirements guide space planning and operational considerations.
                             </p>
                          </div>
                        </div>
                      )}

                      {/* Step 5: Final Questions */}
                      {currentStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="hearAboutUs" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                  How Did You Hear About Us?
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Helps us track marketing effectiveness and tailor our communication.
                               </p>
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Ensures we reach you using your preferred communication method.
                               </p>
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
                               <p className="text-sm text-charcoal/60 mt-1">
                                 Helps us schedule calls when you're most likely to be available.
                               </p>
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
                             <p className="text-sm text-charcoal/60 mt-1">
                               Additional context helps us provide more accurate feasibility analysis.
                             </p>
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
                                 I agree to maintain confidentiality and acknowledge that an NDA may be required for detailed project discussions. <span className="text-maxx-red text-lg">*</span>
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
                                 I consent to be contacted by SiteIntel™ regarding my feasibility application and project. <span className="text-maxx-red text-lg">*</span>
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
                                 I agree to the Privacy Policy and Terms of Service. <span className="text-maxx-red text-lg">*</span>
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
                                I would like to receive marketing communications and industry insights from SiteIntel™.
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-12 pt-8 border-t border-charcoal/20">
                        {currentStep > 1 && currentStep !== 2 ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrev}
                            className="flex items-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                          </Button>
                        ) : currentStep === 2 ? (
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Contact information secured
                          </div>
                        ) : (
                          <div />
                        )}

                        {currentStep < totalSteps ? (
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              type="button"
                              onClick={handleNext}
                              className="bg-maxx-red hover:bg-maxx-red/90 text-white flex items-center gap-2"
                            >
                              Next
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                            {currentStep === 2 && (!formData.propertyAddress || !formData.ownershipStatus) && (
                              <p className="text-xs text-charcoal/60">
                                Complete all required fields to continue
                              </p>
                            )}
                          </div>
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