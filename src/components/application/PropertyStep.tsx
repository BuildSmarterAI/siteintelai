import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyStepProps {
  formData: {
    propertyAddress: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (value: any, coordinates: any, addressDetails: any) => void;
  onEnrichmentComplete?: (data: any) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function PropertyStep({ 
  formData, 
  onChange, 
  onAddressSelect, 
  onEnrichmentComplete,
  errors,
  isAddressLoading,
  placeholder = "123 Main Street, City, State, ZIP",
  label = "Property Address",
  required = true,
  error
}: PropertyStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>

      <div className="space-y-2">
        <AddressAutocomplete
          value={formData.propertyAddress}
          onChange={onAddressSelect}
          onEnrichmentComplete={onEnrichmentComplete}
          placeholder={placeholder}
          label={label}
          required={required}
          className="touch-target"
          error={error || errors.propertyAddress}
        />
      </div>
    </fieldset>
  );
}
