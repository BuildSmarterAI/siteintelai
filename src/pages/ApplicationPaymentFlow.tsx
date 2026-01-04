import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ParcelSelectionGate } from "@/components/application/ParcelSelectionGate";
import { PaymentGate } from "@/components/payment/PaymentGate";
import { ApplicationProgress } from "@/components/application/ApplicationProgress";
import type { SelectedParcel } from "@/types/parcelSelection";
import * as turf from '@turf/turf';

type FlowStep = "property" | "payment";

export default function ApplicationPaymentFlow() {
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
  const [, setIsCreatingApplication] = useState(false);
  
  // Form data for property step
  const [formData, setFormData] = useState({
    propertyAddress: "",
    geoLat: undefined as number | undefined,
    geoLng: undefined as number | undefined,
    parcelGeometry: null as GeoJSON.Geometry | null,
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

  

  // Handle locked parcel from ParcelSelectionGate
  const handleParcelLocked = useCallback(async (parcel: SelectedParcel) => {
    // Calculate centroid from geometry
    let lat: number | undefined;
    let lng: number | undefined;

    if (parcel.geom) {
      const centroid = turf.centroid(parcel.geom);
      [lng, lat] = centroid.geometry.coordinates;
    }

    // Update form data with locked parcel info
    setFormData(prev => ({
      ...prev,
      propertyAddress: parcel.situs_address || prev.propertyAddress,
      geoLat: lat,
      geoLng: lng,
      parcelGeometry: parcel.geom || null,
      parcelId: parcel.parcel_id || '',
      lotSize: parcel.acreage ? String(parcel.acreage) : prev.lotSize,
      parcelOwner: parcel.owner_name || prev.parcelOwner,
      zoning: parcel.zoning || prev.zoning,
      county: parcel.county || prev.county,
    }));

    // Create application and proceed to payment
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || formData.email;

    if (!email) {
      // For guests, proceed to payment where email will be collected
      setCurrentStep("payment");
      return;
    }

    setIsCreatingApplication(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-guest-application', {
        body: {
          propertyAddress: parcel.situs_address || formData.propertyAddress,
          geoLat: lat,
          geoLng: lng,
          email: email,
          parcelId: parcel.parcel_id,
          lotSize: parcel.acreage ? String(parcel.acreage) : formData.lotSize,
          lotSizeUnit: formData.lotSizeUnit,
          parcelOwner: parcel.owner_name,
          zoning: parcel.zoning,
          county: parcel.county,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          neighborhood: formData.neighborhood,
          parcelGeometry: parcel.geom || null, // Pass parcel geometry to backend
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
        toast.success("Property verified. Continue to checkout.");
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
          parcelGeometry: formData.parcelGeometry, // Pass parcel geometry to backend
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
    property: "Find your property",
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
        stepLabels={["Property", "Checkout"]}
        isDraftSaving={false}
        lastSaved={null}
      />

      {/* Property Step - ParcelSelectionGate */}
      {currentStep === "property" && (
        <ParcelSelectionGate
          onParcelLocked={handleParcelLocked}
          initialAddress={formData.propertyAddress}
          initialCoords={formData.geoLat && formData.geoLng ? {
            lat: formData.geoLat,
            lng: formData.geoLng
          } : undefined}
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
          parcelGeometry={formData.parcelGeometry}
          onEmailProvided={handleEmailProvided}
          onPaymentInitiated={() => {
            toast.success("Redirecting to checkout...");
          }}
          onChangeAddress={() => {
            setCurrentStep("property");
            setApplicationId(null);
          }}
        />
      )}
    </div>
  );
}
