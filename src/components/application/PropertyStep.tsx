import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyStepProps {
  formData: {
    intentType: 'build' | 'buy' | '';
    propertyAddress: string;
    ownershipStatus: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (address: any) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
}

export function PropertyStep({ 
  formData, 
  onChange, 
  onAddressSelect, 
  errors,
  isAddressLoading 
}: PropertyStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>
      
      <div className="space-y-2">
        <Label htmlFor="intentType" className="text-base">
          What best describes your goal for this property? <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          value={formData.intentType}
          onValueChange={(value) => onChange('intentType', value)}
        >
          <SelectTrigger 
            id="intentType" 
            className="touch-target"
            aria-invalid={!!errors.intentType}
            aria-describedby={errors.intentType ? "intent-error" : undefined}
          >
            <SelectValue placeholder="Select your primary goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="build">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                <div>
                  <div className="font-semibold">Build / Develop</div>
                  <div className="text-xs text-muted-foreground">
                    New construction, ground-up development, or site improvements
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="buy">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-semibold">Buy / Invest</div>
                  <div className="text-xs text-muted-foreground">
                    Purchase for investment, leasing, or portfolio acquisition
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.intentType && (
          <p id="intent-error" className="text-sm text-destructive" role="alert">
            {errors.intentType}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <AddressAutocomplete
          value={formData.propertyAddress}
          onChange={onAddressSelect}
          label="Property Address"
          required
          className="touch-target"
          error={errors.propertyAddress}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownershipStatus" className="text-base">
          Ownership Status <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          value={formData.ownershipStatus}
          onValueChange={(value) => onChange('ownershipStatus', value)}
        >
          <SelectTrigger 
            id="ownershipStatus" 
            className="touch-target"
            aria-invalid={!!errors.ownershipStatus}
            aria-describedby={errors.ownershipStatus ? "ownership-error" : undefined}
          >
            <SelectValue placeholder="Select ownership status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owned">I own this property</SelectItem>
            <SelectItem value="under-contract">Under contract</SelectItem>
            <SelectItem value="prospecting">Prospecting</SelectItem>
          </SelectContent>
        </Select>
        {errors.ownershipStatus && (
          <p id="ownership-error" className="text-sm text-destructive" role="alert">
            {errors.ownershipStatus}
          </p>
        )}
      </div>
    </fieldset>
  );
}
