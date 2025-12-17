import { useState, useCallback } from 'react';

export interface ApplicationFormData {
  // Step 0: Contact Information
  fullName: string;
  company: string;
  email: string;
  phone: string;
  
  // Step 1: Property Information
  intentType: 'build' | 'buy' | ''; // Always 'build' for feasibility
  propertyAddress: string;
  parcelId: string;
  lotSize: string;
  lotSizeUnit: string;
  currentUse: string;
  zoning: string;
  geoLat: number | null;
  geoLng: number | null;
  county: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  sublocality: string;
  placeId: string;
  
  // Step 2: Building Details (What Do You Want to Build?)
  projectType: string[];
  projectTypeOther: string;
  buildingSize: string;
  buildingSizeUnit: string;
  stories: string;
  buildingHeight: string;
  prototypeRequirements: string;
  qualityLevel: string;
  budget: string;
  // NEW: Enhanced building fields for cost/timeline estimation
  constructionType: string;
  parkingSpaces: string;
  parkingRatio: string;
  specialFeatures: string[];
  targetCompletionDate: string;
  
  // Step 3: Additional Context (Market & Risks)
  submarket: string;
  accessPriorities: string[];
  knownRisks: string[];
  utilityAccess: string[];
  environmentalConstraints: string[];
  tenantRequirements: string;
  
  // Step 4: Final Questions
  hearAboutUs: string;
  contactMethod: string;
  bestTime: string;
  additionalNotes: string;
  
  // Step 5: Review & Consent
  ndaConsent: boolean;
  contactConsent: boolean;
  privacyConsent: boolean;
  marketingOptIn: boolean;
  
  // Hidden tracking fields
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  pageUrl: string;
  submissionTimestamp: string;
  
  // Hidden GIS enriched fields
  situsAddress: string;
  administrativeAreaLevel2: string;
  parcelOwner: string;
  acreageCad: number | null;
  zoningCode: string;
  overlayDistrict: string;
  floodplainZone: string;
  baseFloodElevation: number | null;
  
  // Drawing tool data
  drawnParcelGeometry: any | null;
  drawnParcelName: string;
}

const initialFormData: ApplicationFormData = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  intentType: "build", // Always 'build' for feasibility reports
  propertyAddress: "",
  parcelId: "",
  lotSize: "",
  lotSizeUnit: "acres",
  currentUse: "",
  zoning: "",
  geoLat: null,
  geoLng: null,
  county: "",
  city: "",
  state: "",
  zipCode: "",
  neighborhood: "",
  sublocality: "",
  placeId: "",
  projectType: [],
  projectTypeOther: "",
  buildingSize: "",
  buildingSizeUnit: "sqft",
  stories: "",
  buildingHeight: "",
  prototypeRequirements: "",
  qualityLevel: "",
  budget: "",
  constructionType: "",
  parkingSpaces: "",
  parkingRatio: "",
  specialFeatures: [],
  targetCompletionDate: "",
  submarket: "",
  accessPriorities: [],
  knownRisks: [],
  utilityAccess: [],
  environmentalConstraints: [],
  tenantRequirements: "",
  hearAboutUs: "",
  contactMethod: "",
  bestTime: "",
  additionalNotes: "",
  ndaConsent: false,
  contactConsent: false,
  privacyConsent: false,
  marketingOptIn: false,
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  pageUrl: typeof window !== 'undefined' ? window.location.href : '',
  submissionTimestamp: "",
  situsAddress: "",
  administrativeAreaLevel2: "",
  parcelOwner: "",
  acreageCad: null,
  zoningCode: "",
  overlayDistrict: "",
  floodplainZone: "",
  baseFloodElevation: null,
  drawnParcelGeometry: null,
  drawnParcelName: "",
};

export function useApplicationForm() {
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    // Step 0: Contact Information
    if (step === 0) {
      if (!formData.fullName) newErrors.fullName = "Full name is required";
      if (!formData.company) newErrors.company = "Company is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    // Step 1: Property Information
    if (step === 1) {
      if (!formData.propertyAddress) newErrors.propertyAddress = "Property address is required";
    }

    // Step 2: Building Details (optional)
    if (step === 2) {
      // All fields optional
    }

    // Step 3: Additional Context (optional)
    if (step === 3) {
      // All fields optional
    }

    // Step 4: Final Questions (optional)
    if (step === 4) {
      // All fields optional
    }

    // Step 5: Review & Consent
    if (step === 5) {
      if (!formData.ndaConsent) newErrors.ndaConsent = "NDA consent is required";
      if (!formData.contactConsent) newErrors.contactConsent = "Contact consent is required";
      if (!formData.privacyConsent) newErrors.privacyConsent = "Privacy & Terms consent is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('[Form Update]', field, '=', value, '| Previous:', prev[field as keyof ApplicationFormData]);
      return updated;
    });
    
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateMultipleFields = useCallback((updates: Partial<ApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    formData,
    errors,
    updateField,
    updateMultipleFields,
    validateStep,
    setFormData,
    setErrors,
  };
}
