import { useState, useEffect, useRef } from "react";
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
import { CheckCircle, Clock, Shield, Award, ArrowRight, ArrowLeft, Zap, Database, Users, Upload, Edit, AlertCircle, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { AuthPrompt } from "@/components/AuthPrompt";
import { ContactStep } from "@/components/application/ContactStep";
import { PropertyStep } from "@/components/application/PropertyStep";
import { PropertyStepFullWidth } from "@/components/application/PropertyStepFullWidth";
import { ApplicationProgress } from "@/components/application/ApplicationProgress";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { useApplicationDraft } from "@/hooks/useApplicationDraft";
import { Progress } from "@/components/ui/progress";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { DrawParcelControl } from "@/components/DrawParcelControl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OnboardingTour } from "@/components/OnboardingTour";
export default function Application() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'complete' | 'partial' | 'none'>('none');

  // Use form hook
  const {
    formData,
    errors,
    updateField,
    validateStep: validateStepFromHook,
    setFormData,
    setErrors,
    updateMultipleFields
  } = useApplicationForm();

  // Draft auto-save hook
  const { 
    draftId, 
    lastSaved, 
    isSaving: isDraftSaving, 
    isLoading: isDraftLoading,
    saveDraft,
    clearDraft 
  } = useApplicationDraft(formData, currentStep, updateMultipleFields);

  // Authentication and profile loading
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);

  // Load user profile and auto-fill contact information
  useEffect(() => {
    // Check if this is a new application session
    const applicationInProgress = sessionStorage.getItem('application_in_progress');
    if (!applicationInProgress) {
      sessionStorage.setItem('application_in_progress', 'true');
      console.log('[New Application] Started new application session');
    }
    async function loadUserData() {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          const {
            data: profile
          } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profile) {
            setUserProfile(profile);

            // Auto-fill contact information from profile
            const updates: any = {};
            if (profile.full_name) updates.fullName = profile.full_name;
            if (profile.email) updates.email = profile.email;
            if (profile.company) updates.company = profile.company;
            if (profile.phone) updates.phone = profile.phone;
            if (Object.keys(updates).length > 0) {
              updateMultipleFields(updates);
            }

            // Check if profile is COMPLETE (all 4 required fields)
            const profileComplete = profile.full_name && profile.email && profile.phone && profile.company;
            if (profileComplete) {
              // Profile is complete - skip Step 0 (Contact)
              setProfileStatus('complete');
              setHasCompleteProfile(true);
              setCompletedSteps(prev => new Set([...prev, 0]));

              // Respect URL step parameter - don't auto-redirect if user is on a valid step
              const stepParam = new URLSearchParams(window.location.search).get('step');
              const currentStepFromUrl = stepParam ? parseInt(stepParam, 10) : 0;
              
              // If user has a valid step in URL (e.g., returning to step 5), respect it
              if (currentStepFromUrl >= 1) {
                // User is past contact - let them stay where they are
                console.log('[Profile] User on step', currentStepFromUrl, '- respecting URL');
                setCurrentStep(currentStepFromUrl);
              } else {
                // Contact info complete - skip to step 1 (Property)
                navigate('/application?step=1', {
                  replace: true
                });
                setCurrentStep(1);
              }
            } else if (profile.full_name && profile.email) {
              // Profile is PARTIAL - show friendly message and let them complete
              setProfileStatus('partial');
              setHasCompleteProfile(false);
              console.log('Profile is partial - user needs to complete phone and company');
            } else {
              // Profile is missing basic info
              setProfileStatus('none');
              setHasCompleteProfile(false);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setAuthLoading(false);
      }
    }
    loadUserData();

    // Listen for auth state changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        loadUserData();
      } else {
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-detect completed steps based on form data (resilient recovery)
  const detectCompletedSteps = (data: typeof formData): Set<number> => {
    const completed = new Set<number>();
    
    // Step 0: Contact info complete
    const hasValidEmail = data.email && /\S+@\S+\.\S+/.test(data.email);
    if (data.fullName && data.company && hasValidEmail && data.phone) {
      completed.add(0);
    }
    
    // Step 1: Property address provided
    if (data.propertyAddress) {
      completed.add(1);
    }
    
    // Steps 2-4 are optional fields - mark as complete if we've progressed past them
    // OR if they have any data filled in
    // Step 2: Building Details (optional fields)
    if (data.projectType.length > 0 || data.buildingSize || data.stories || data.constructionType) {
      completed.add(2);
    }
    
    // Step 3: Additional Context (optional)
    if (data.submarket || data.accessPriorities.length > 0 || data.knownRisks.length > 0) {
      completed.add(3);
    }
    
    // Step 4: Final questions (optional)
    if (data.hearAboutUs || data.additionalNotes) {
      completed.add(4);
    }
    
    return completed;
  };

  // Load completed steps from localStorage on mount, with auto-detection fallback
  useEffect(() => {
    const saved = localStorage.getItem('application_completed_steps');
    if (saved) {
      const savedSteps = new Set<number>(JSON.parse(saved));
      // Merge with auto-detected steps for resilience
      const autoDetected = detectCompletedSteps(formData);
      const merged = new Set([...savedSteps, ...autoDetected]);
      setCompletedSteps(merged);
    } else {
      // No saved data - auto-detect from form data
      setCompletedSteps(detectCompletedSteps(formData));
    }
  }, []);

  // Save to localStorage whenever completedSteps changes
  useEffect(() => {
    localStorage.setItem('application_completed_steps', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  // Helper to navigate to a step and sync URL
  const goToStep = (step: number) => {
    setCurrentStep(step);
    navigate(`/application?step=${step}`, {
      replace: true
    });
  };

  // Ref to track if initial URL step has been processed
  const initialStepProcessedRef = useRef(false);
  const lastStepParamRef = useRef<string | null>(null);

  // Set initial step based on URL parameter with resilient enforcement
  useEffect(() => {
    const stepParam = searchParams.get('step');
    
    // Skip if no step param or same as last processed
    if (!stepParam) return;
    if (stepParam === lastStepParamRef.current && initialStepProcessedRef.current) return;
    
    const requestedStep = parseInt(stepParam, 10);
    if (requestedStep < 0 || requestedStep > 6) return;

    // Re-detect completed steps based on current form data for resilience
    const detectedSteps = detectCompletedSteps(formData);
    
    // Get current completed steps from localStorage for merge
    const savedStepsRaw = localStorage.getItem('application_completed_steps');
    const savedSteps = savedStepsRaw ? new Set<number>(JSON.parse(savedStepsRaw)) : new Set<number>();
    const mergedSteps = new Set([...savedSteps, ...detectedSteps]);

    // Check if all previous steps are completed (using merged data)
    // For optional steps (3, 4, 5), allow access if we have the key required data
    const hasRequiredData = mergedSteps.has(0) && mergedSteps.has(1) && mergedSteps.has(2);
    const canAccessOptionalSteps = hasRequiredData && requestedStep >= 3;
    
    // If requesting step 3-6 and we have required data from steps 0-2, allow it
    if (canAccessOptionalSteps) {
      setCurrentStep(requestedStep);
      // Mark intermediate optional steps as passed if accessing a later step
      if (requestedStep > 3) {
        const updatedSteps = new Set(mergedSteps);
        for (let i = 3; i < requestedStep; i++) {
          updatedSteps.add(i);
        }
        setCompletedSteps(updatedSteps);
      } else {
        setCompletedSteps(mergedSteps);
      }
    } else {
      // Standard check for steps 0-2
      const canAccessStep = Array.from({
        length: requestedStep
      }, (_, i) => i).every(step => mergedSteps.has(step));
      
      if (canAccessStep) {
        setCurrentStep(requestedStep);
        setCompletedSteps(mergedSteps);
      } else {
        // Redirect to first incomplete step
        const firstIncompleteStep = Array.from({
          length: 6
        }, (_, i) => i).find(step => !mergedSteps.has(step)) ?? 0;
        
        navigate(`/application?step=${firstIncompleteStep}`, { replace: true });
        setCurrentStep(firstIncompleteStep);
        setCompletedSteps(mergedSteps);
      }
    }
    
    // Mark as processed
    lastStepParamRef.current = stepParam;
    initialStepProcessedRef.current = true;
  }, [searchParams, formData, navigate]); // Removed completedSteps and currentStep to prevent loops

  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://hook.us1.make.com/1a0o8mufqrhb6intqppg4drjnllcgw9k");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  // Drawing tool state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState<any>(null);
  const [isSavingParcel, setIsSavingParcel] = useState(false);

  // Track enrichment timeout to cancel if user makes changes
  const enrichmentTimeoutRef = useRef<number | null>(null);

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
    // Clear any pending enrichment timeout when user manually changes fields
    if (enrichmentTimeoutRef.current) {
      clearTimeout(enrichmentTimeoutRef.current);
      enrichmentTimeoutRef.current = null;
    }
    updateField(field, value);
  };

  // Format currency with commas for display
  const formatCurrency = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, '');
    if (numeric === '') return '';
    return parseInt(numeric, 10).toLocaleString('en-US');
  };

  // Handle budget changes - strip non-numeric and store raw value
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    handleInputChange('budget', rawValue);
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

  // Drawing handlers
  const handleDrawingComplete = (geometry: any) => {
    setDrawnGeometry(geometry);
    setDrawingMode(false);

    // Store geometry in formData for submission
    updateField('drawnParcelGeometry', geometry);
    toast({
      title: "Parcel Boundary Drawn",
      description: "Boundary will be included in your feasibility report."
    });
  };
  const handleSaveParcel = async (name: string) => {
    setIsSavingParcel(true);
    try {
      // Save to temporary state (will be submitted with application)
      updateField('drawnParcelName', name);
      toast({
        title: "Parcel Saved",
        description: `Parcel "${name}" will be submitted with your application.`
      });
    } finally {
      setIsSavingParcel(false);
    }
  };
  const handleCancelDrawing = () => {
    setDrawingMode(false);
    setDrawnGeometry(null);
    updateField('drawnParcelGeometry', null);
  };

  // Use validation from hook
  const validateStep = validateStepFromHook;
  const handleNext = async () => {
    console.log('[Next Button Clicked] Current Step:', currentStep, 'Form Data:', {
      propertyAddress: formData.propertyAddress
    });

    // Auto-mark Step 1 as completed if we're past it and all fields are valid
    if (currentStep > 1) {
      const step1Valid = formData.fullName && formData.company && /^\S+@\S+\.\S+$/.test(formData.email) && formData.phone;
      if (step1Valid && !completedSteps.has(1)) {
        setCompletedSteps(prev => new Set([...prev, 1]));
      }
    }

    // Check if Step 1 needs to be completed first (for Step 2+)
    if (currentStep >= 2 && !completedSteps.has(1)) {
      const step1Valid = formData.fullName && formData.company && /^\S+@\S+\.\S+$/.test(formData.email) && formData.phone;
      if (!step1Valid) {
        toast({
          title: "Complete Step 1 First",
          description: "Please complete Step 1 (Contact Information) before proceeding.",
          variant: "destructive"
        });
        goToStep(1);
        return;
      }
    }
    if (validateStep(currentStep)) {
      // Save intent to sessionStorage and localStorage when Step 0 is completed
      if (currentStep === 0) {
        sessionStorage.setItem('intent_captured_this_session', 'true');
        localStorage.setItem('user_intent_type', formData.intentType);
        console.log('[Intent] Saved to session and localStorage:', formData.intentType);
      }

      // If completing Step 1 AND user is authenticated, update their profile
      if (currentStep === 1) {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (session?.user) {
          try {
            const {
              error
            } = await supabase.from('profiles').update({
              full_name: formData.fullName,
              company: formData.company,
              phone: formData.phone,
              email: formData.email,
              updated_at: new Date().toISOString()
            }).eq('id', session.user.id);
            if (error) throw error;
            console.log('Profile updated successfully');
            setProfileStatus('complete');
            setHasCompleteProfile(true);
          } catch (error) {
            console.error('Error updating profile:', error);
            // Non-blocking - continue even if update fails
          }
        }
      }

      // Extra guard: If trying to go to Step 4 (Review), ensure Step 1 (Property) is complete
      if (currentStep === 3) {
        if (!formData.propertyAddress || !formData.geoLat || !formData.geoLng) {
          toast({
            title: "Property Address Required",
            description: "Please complete Step 1 (Property Information) before proceeding to Review.",
            variant: "destructive"
          });
          goToStep(1);
          return;
        }
      }

      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      // Move to next step with URL sync
      const nextStep = Math.min(currentStep + 1, totalSteps);
      goToStep(nextStep);
    } else {
      console.log('[Validation Failed] Errors:', errors);
    }
  };
  const handlePrev = () => {
    // Don't allow going back from Step 1 to Step 0 (contact info is locked)
    if (currentStep === 1) {
      toast({
        title: "Contact Information Locked",
        description: "Your contact details have been saved and cannot be modified during this session."
      });
      return;
    }

    // Allow going back to previous steps
    const prevStep = Math.max(currentStep - 1, 0);
    goToStep(prevStep);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation - check critical property data BEFORE submission
    if (!formData.propertyAddress || formData.propertyAddress.trim() === '') {
      toast({
        title: "Missing Property Address",
        description: "Please go back to Step 1 and select a property address.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.geoLat || !formData.geoLng) {
      toast({
        title: "Missing Property Coordinates",
        description: "Please go back to Step 2 and select a valid property with geocoded coordinates.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateStep(6)) {
      return;
    }
    
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
      intentType: formData.intentType,
      propertyAddress: formData.propertyAddress,
      parcelIdApn: formData.parcelId,
      lotSizeValue: formData.lotSize,
      lotSizeUnit: formData.lotSizeUnit,
      existingImprovements: formData.currentUse,
      zoningClassification: formData.zoning,
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
      attachments: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })) : null,
      ndaConfidentiality: formData.ndaConsent,
      consentContact: formData.contactConsent,
      consentTermsPrivacy: formData.privacyConsent,
      marketingOptIn: formData.marketingOptIn,
      utmSource: new URLSearchParams(window.location.search).get('utm_source') || '',
      utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || '',
      utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
      utmTerm: new URLSearchParams(window.location.search).get('utm_term') || '',
      pageUrl: window.location.href,
      // Add drawn parcel data
      drawnParcelGeometry: formData.drawnParcelGeometry,
      drawnParcelName: formData.drawnParcelName,
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();

      // Verify user is authenticated
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit an application.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      const headers = {
        'Authorization': `Bearer ${session.access_token}`
      };

      // Submit to Supabase via edge function
      const {
        data: result,
        error
      } = await supabase.functions.invoke('submit-application', {
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
            "Content-Type": "application/json"
          },
          mode: "no-cors",
          body: JSON.stringify(submissionData)
        });
      }
      toast({
        title: "Application Submitted Successfully!",
        description: "Redirecting to next steps..."
      });

      // Clear completed steps, session markers, and draft on successful submission
      localStorage.removeItem('application_completed_steps');
      sessionStorage.removeItem('application_in_progress');
      sessionStorage.removeItem('intent_captured_this_session');
      clearDraft(); // Clear draft after successful submission
      console.log('[Submission] Cleared session markers and draft for next application');

      // Redirect to thank you page with application ID
      setTimeout(() => {
        navigate(`/thank-you?applicationId=${result.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Error",
        description: "There was an issue submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const calculateLeadScore = (): number => {
    let score = 0;

    // Budget scoring
    const budgetValue = parseInt(formData.budget.replace(/[^0-9]/g, ''));
    if (budgetValue >= 50000000) score += 100;else if (budgetValue >= 20000000) score += 80;else if (budgetValue >= 5000000) score += 60;else score += 40;

    // Project type scoring
    if (formData.projectType.includes("Mixed-Use") || formData.projectType.includes("Healthcare")) score += 20;
    return score;
  };
  // Step titles for progress bar
  const stepTitles = [
    "Contact Information",
    "Property Information",
    "Building Details",
    "Additional Context",
    "Review & Submit"
  ];

  return <div className="min-h-screen bg-background">
      {/* Sticky Progress Bar */}
      <ApplicationProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepTitles[currentStep] || "Application"}
        isDraftSaving={isDraftSaving}
        lastSaved={lastSaved}
      />

      {/* Main Content - Full Width for Step 1 */}
      {currentStep === 1 ? (
        <section className="py-8">
          <div className="w-full px-4 lg:px-8">
            {/* Validation Summary Banner */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-destructive rounded-r max-w-7xl mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">Please Complete Required Fields</h3>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {errors.propertyAddress && <li>Property Address is required</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
              <PropertyStepFullWidth
                formData={{
                  propertyAddress: formData.propertyAddress,
                  geoLat: formData.geoLat,
                  geoLng: formData.geoLng,
                  parcelId: formData.parcelId,
                  lotSize: formData.lotSize,
                  lotSizeUnit: formData.lotSizeUnit,
                  parcelOwner: formData.parcelOwner,
                  zoning: formData.zoning,
                  county: formData.county,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                  neighborhood: formData.neighborhood,
                }}
                onChange={handleInputChange}
                onAddressSelect={async (lat: number, lng: number, address: string) => {
                  console.log('[Address Selected]', { lat, lng, address });
                  setFormData(prev => ({
                    ...prev,
                    propertyAddress: address,
                    geoLat: lat,
                    geoLng: lng
                  }));
                  setIsAddressLoading(true);
                  toast({
                    title: "Location Selected",
                    description: "Fetching property details..."
                  });
                  try {
                    const { data, error } = await supabase.functions.invoke('enrich-feasibility', {
                      body: { lat, lng, formatted_address: address, mode: 'geocode_only' }
                    });
                    if (error) {
                      console.error('[Enrichment Error]', error);
                      toast({
                        title: "Enrichment Failed",
                        description: "Could not load property details. Please enter them manually.",
                        variant: "destructive"
                      });
                      return;
                    }
                    if (data?.success && data?.data) {
                      const enrichedData = data.data;
                      setFormData(prev => ({
                        ...prev,
                        county: enrichedData.county || enrichedData.administrative_area_level_2 || '',
                        city: enrichedData.city || enrichedData.locality || '',
                        state: enrichedData.administrative_area_level_1 || enrichedData.state || 'TX',
                        zipCode: enrichedData.postal_code || enrichedData.zipCode || '',
                        neighborhood: enrichedData.neighborhood || enrichedData.sublocality || '',
                        parcelId: enrichedData.parcel_id || prev.parcelId,
                        lotSize: enrichedData.acreage_cad ? String(enrichedData.acreage_cad) : prev.lotSize,
                        zoning: enrichedData.zoning_code || prev.zoning,
                        parcelOwner: enrichedData.parcel_owner || prev.parcelOwner,
                      }));
                      setEnrichedFields(prev => ({
                        ...prev,
                        parcelId: !!enrichedData.parcel_id,
                        lotSize: !!enrichedData.acreage_cad,
                        zoning: !!enrichedData.zoning_code,
                        county: !!(enrichedData.county || enrichedData.administrative_area_level_2),
                        city: !!(enrichedData.city || enrichedData.locality),
                        state: true,
                        zipCode: !!enrichedData.postal_code,
                        neighborhood: !!(enrichedData.neighborhood || enrichedData.sublocality),
                      }));
                      toast({
                        title: "Property Data Loaded",
                        description: "Property details have been auto-filled from public records.",
                      });
                    }
                  } catch (err) {
                    console.error('[Enrichment Error]', err);
                  } finally {
                    setIsAddressLoading(false);
                  }
                }}
                onParcelSelect={(parcel: any) => {
                  const props = parcel.properties || {};
                  const parcelId = props.ACCOUNT || props.HCAD_NUM || props.parcelId || props.GEO_ID || '';
                  const owner = props.OWNER_NAME || props.OWNER || props.owner_name_1 || props.ownername || '';
                  const acreage = props.ACREAGE || props.acreage || props.acreage_1 || 0;
                  const situsAddr = props.SITUS_ADDR || props.SITE_ADDR_1 || props.situs || props.address || '';
                  const zoning = props.ZONING || props.zone_class || '';
                  
                  setFormData(prev => ({
                    ...prev,
                    propertyAddress: situsAddr || prev.propertyAddress,
                    parcelId: parcelId,
                    parcelOwner: owner,
                    lotSize: acreage ? String(acreage) : prev.lotSize,
                    zoning: zoning || prev.zoning,
                  }));
                  
                  if (parcel.geometry) {
                    const centroid = turf.centroid(parcel.geometry);
                    const [lng, lat] = centroid.geometry.coordinates;
                    setFormData(prev => ({
                      ...prev,
                      geoLat: lat,
                      geoLng: lng,
                    }));
                  }
                  
                  setEnrichedFields(prev => ({
                    ...prev,
                    parcelId: !!parcelId,
                    lotSize: !!acreage,
                    zoning: !!zoning,
                  }));
                }}
                onDrawnParcelSave={(parcel) => {
                  setFormData(prev => ({
                    ...prev,
                    drawnParcelGeometry: parcel.geometry,
                    drawnParcelName: parcel.name,
                    geoLat: parcel.centroid.lat,
                    geoLng: parcel.centroid.lng,
                    lotSize: String(parcel.acreage),
                    parcelSource: 'user_drawn',
                  }));
                }}
                errors={errors}
                isAddressLoading={isAddressLoading}
                applicationId={draftId || undefined}
              />
              
              {/* Navigation Buttons for Step 1 */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Contact information secured
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button type="button" onClick={handleNext} className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  {!formData.propertyAddress && (
                    <p className="text-xs text-muted-foreground">
                      Complete all required fields to continue
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </section>
      ) : (
        /* Standard Card Layout for Other Steps */
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg border border-border">
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  <CardTitle className="font-heading text-xl">
                    {currentStep === 0 && "Contact Information"}
                    {currentStep === 2 && "What Do You Want to Build?"}
                    {currentStep === 3 && "Additional Context"}
                    {currentStep === 4 && "Final Questions"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  {/* Required Fields Legend */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <span className="text-destructive">*</span>
                      Required fields must be completed to proceed to the next step
                    </p>
                  </div>
                  <form onSubmit={handleSubmit}>
                    
                    {/* Step 0: Contact Information */}
                    {currentStep === 0 && <div className="space-y-6 animate-fade-in">
                        {/* Loading State */}
                        {authLoading ? <Card>
                            <CardContent className="py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-muted-foreground">Loading your information...</p>
                              </div>
                            </CardContent>
                         </Card> : userProfile ? <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                           <CardContent className="pt-6">
                             <div className="flex items-center gap-3">
                               <CheckCircle className="h-6 w-6 text-green-600" />
                               <div>
                                 <p className="font-semibold text-green-900 dark:text-green-100">Welcome back, {userProfile.full_name}!</p>
                                 <p className="text-sm text-green-700 dark:text-green-300">Your contact information has been loaded. You can edit it below if needed.</p>
                               </div>
                             </div>
                           </CardContent>
                         </Card> : !isAuthenticated ? <AuthPrompt onAuthSuccess={(user, profile) => {
                     setUserProfile(profile);
                     const updates: any = {};
                     if (profile.full_name) updates.fullName = profile.full_name;
                     if (profile.email) updates.email = profile.email;
                     if (profile.company) updates.company = profile.company;
                     if (profile.phone) updates.phone = profile.phone;
                     if (Object.keys(updates).length > 0) {
                       updateMultipleFields(updates);
                       if (profile.full_name && profile.email && profile.phone && profile.company) {
                         setCompletedSteps(prev => new Set([...prev, 0]));
                       }
                     }
                   }} /> : null}

                          {authLoading ? <div className="space-y-4">
                              <Skeleton className="h-12 w-full" />
                              <Skeleton className="h-12 w-full" />
                              <Skeleton className="h-12 w-full" />
                              <Skeleton className="h-12 w-full" />
                            </div> : hasCompleteProfile ? <Card className="p-6 bg-primary/5 border-primary/20">
                              <div className="flex items-start gap-4">
                                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2">Welcome Back!</h3>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Your contact information has been loaded: <strong>{formData.fullName}</strong> ({formData.email})
                                  </p>
                                  <Button onClick={() => goToStep(1)} className="gap-2">
                                    Continue to Property Details <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card> : <>
                              {profileStatus === 'partial' && <div className="bg-accent/10 border border-accent rounded-lg p-4 mb-6">
                                  <p className="text-sm text-foreground">
                                    <strong>You're signed in!</strong> Just complete your phone and company details below to continue.
                                  </p>
                                </div>}
                              <ContactStep formData={{
                       fullName: formData.fullName,
                       company: formData.company,
                       email: formData.email,
                       phone: formData.phone
                     }} onChange={handleInputChange} errors={errors} />
                          </>}
                       </div>}

                    {/* Step 1 is now handled separately above */}

                        // Update address and coordinates
                        setFormData(prev => ({
                          ...prev,
                          propertyAddress: address,
                          geoLat: lat,
                          geoLng: lng
                        }));
                        setIsAddressLoading(true);
                        toast({
                          title: "Location Selected",
                          description: "Fetching property details..."
                        });
                        try {
                          // Call enrichment API
                          const {
                            data,
                            error
                          } = await supabase.functions.invoke('enrich-feasibility', {
                            body: {
                              lat,
                              lng,
                              formatted_address: address,
                              mode: 'geocode_only'
                            }
                          });
                          if (error) {
                            console.error('[Enrichment Error]', error);
                            toast({
                              title: "Enrichment Failed",
                              description: "Could not load property details. Please enter them manually.",
                              variant: "destructive"
                            });
                            return;
                          }
                          if (data?.success && data?.data) {
                            const enrichedData = data.data;

                            // Extract fields from enrichment response
                            const county = enrichedData.county || enrichedData.administrative_area_level_2 || '';
                            const city = enrichedData.city || enrichedData.locality || '';
                            const state = enrichedData.administrative_area_level_1 || enrichedData.state || 'TX';
                            const zipCode = enrichedData.postal_code || enrichedData.zipCode || '';
                            const neighborhood = enrichedData.neighborhood || enrichedData.sublocality || '';
                            const parcelId = enrichedData.parcel_id || '';
                            const lotSizeValue = enrichedData.acreage_cad || enrichedData.lot_size_value || '';
                            const zoning = enrichedData.zoning_code || '';
                            const parcelOwner = enrichedData.parcel_owner || '';

                            // Update form data with enriched fields
                            setFormData(prev => ({
                              ...prev,
                              county,
                              city,
                              state,
                              zipCode,
                              neighborhood,
                              parcelId: parcelId || prev.parcelId,
                              lotSize: lotSizeValue ? String(lotSizeValue) : prev.lotSize,
                              zoning: zoning || prev.zoning,
                              parcelOwner: parcelOwner || prev.parcelOwner,
                              // Hidden enriched fields
                              situsAddress: enrichedData.situs_address || prev.situsAddress,
                              administrativeAreaLevel2: enrichedData.administrative_area_level_2 || prev.administrativeAreaLevel2,
                              acreageCad: enrichedData.acreage_cad || prev.acreageCad,
                              zoningCode: enrichedData.zoning_code || prev.zoningCode,
                              overlayDistrict: enrichedData.overlay_district || prev.overlayDistrict,
                              floodplainZone: enrichedData.floodplain_zone || prev.floodplainZone,
                              baseFloodElevation: enrichedData.base_flood_elevation || prev.baseFloodElevation
                            }));

                            // Mark fields as enriched
                            setEnrichedFields(prev => ({
                              ...prev,
                              county: !!county,
                              city: !!city,
                              state: !!state,
                              zipCode: !!zipCode,
                              neighborhood: !!neighborhood,
                              parcelId: !!parcelId,
                              lotSize: !!lotSizeValue,
                              zoning: !!zoning
                            }));

                            // Store HCAD values for conflict detection
                            setHcadValues({
                              parcelId: parcelId || undefined,
                              lotSize: lotSizeValue ? String(lotSizeValue) : undefined,
                              zoning: zoning || undefined
                            });

                            // Show success or partial toast
                            const hasFlags = Array.isArray(data.data_flags) && data.data_flags.length > 0;
                            if (hasFlags) {
                              toast({
                                title: "Property Data Partially Loaded",
                                description: "Some fields could not be auto-filled. Please complete them manually."
                              });
                            } else {
                              toast({
                                title: "Property Details Loaded ✅",
                                description: "Fields have been auto-filled from public records."
                              });
                            }
                          } else {
                            toast({
                              title: "Auto-fill Unavailable",
                              description: "Unable to load property data. Please enter details manually."
                            });
                          }
                        } catch (err) {
                          console.error('[Enrichment Exception]', err);
                          toast({
                            title: "Error Loading Data",
                            description: "An unexpected error occurred. Please try again.",
                            variant: "destructive"
                          });
                        } finally {
                          // Always unlock fields
                          setIsAddressLoading(false);
                        }
                      }} onParcelSelect={(parcel: any) => {
                        console.log('[Parcel Selected]', parcel);
                        if (!parcel?.properties || !parcel?.geometry) {
                          console.error('Invalid parcel data');
                          return;
                        }
                        const props = parcel.properties;

                        // Calculate parcel centroid from geometry
                        let centroidLat: number | null = null;
                        let centroidLng: number | null = null;
                        if (parcel.geometry.type === 'Polygon' && parcel.geometry.coordinates?.[0]?.[0]) {
                          const [lng, lat] = parcel.geometry.coordinates[0][0];
                          centroidLat = lat;
                          centroidLng = lng;
                        }

                        // Extract parcel data
                        const parcelId = props.ACCOUNT || props.HCAD_NUM || props.GEO_ID || '';
                        const situsAddress = props.SITUS_ADDRESS || props.SITE_ADDR_1 || props.PROP_ADDR || '';
                        const ownerName = props.OWNER_NAME || props.OWNER || '';
                        const acreage = props.ACREAGE || props.CALC_ACRE || props.LAND_ACRES || null;
                        const county = props.COUNTY || props.SITE_COUNTY || 'Harris';
                        const city = props.SITE_CITY || props.SITUS_CITY || '';
                        const zipCode = props.SITE_ZIP || props.SITUS_ZIP || '';
                        const zoning = props.ZONING || props.ZONE_CLASS || '';

                        // Display address: prefer situs, fallback to "Parcel #ID"
                        const displayAddress = situsAddress || `Parcel #${parcelId}`;

                        // Update form with parcel data
                        setFormData(prev => ({
                          ...prev,
                          propertyAddress: displayAddress,
                          parcelId: parcelId,
                          geoLat: centroidLat,
                          geoLng: centroidLng,
                          lotSize: acreage ? String(acreage) : prev.lotSize,
                          lotSizeUnit: acreage ? 'acres' : prev.lotSizeUnit,
                          county: county,
                          city: city,
                          zipCode: zipCode,
                          zoning: zoning || prev.zoning,
                          parcelOwner: ownerName,
                          situsAddress: situsAddress
                        }));

                        // Mark parcel-sourced fields as enriched
                        setEnrichedFields(prev => ({
                          ...prev,
                          parcelId: !!parcelId,
                          lotSize: !!acreage,
                          county: !!county,
                          city: !!city,
                          zipCode: !!zipCode,
                          zoning: !!zoning
                        }));

                        // Store HCAD values for conflict detection
                        setHcadValues({
                          parcelId: parcelId,
                          lotSize: acreage ? String(acreage) : undefined,
                          zoning: zoning
                        });
                        toast({
                          title: "Parcel Selected ✅",
                          description: `${displayAddress} (${acreage || '?'} acres)`
                        });

                        // Auto-unlock parcel fields after brief delay
                        setTimeout(() => {
                          setUnlockedFields(prev => ({
                            ...prev,
                            parcelId: true,
                            lotSize: true,
                            county: true,
                            city: true,
                            zipCode: true,
                            zoning: true
                          }));
                        }, 1500);
                      }} onEnrichmentComplete={data => {
                        if (data?.success && data?.data) {
                          setEnrichedData(data.data);
                          // Resolve lot size from multiple possible sources
                          const lotSizeFromApiMetaSqft = data?.api_meta?.hcad_parcel?.parcel_data?.land_sqft;
                          const resolvedLotSize = typeof data.data.lot_size_value === 'number' && data.data.lot_size_value || typeof data.data.acreage_cad === 'number' && data.data.acreage_cad || (typeof lotSizeFromApiMetaSqft === 'number' ? +(lotSizeFromApiMetaSqft / 43560).toFixed(4) : undefined);
                          console.log('[Enrichment] Lot size candidates:', {
                            lot_size_value: data.data.lot_size_value,
                            acreage_cad: data.data.acreage_cad,
                            land_sqft: lotSizeFromApiMetaSqft,
                            resolvedLotSize
                          });

                          // Auto-fill both visible and hidden enriched fields
                          setFormData(prev => {
                            return {
                              ...prev,
                              // Visible fields
                              parcelId: data.data.parcel_id || prev.parcelId,
                              zoning: data.data.zoning_code || prev.zoning,
                              lotSize: typeof resolvedLotSize === 'number' ? String(resolvedLotSize) : prev.lotSize,
                              lotSizeUnit: data.data.lot_size_unit as string || prev.lotSizeUnit,
                              // Hidden enriched fields
                              situsAddress: data.data.situs_address || prev.situsAddress,
                              administrativeAreaLevel2: data.data.administrative_area_level_2 || prev.administrativeAreaLevel2,
                              parcelOwner: data.data.parcel_owner || prev.parcelOwner,
                              acreageCad: data.data.acreage_cad || prev.acreageCad,
                              zoningCode: data.data.zoning_code || prev.zoningCode,
                              overlayDistrict: data.data.overlay_district || prev.overlayDistrict,
                              floodplainZone: data.data.floodplain_zone || prev.floodplainZone,
                              baseFloodElevation: data.data.base_flood_elevation || prev.baseFloodElevation
                            };
                          });

                          // Mark which fields were successfully enriched
                          setEnrichedFields(prev => ({
                            ...prev,
                            // Preserve Google-populated field flags
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
                              description: "Some fields could not be auto-filled. You can proceed with manual entry."
                            });
                          } else {
                            toast({
                              title: "GIS Data Loaded ✅",
                              description: "Property information has been automatically filled from public records."
                            });
                          }
                        } else if (!data?.success) {
                          toast({
                            title: "Auto-fill unavailable",
                            description: data?.error || "Unable to load GIS data for this location."
                          });
                        }
                      }} placeholder="123 Main Street, City, State, ZIP" label="Property Address" error={errors.propertyAddress} errors={errors} isAddressLoading={isAddressLoading} required={true} />
                           
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
                                <Input id="county" value={formData.county} onChange={e => handleInputChange('county', e.target.value)} placeholder="Enter county" className="mt-2" readOnly={isAddressLoading || enrichedFields.county && !unlockedFields.county} />
                                {isAddressLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>}
                              </div>
                {enrichedFields.county && !isAddressLoading && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    ✓ Auto-filled
                  </Badge>}
                            </div>

                            <div>
                              <Label htmlFor="city" className="font-body font-semibold text-charcoal">
                                City
                              </Label>
                              <div className="relative">
                                <Input id="city" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} placeholder="Enter city" className="mt-2" readOnly={isAddressLoading || enrichedFields.city && !unlockedFields.city} />
                                {isAddressLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>}
                              </div>
                {enrichedFields.city && !isAddressLoading && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    ✓ Auto-filled
                  </Badge>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="state" className="font-body font-semibold text-charcoal">
                                State
                              </Label>
                              <div className="relative">
                                <Input id="state" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} placeholder="TX" className="mt-2" readOnly={isAddressLoading || enrichedFields.state && !unlockedFields.state} />
                                {isAddressLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>}
                              </div>
                {enrichedFields.state && !isAddressLoading && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    ✓ Auto-filled
                  </Badge>}
                            </div>

                            <div>
                              <Label htmlFor="zipCode" className="font-body font-semibold text-charcoal">
                                ZIP Code
                              </Label>
                              <div className="relative">
                                <Input id="zipCode" value={formData.zipCode} onChange={e => handleInputChange('zipCode', e.target.value)} placeholder="77069" className="mt-2" readOnly={isAddressLoading || enrichedFields.zipCode && !unlockedFields.zipCode} />
                                {isAddressLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>}
                              </div>
                {enrichedFields.zipCode && !isAddressLoading && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    ✓ Auto-filled
                  </Badge>}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="neighborhood" className="font-body font-semibold text-charcoal">
                              Neighborhood / Area
                            </Label>
                            <div className="relative">
                              <Input id="neighborhood" value={formData.neighborhood} onChange={e => handleInputChange('neighborhood', e.target.value)} placeholder="Enter neighborhood" className="mt-2" readOnly={isAddressLoading || enrichedFields.neighborhood && !unlockedFields.neighborhood} />
                              {isAddressLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>}
                            </div>
                {enrichedFields.neighborhood && !isAddressLoading && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    ✓ Auto-filled
                  </Badge>}
                            <p className="text-sm text-charcoal/60 mt-1">
                              Helps determine local market conditions and comparable properties.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="parcelId" className="font-body font-semibold text-charcoal">
                                Parcel ID / APN
                              </Label>
                              <Input id="parcelId" value={formData.parcelId} onChange={e => handleInputChange('parcelId', e.target.value)} placeholder={enrichedFields.parcelId && !unlockedFields.parcelId ? "Auto-filled" : "123-456-789"} className="mt-2" readOnly={enrichedFields.parcelId && !unlockedFields.parcelId} />
                {enrichedFields.parcelId && <div className="flex items-center gap-2 mt-1">
                    {!unlockedFields.parcelId ? <>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          ✓ Auto-filled
                        </Badge>
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                setUnlockedFields(prev => ({
                                  ...prev,
                                  parcelId: true
                                }));
                                toast({
                                  title: "Manual Override Enabled",
                                  description: "You can now edit the Parcel ID."
                                });
                              }} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                                    </> : <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>}
                                </div>}
                              <p className="text-sm text-charcoal/60 mt-1">
                                Official parcel identifier helps verify property boundaries and records.
                              </p>
                            </div>

                            <div>
                              <Label className="font-body font-semibold text-charcoal">
                                Lot Size / Acreage
                              </Label>
                              <div className="flex gap-2 mt-2">
                                <Input value={formData.lotSize} onChange={e => handleInputChange('lotSize', e.target.value)} placeholder={enrichedFields.lotSize && !unlockedFields.lotSize ? "Auto-filled" : "5.2"} className={`${errors.lotSize ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'}`} readOnly={enrichedFields.lotSize && !unlockedFields.lotSize} />
                <Select value={formData.lotSizeUnit} onValueChange={value => handleInputChange('lotSizeUnit', value)} disabled={enrichedFields.lotSize && !unlockedFields.lotSize}>
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
              {enrichedFields.lotSize && <div className="flex items-center gap-2 mt-1">
                  {!unlockedFields.lotSize ? <>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        ✓ Auto-filled
                      </Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => {
                                setUnlockedFields(prev => ({
                                  ...prev,
                                  lotSize: true
                                }));
                                toast({
                                  title: "Manual Override Enabled",
                                  description: "You can now edit the Lot Size."
                                });
                              }} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                                    </> : <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>}
                                </div>}
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
                            <Select value={formData.currentUse} onValueChange={value => handleInputChange('currentUse', value)}>
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
                              <Input id="zoning" value={formData.zoning} onChange={e => handleInputChange('zoning', e.target.value)} placeholder={enrichedFields.zoning && !unlockedFields.zoning ? "Auto-filled" : "C-2, R-3, M-1, etc."} className="mt-2" readOnly={enrichedFields.zoning && !unlockedFields.zoning} />
                {enrichedFields.zoning && <div className="flex items-center gap-2 mt-1">
                    {!unlockedFields.zoning ? <>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          ✓ Auto-filled
                        </Badge>
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                setUnlockedFields(prev => ({
                                  ...prev,
                                  zoning: true
                                }));
                                toast({
                                  title: "Manual Override Enabled",
                                  description: "You can now edit the Zoning."
                                });
                              }} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                                    </> : <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      ⚠️ Manual Override
                                    </Badge>}
                                </div>}
                              <p className="text-sm text-charcoal/60 mt-1">
                                Zoning determines allowed uses and development requirements.
                              </p>
                            </div>
                           </div>
                           
                           {/* Interactive Map for Parcel Drawing */}
                          {formData.geoLat && formData.geoLng && <Card className="mt-6">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5 text-primary" />
                                  Draw Parcel Boundary (Optional)
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  Draw your parcel boundary on the map for enhanced site visualization in your report.
                                </p>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <MapLibreCanvas center={[formData.geoLat, formData.geoLng]} zoom={17} drawingEnabled={drawingMode} onParcelDrawn={handleDrawingComplete} drawnParcels={drawnGeometry ? [{
                            id: 'temp',
                            name: formData.drawnParcelName || 'Your Parcel',
                            geometry: drawnGeometry,
                            acreage_calc: 0
                          }] : []} className="h-[500px] w-full rounded-lg" />
                                
                                <DrawParcelControl drawingActive={drawingMode} onToggleDrawing={() => setDrawingMode(!drawingMode)} onSaveParcel={handleSaveParcel} onCancelDrawing={handleCancelDrawing} isSaving={isSavingParcel} />
                                
                                {drawnGeometry && <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle>Parcel Boundary Saved</AlertTitle>
                                    <AlertDescription>
                                      Your parcel boundary will be included in the site visualization.
                                    </AlertDescription>
                                  </Alert>}
                              </CardContent>
                            </Card>}
                        </div>}

                      {/* Step 2: Building Details (What Do You Want to Build?) */}
                      {currentStep === 2 && <div className="space-y-6 animate-fade-in">
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
                                    {formData.projectType.some(type => ['shopping_center', 'strip_mall', 'big_box', 'grocery_specialty'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['shopping_center', 'strip_mall', 'big_box', 'grocery_specialty'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'shopping_center',
                                  label: 'Shopping Center'
                                }, {
                                  value: 'strip_mall',
                                  label: 'Strip Mall'
                                }, {
                                  value: 'big_box',
                                  label: 'Big Box / Anchor Store'
                                }, {
                                  value: 'grocery_specialty',
                                  label: 'Grocery / Specialty Retail'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Hospitality */}
                              <AccordionItem value="hospitality" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏨 Hospitality
                                    {formData.projectType.some(type => ['hotel', 'resort', 'restaurant_qsr', 'entertainment_venue', 'casino_gaming'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['hotel', 'resort', 'restaurant_qsr', 'entertainment_venue', 'casino_gaming'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'hotel',
                                  label: 'Hotel'
                                }, {
                                  value: 'resort',
                                  label: 'Resort'
                                }, {
                                  value: 'restaurant_qsr',
                                  label: 'Restaurant / QSR'
                                }, {
                                  value: 'entertainment_venue',
                                  label: 'Entertainment Venue / Theater'
                                }, {
                                  value: 'casino_gaming',
                                  label: 'Casino / Gaming Facility'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Healthcare */}
                              <AccordionItem value="healthcare" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏥 Healthcare
                                    {formData.projectType.some(type => ['medical_office_building', 'hospital', 'urgent_care_clinic', 'specialty_clinic', 'ambulatory_surgery_center', 'rehabilitation_center'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['medical_office_building', 'hospital', 'urgent_care_clinic', 'specialty_clinic', 'ambulatory_surgery_center', 'rehabilitation_center'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'medical_office_building',
                                  label: 'Medical Office Building (MOB)'
                                }, {
                                  value: 'hospital',
                                  label: 'Hospital'
                                }, {
                                  value: 'urgent_care_clinic',
                                  label: 'Urgent Care / Clinic'
                                }, {
                                  value: 'specialty_clinic',
                                  label: 'Specialty Clinic (Dental, Dialysis, Surgery Center)'
                                }, {
                                  value: 'ambulatory_surgery_center',
                                  label: 'Ambulatory Surgery Center'
                                }, {
                                  value: 'rehabilitation_center',
                                  label: 'Rehabilitation Center'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Industrial */}
                              <AccordionItem value="industrial" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏭 Industrial
                                    {formData.projectType.some(type => ['warehouse', 'manufacturing_facility', 'flex_industrial', 'rd_facility'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['warehouse', 'manufacturing_facility', 'flex_industrial', 'rd_facility'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'warehouse',
                                  label: 'Warehouse'
                                }, {
                                  value: 'manufacturing_facility',
                                  label: 'Manufacturing Facility'
                                }, {
                                  value: 'flex_industrial',
                                  label: 'Flex Industrial'
                                }, {
                                  value: 'rd_facility',
                                  label: 'R&D Facility'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Logistics */}
                              <AccordionItem value="logistics" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🚚 Logistics
                                    {formData.projectType.some(type => ['distribution_center', 'last_mile_facility', 'cold_storage_facility', 'data_center', 'trucking_terminal'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['distribution_center', 'last_mile_facility', 'cold_storage_facility', 'data_center', 'trucking_terminal'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'distribution_center',
                                  label: 'Distribution Center'
                                }, {
                                  value: 'last_mile_facility',
                                  label: 'Last-Mile Facility'
                                }, {
                                  value: 'cold_storage_facility',
                                  label: 'Cold Storage Facility'
                                }, {
                                  value: 'data_center',
                                  label: 'Data Center'
                                }, {
                                  value: 'trucking_terminal',
                                  label: 'Trucking Terminal'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Office */}
                              <AccordionItem value="office" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏢 Office
                                    {formData.projectType.some(type => ['office_class_a', 'office_class_b', 'office_class_c', 'corporate_headquarters', 'coworking_flex_office', 'call_center_operations'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['office_class_a', 'office_class_b', 'office_class_c', 'corporate_headquarters', 'coworking_flex_office', 'call_center_operations'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'office_class_a',
                                  label: 'Office Class A'
                                }, {
                                  value: 'office_class_b',
                                  label: 'Office Class B'
                                }, {
                                  value: 'office_class_c',
                                  label: 'Office Class C'
                                }, {
                                  value: 'corporate_headquarters',
                                  label: 'Corporate Headquarters / Campus'
                                }, {
                                  value: 'coworking_flex_office',
                                  label: 'Coworking / Flex Office'
                                }, {
                                  value: 'call_center_operations',
                                  label: 'Call Center / Operations'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Mixed-Use */}
                              <AccordionItem value="mixed-use" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏗 Mixed-Use
                                    {formData.projectType.some(type => ['mixed_use_retail_residential', 'mixed_use_office_residential', 'mixed_use_retail_office'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['mixed_use_retail_residential', 'mixed_use_office_residential', 'mixed_use_retail_office'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'mixed_use_retail_residential',
                                  label: 'Mixed-Use (Retail + Residential)'
                                }, {
                                  value: 'mixed_use_office_residential',
                                  label: 'Mixed-Use (Office + Residential)'
                                }, {
                                  value: 'mixed_use_retail_office',
                                  label: 'Mixed-Use (Retail + Office)'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Specialty */}
                              <AccordionItem value="specialty" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🎯 Specialty
                                    {formData.projectType.some(type => ['self_storage', 'automotive_dealership', 'car_wash', 'gas_station_convenience', 'educational_facility', 'religious_institutional', 'civic_community_recreational', 'research_lab_life_sciences', 'sports_facility_arena', 'agricultural_agri_tech', 'performing_arts_center', 'stadium_arena'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['self_storage', 'automotive_dealership', 'car_wash', 'gas_station_convenience', 'educational_facility', 'religious_institutional', 'civic_community_recreational', 'research_lab_life_sciences', 'sports_facility_arena', 'agricultural_agri_tech', 'performing_arts_center', 'stadium_arena'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[{
                                  value: 'self_storage',
                                  label: 'Self Storage'
                                }, {
                                  value: 'automotive_dealership',
                                  label: 'Automotive Dealership'
                                }, {
                                  value: 'car_wash',
                                  label: 'Car Wash'
                                }, {
                                  value: 'gas_station_convenience',
                                  label: 'Gas Station / Convenience Store'
                                }, {
                                  value: 'educational_facility',
                                  label: 'Educational / School / Training Facility'
                                }, {
                                  value: 'religious_institutional',
                                  label: 'Religious / Institutional Facility'
                                }, {
                                  value: 'civic_community_recreational',
                                  label: 'Civic / Community / Recreational Center'
                                }, {
                                  value: 'research_lab_life_sciences',
                                  label: 'Research / Lab / Life Sciences'
                                }, {
                                  value: 'sports_facility_arena',
                                  label: 'Sports Facility / Arena'
                                }, {
                                  value: 'agricultural_agri_tech',
                                  label: 'Agricultural / Agri-Tech Facility'
                                }, {
                                  value: 'performing_arts_center',
                                  label: 'Performing Arts Center'
                                }, {
                                  value: 'stadium_arena',
                                  label: 'Stadium / Arena'
                                }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                    handleMultiSelectChange('projectType', option.value, !!checked);
                                  }} />
                                        <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>)}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* Other */}
                              <AccordionItem value="other" className="border border-charcoal/20 rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 font-medium">
                                    🏷 Other
                                    {formData.projectType.some(type => ['franchise_prototype', 'custom_build_to_suit', 'other'].includes(type)) && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {formData.projectType.filter(type => ['franchise_prototype', 'custom_build_to_suit', 'other'].includes(type)).length} selected
                                      </span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {[{
                                    value: 'franchise_prototype',
                                    label: 'Franchise Prototype (Custom)'
                                  }, {
                                    value: 'custom_build_to_suit',
                                    label: 'Custom Build-to-Suit'
                                  }, {
                                    value: 'other',
                                    label: 'Other'
                                  }].map(option => <div key={option.value} className="flex items-center space-x-2">
                                          <Checkbox id={`projectType-${option.value}`} checked={formData.projectType.includes(option.value)} onCheckedChange={checked => {
                                      handleMultiSelectChange('projectType', option.value, !!checked);
                                    }} />
                                          <Label htmlFor={`projectType-${option.value}`} className="text-sm cursor-pointer">
                                            {option.label}
                                          </Label>
                                        </div>)}
                                    </div>
                                    
                                    {/* Other text input */}
                                    {formData.projectType.includes('other') && <div className="mt-3">
                                        <Input placeholder="Please specify other project type..." value={formData.projectTypeOther || ''} onChange={e => handleInputChange('projectTypeOther', e.target.value)} className="max-w-md" />
                                      </div>}
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
                              <Input value={formData.buildingSize} onChange={e => handleInputChange('buildingSize', e.target.value)} placeholder="e.g., 50000 or 'Maximum Possible' or 'Don't Know'" className="border-charcoal/20" />
                               <Select value={formData.buildingSizeUnit} onValueChange={value => handleInputChange('buildingSizeUnit', value)}>
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
                              <Select value={formData.stories} onValueChange={value => handleInputChange('stories', value)}>
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
                            <Input id="buildingHeight" value={formData.buildingHeight} onChange={e => handleInputChange('buildingHeight', e.target.value)} placeholder="e.g., 120 feet or 'Don't Know'" className="mt-2 border-charcoal/20" />
                            <p className="text-sm text-charcoal/60 mt-1">
                              Total building height including roofing and mechanical equipment.
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="prototypeRequirements" className="font-body font-semibold text-charcoal">
                              Prototype Requirements
                            </Label>
                            <Textarea id="prototypeRequirements" value={formData.prototypeRequirements} onChange={e => handleInputChange('prototypeRequirements', e.target.value)} placeholder="Describe any specific prototype or franchise requirements..." className="mt-2" rows={3} />
                             <p className="text-sm text-charcoal/60 mt-1">
                               Prototype requirements affect design flexibility and approval process.
                             </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="qualityLevel" className="font-body font-semibold text-charcoal">
                                 Quality Level
                               </Label>
                              <Select value={formData.qualityLevel} onValueChange={value => handleInputChange('qualityLevel', value)}>
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
                              <Input id="budget" value={formData.budget ? formatCurrency(formData.budget) : ''} onChange={handleBudgetChange} placeholder="25,000,000" className="pl-7 border-charcoal/20" />
                            </div>
                            <p className="text-sm text-charcoal/60 mt-1">
                              Approximate total project budget (land + construction + soft costs). Leave blank if unknown.
                            </p>
                          </div>
                          </div>
                        </div>}

                      {/* Step 3: Additional Context */}
                      {currentStep === 3 && <div className="space-y-6 animate-fade-in">

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Access Priorities
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select all that are important for your project</p>
                            {renderMultiSelectCheckboxes('accessPriorities', ['Highway', 'Transit', 'Airport', 'Hospital', 'University', 'Population Density', 'Employment Center', 'Retail Corridor', 'Tourism', 'Port/Logistics', 'Other', 'Not Sure'], formData.accessPriorities)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Access priorities help evaluate location advantages and tenant appeal.
                             </p>
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Known Risks
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select any known or potential risks</p>
                            {renderMultiSelectCheckboxes('knownRisks', ['Floodplain', 'Easements', 'Soil/Geotech', 'Legal/Title', 'Topography', 'Drainage', 'Political Opposition', 'Other', 'Not Sure'], formData.knownRisks)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Known risks help prioritize due diligence and budget contingencies.
                             </p>
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Utility Access
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select available utilities</p>
                            {renderMultiSelectCheckboxes('utilityAccess', ['Water', 'Sewer', 'Power', 'Gas', 'Fiber', 'Stormwater', 'Not Sure'], formData.utilityAccess)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Utility availability affects infrastructure costs and development timeline.
                             </p>
                          </div>

                          <div>
                            <Label className="font-body font-semibold text-charcoal">
                              Environmental Constraints
                            </Label>
                            <p className="text-sm text-charcoal/60 mb-3">Select any environmental concerns</p>
                            {renderMultiSelectCheckboxes('environmentalConstraints', ['Wetlands', 'Brownfield', 'Protected Land', 'Endangered Species', 'Historic Site', 'Air Quality', 'Noise', 'Other', 'Not Sure'], formData.environmentalConstraints)}
                             <p className="text-sm text-charcoal/60 mt-1">
                               Environmental factors impact permitting requirements and project costs.
                             </p>
                          </div>

                          <div>
                            <Label htmlFor="tenantRequirements" className="font-body font-semibold text-charcoal">
                              Tenant / Prototype Requirements
                            </Label>
                            <Textarea id="tenantRequirements" value={formData.tenantRequirements} onChange={e => handleInputChange('tenantRequirements', e.target.value)} placeholder="Describe any specific tenant requirements, franchise standards, or operational needs..." className="mt-2" rows={3} />
                             <p className="text-sm text-charcoal/60 mt-1">
                               Tenant requirements guide space planning and operational considerations.
                             </p>
                          </div>
                        </div>}

                      {/* Step 4: Final Questions & Review */}
                      {currentStep === 4 && <div className="space-y-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <Label htmlFor="hearAboutUs" className="font-body font-semibold text-charcoal flex items-center gap-1">
                                  How Did You Hear About Us?
                                </Label>
                              <Select value={formData.hearAboutUs} onValueChange={value => handleInputChange('hearAboutUs', value)}>
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
                              <Select value={formData.contactMethod} onValueChange={value => handleInputChange('contactMethod', value)}>
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
                            <Select value={formData.bestTime} onValueChange={value => handleInputChange('bestTime', value)}>
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
                            <Textarea id="additionalNotes" value={formData.additionalNotes} onChange={e => handleInputChange('additionalNotes', e.target.value)} placeholder="Any additional information that would help us better understand your project..." className="mt-2" rows={4} />
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
                                <Input type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.dwg,.zip" onChange={handleFileUpload} className="hidden" id="file-upload" />
                                <Label htmlFor="file-upload" className="cursor-pointer text-navy hover:text-navy/80 font-semibold">
                                  Click to upload files
                                </Label>
                              </div>
                              {uploadedFiles.length > 0 && <div className="mt-4 space-y-2">
                                  {uploadedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{file.name}</span>
                                    </div>)}
                                </div>}
                            </div>
                          </div>

                          {/* Consent Checkboxes */}
                          <div className="space-y-4 pt-6 border-t border-charcoal/20">
                            <div className="flex items-start space-x-3">
                              <Checkbox id="nda-consent" checked={formData.ndaConsent} onCheckedChange={checked => handleInputChange('ndaConsent', checked as boolean)} className={errors.ndaConsent ? 'border-maxx-red' : ''} />
                               <Label htmlFor="nda-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                 I agree to maintain confidentiality and acknowledge that an NDA may be required for detailed project discussions. <span className="text-maxx-red text-lg">*</span>
                               </Label>
                            </div>
                            {errors.ndaConsent && <p className="text-maxx-red text-sm">{errors.ndaConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox id="contact-consent" checked={formData.contactConsent} onCheckedChange={checked => handleInputChange('contactConsent', checked as boolean)} className={errors.contactConsent ? 'border-maxx-red' : ''} />
                               <Label htmlFor="contact-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                 I consent to be contacted by SiteIntel™ regarding my feasibility application and project. <span className="text-maxx-red text-lg">*</span>
                               </Label>
                            </div>
                            {errors.contactConsent && <p className="text-maxx-red text-sm">{errors.contactConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox id="privacy-consent" checked={formData.privacyConsent} onCheckedChange={checked => handleInputChange('privacyConsent', checked as boolean)} className={errors.privacyConsent ? 'border-maxx-red' : ''} />
                               <Label htmlFor="privacy-consent" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                 I agree to the Privacy Policy and Terms of Service. <span className="text-maxx-red text-lg">*</span>
                               </Label>
                            </div>
                            {errors.privacyConsent && <p className="text-maxx-red text-sm">{errors.privacyConsent}</p>}

                            <div className="flex items-start space-x-3">
                              <Checkbox id="marketing-opt-in" checked={formData.marketingOptIn} onCheckedChange={checked => handleInputChange('marketingOptIn', checked as boolean)} />
                              <Label htmlFor="marketing-opt-in" className="text-sm font-body text-charcoal leading-relaxed cursor-pointer">
                                I would like to receive marketing communications and industry insights from SiteIntel™.
                              </Label>
                            </div>
                          </div>
                        </div>}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-12 pt-8 border-t border-charcoal/20">
                        {currentStep > 0 && currentStep !== 1 ? <Button type="button" variant="outline" onClick={handlePrev} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                          </Button> : currentStep === 1 ? <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Contact information secured
                          </div> : <div />}

                        {currentStep < totalSteps ? <div className="flex flex-col items-end gap-2">
                            <Button type="button" onClick={handleNext} className="bg-maxx-red hover:bg-maxx-red/90 text-white flex items-center gap-2">
                              Next
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                            {currentStep === 1 && !formData.propertyAddress && <p className="text-xs text-charcoal/60">
                                Complete all required fields to continue
                              </p>}
                          </div> : <Button type="submit" disabled={isLoading} className="bg-maxx-red hover:bg-maxx-red/90 text-white flex items-center gap-2">
                            {isLoading ? "Submitting..." : "Submit My Application"}
                            <ArrowRight className="w-4 h-4" />
                          </Button>}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Trust & Risk Reversal Sidebar */}
              
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
          
          {currentStep < totalSteps ? <Button onClick={handleNext} className="bg-maxx-red hover:bg-maxx-red/90 text-white">
              Next
            </Button> : <Button onClick={handleSubmit} disabled={isLoading} className="bg-maxx-red hover:bg-maxx-red/90 text-white">
              {isLoading ? "Submitting..." : "Submit"}
            </Button>}
        </div>
      </div>
    </div>;
}