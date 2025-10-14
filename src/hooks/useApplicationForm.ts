import { useState, useCallback } from 'react';

export interface ApplicationFormData {
  // Step 1: Contact Information
  fullName: string;
  company: string;
  email: string;
  phone: string;
  
  // Step 2: Property Information
  propertyAddress: string;
  parcelId: string;
  lotSize: string;
  lotSizeUnit: string;
  currentUse: string;
  zoning: string;
  ownershipStatus: string;
  geoLat: number | null;
  geoLng: number | null;
  county: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  sublocality: string;
  placeId: string;
  
  // Step 3: Project Intent & Building Parameters
  projectType: string[];
  projectTypeOther: string;
  buildingSize: string;
  buildingSizeUnit: string;
  stories: string;
  buildingHeight: string;
  prototypeRequirements: string;
  qualityLevel: string;
  budget: string;
  
  // Step 4: Market & Risks
  submarket: string;
  accessPriorities: string[];
  knownRisks: string[];
  utilityAccess: string[];
  environmentalConstraints: string[];
  tenantRequirements: string;
  
  // Step 5: Final Questions
  hearAboutUs: string;
  contactMethod: string;
  bestTime: string;
  additionalNotes: string;
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
  propertyAddress: "",
  parcelId: "",
  lotSize: "",
  lotSizeUnit: "acres",
  currentUse: "",
  zoning: "",
  ownershipStatus: "",
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
      if (!formData.ownershipStatus) newErrors.ownershipStatus = "Ownership status is required";
    }

    if (step === 3) {
      // All fields optional
    }

    if (step === 4) {
      // All fields optional
    }

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
      console.log('[Form Update]', field, '=', value);
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
