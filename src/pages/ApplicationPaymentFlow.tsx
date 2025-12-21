import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PropertyStepMapFirst } from "@/components/application/PropertyStepMapFirst";
import { PaymentGate } from "@/components/payment/PaymentGate";
import { ApplicationProgress } from "@/components/application/ApplicationProgress";
import * as turf from '@turf/turf';

type FlowStep = "property" | "payment";

export default function ApplicationPaymentFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check for canceled payment
  useEffect(() => {
    if (searchParams.get("payment") === "canceled") {
      toast.error("Payment was canceled. You can try again when ready.");
    }
  }, [searchParams]);

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>("property");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  
  // Form data for property step
  const [formData, setFormData] = useState({
    propertyAddress: "",
    geoLat: undefined as number | undefined,
    geoLng: undefined as number | undefined,
    parcelId: "",
    lotSize: "",
    lotSizeUnit: "acres",
    parcelOwner: "",
    zoning: "",
    county: "",
    city: "",
    state: "",
    zipCode: "",
    neighborhood: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Handle field changes
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  }, [errors]);

  // Handle address selection
  const handleAddressSelect = useCallback(async (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      propertyAddress: address,
      geoLat: lat,
      geoLng: lng
    }));
    setIsAddressLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-feasibility', {
        body: { lat, lng, formatted_address: address, mode: 'geocode_only' }
      });

      if (error) {
        console.error('[Enrichment Error]', error);
        toast.error("Could not load property details automatically");
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
        toast.success("Property data loaded");
      }
    } catch (err) {
      console.error('[Enrichment Error]', err);
    } finally {
      setIsAddressLoading(false);
    }
  }, []);

  // Handle parcel selection from map
  const handleParcelSelect = useCallback((parcel: any) => {
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
  }, []);

  // Continue to payment step - creates application first
  const handleContinueToPayment = useCallback(async () => {
    // Validate required field
    if (!formData.propertyAddress) {
      setErrors({ propertyAddress: "Please select a property address" });
      toast.error("Please select a property address");
      return;
    }

    // Check if email is needed (not authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || formData.email;

    if (!email) {
      // For guests, we'll collect email in the PaymentGate
      // Just proceed with a placeholder that will be updated
      setCurrentStep("payment");
      return;
    }

    setIsCreatingApplication(true);

    try {
      // Create the application
      const { data, error } = await supabase.functions.invoke('create-guest-application', {
        body: {
          propertyAddress: formData.propertyAddress,
          geoLat: formData.geoLat,
          geoLng: formData.geoLng,
          email: email,
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
        }
      });

      if (error) {
        console.error('[Create Application Error]', error);
        toast.error("Failed to create application");
        return;
      }

      if (data?.success && data?.application?.id) {
        setApplicationId(data.application.id);
        setCurrentStep("payment");
        toast.success("Property saved. Continue to checkout.");
      }
    } catch (err) {
      console.error('[Create Application Error]', err);
      toast.error("Something went wrong");
    } finally {
      setIsCreatingApplication(false);
    }
  }, [formData]);

  // Handle creating application when email is provided in PaymentGate
  const handleEmailProvided = useCallback(async (email: string) => {
    if (applicationId) return; // Already created

    setFormData(prev => ({ ...prev, email }));
    
    try {
      const { data, error } = await supabase.functions.invoke('create-guest-application', {
        body: {
          propertyAddress: formData.propertyAddress,
          geoLat: formData.geoLat,
          geoLng: formData.geoLng,
          email: email,
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
        }
      });

      if (data?.success && data?.application?.id) {
        setApplicationId(data.application.id);
      }
    } catch (err) {
      console.error('[Create Application Error]', err);
    }
  }, [applicationId, formData]);

  // Step titles for progress
  const stepTitles = {
    property: "Select Property",
    payment: "Checkout",
  };

  const stepNumber = currentStep === "property" ? 1 : 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <ApplicationProgress
        currentStep={stepNumber - 1}
        totalSteps={2}
        stepTitle={stepTitles[currentStep]}
        isDraftSaving={false}
        lastSaved={null}
      />

      {/* Property Step - Full Width Map */}
      {currentStep === "property" && (
        <PropertyStepMapFirst
          formData={formData}
          onChange={handleChange}
          onAddressSelect={handleAddressSelect}
          onParcelSelect={handleParcelSelect}
          onContinue={handleContinueToPayment}
          errors={errors}
          isAddressLoading={isAddressLoading || isCreatingApplication}
        />
      )}

      {/* Payment Step */}
      {currentStep === "payment" && (
        <PaymentGate
          applicationId={applicationId || "pending"}
          propertyAddress={formData.propertyAddress}
          coordinates={formData.geoLat && formData.geoLng ? {
            lat: formData.geoLat,
            lng: formData.geoLng
          } : undefined}
          onEmailProvided={handleEmailProvided}
          onPaymentInitiated={() => {
            toast.success("Redirecting to checkout...");
          }}
        />
      )}
    </div>
  );
}
