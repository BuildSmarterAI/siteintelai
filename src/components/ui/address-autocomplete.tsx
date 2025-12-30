import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from "@/lib/logger";
import { Input } from './input';
import { Label } from './label';
import { supabase } from '@/integrations/supabase/client';
import submarketMapping from '@/data/submarket-mapping.json';
import { toast } from 'sonner';
import { useAddressValidation, VALIDATION_ERRORS } from '@/hooks/useAddressValidation';
import { Check, AlertCircle } from 'lucide-react';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  // Nominatim provides these directly
  lat?: number;
  lng?: number;
  addressDetails?: {
    county?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    neighborhood?: string;
  };
  source?: 'google' | 'nominatim';
}

interface AddressDetails {
  county?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  sublocality?: string;
  placeId?: string;
  submarket?: string;
  currentUse?: string;
  utilityAccess?: string[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }, addressDetails?: AddressDetails) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  applicationId?: string;
  onEnrichmentComplete?: (data: any) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className = "",
  label,
  error,
  required = false,
  applicationId,
  onEnrichmentComplete,
  onValidationChange
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'loading' | 'success' | 'partial' | 'error'>('idle');
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const { validateAddress, isValidating, isValidStreetAddress } = useAddressValidation();

  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChange?.(isValidated);
  }, [isValidated, onValidationChange]);

  const fetchSuggestions = useCallback(debounce(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Try Google first
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { input, sessionToken }
      });

      // Check if Google worked
      if (!error && data?.predictions && data.predictions.length > 0 && data.status !== 'REQUEST_DENIED') {
        // Filter to only valid street addresses
        const validPredictions = data.predictions
          .filter((p: any) => isValidStreetAddress(p.description))
          .map((p: any) => ({ ...p, source: 'google' }));
        
        if (validPredictions.length > 0) {
          setSuggestions(validPredictions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
          return;
        }
      }

      // Fallback to Nominatim
      logger.log('Google Places unavailable or no valid addresses, trying Nominatim fallback');
      const { data: nominatimData, error: nominatimError } = await supabase.functions.invoke('nominatim-autocomplete', {
        body: { input }
      });

      if (!nominatimError && nominatimData?.predictions) {
        // Filter to only valid street addresses
        const validPredictions = nominatimData.predictions
          .filter((p: any) => isValidStreetAddress(p.description));
        
        setSuggestions(validPredictions);
        setShowSuggestions(validPredictions.length > 0);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      logger.error('Error fetching address suggestions:', error);
      // Last resort: try Nominatim on any error
      try {
        const { data: fallbackData } = await supabase.functions.invoke('nominatim-autocomplete', {
          body: { input }
        });
        if (fallbackData?.predictions) {
          const validPredictions = fallbackData.predictions
            .filter((p: any) => isValidStreetAddress(p.description));
          setSuggestions(validPredictions);
          setShowSuggestions(validPredictions.length > 0);
          setSelectedIndex(-1);
          return;
        }
      } catch {
        // Both failed
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, 300), [sessionToken, isValidStreetAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Clear validation state when user types
    setValidationError(null);
    setIsValidated(false);
    onChange(inputValue);
    fetchSuggestions(inputValue);
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    try {
      let coordinates: { lat: number; lng: number } | undefined;
      const addressDetails: AddressDetails = {
        placeId: suggestion.place_id
      };

      // If Nominatim suggestion, use embedded data directly (no second API call needed!)
      if (suggestion.source === 'nominatim' && suggestion.lat && suggestion.lng) {
        coordinates = { lat: suggestion.lat, lng: suggestion.lng };
        
        // Use pre-extracted address details
        if (suggestion.addressDetails) {
          addressDetails.county = suggestion.addressDetails.county;
          addressDetails.city = suggestion.addressDetails.city;
          addressDetails.state = suggestion.addressDetails.state;
          addressDetails.zipCode = suggestion.addressDetails.zipCode;
          addressDetails.neighborhood = suggestion.addressDetails.neighborhood;
        }

        logger.log('Using Nominatim data directly:', { coordinates, addressDetails });
      } else {
        // Google path: fetch place details
        const { data, error } = await supabase.functions.invoke('google-place-details', {
          body: { placeId: suggestion.place_id, sessionToken }
        });

        if (error) throw error;

        // Extract coordinates from geometry
        if (data?.result?.geometry?.location) {
          coordinates = {
            lat: data.result.geometry.location.lat,
            lng: data.result.geometry.location.lng
          };
        }

        // Extract address components (county, city, state, ZIP, neighborhood)
        if (data?.result?.address_components) {
          const components = data.result.address_components;
          
          logger.log('Google API address_components:', components);
          
          // County (administrative_area_level_2)
          const countyComponent = components.find((c: any) =>
            c.types.includes('administrative_area_level_2')
          );
          if (countyComponent) {
            addressDetails.county = countyComponent.long_name;
          }

          // City (locality)
          const cityComponent = components.find((c: any) =>
            c.types.includes('locality')
          );
          if (cityComponent) {
            addressDetails.city = cityComponent.long_name;
          }

          // State (administrative_area_level_1)
          const stateComponent = components.find((c: any) =>
            c.types.includes('administrative_area_level_1')
          );
          if (stateComponent) {
            addressDetails.state = stateComponent.short_name;
          }

          // ZIP Code (postal_code)
          const zipComponent = components.find((c: any) =>
            c.types.includes('postal_code')
          );
          if (zipComponent) {
            addressDetails.zipCode = zipComponent.long_name;
          }

          // Neighborhood (try neighborhood first, then sublocality as fallback)
          const neighborhoodComponent = components.find((c: any) =>
            c.types.includes('neighborhood')
          );
          if (neighborhoodComponent) {
            addressDetails.neighborhood = neighborhoodComponent.long_name;
          }

          // Sublocality (use as both sublocality AND neighborhood fallback)
          const sublocalityComponent = components.find((c: any) =>
            c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
          );
          if (sublocalityComponent) {
            addressDetails.sublocality = sublocalityComponent.long_name;
            if (!addressDetails.neighborhood) {
              addressDetails.neighborhood = sublocalityComponent.long_name;
            }
          }
          
          // Final fallback: use city if neighborhood still missing
          if (!addressDetails.neighborhood && addressDetails.city) {
            addressDetails.neighborhood = addressDetails.city;
          }
          
          logger.log('Extracted address details:', addressDetails);
        }

        // Override with Place ID from details if available (more reliable)
        if (data?.result?.place_id) {
          addressDetails.placeId = data.result.place_id;
        }

        // Auto-detect current use from place types
        if (data?.result?.types) {
          const types = data.result.types;
          if (types.includes('parking')) {
            addressDetails.currentUse = 'parking-lot';
          } else if (types.includes('point_of_interest') || types.includes('establishment') || types.includes('store')) {
            addressDetails.currentUse = 'existing-occupied';
          } else if (types.length === 1 && types[0] === 'street_address') {
            addressDetails.currentUse = 'vacant-land';
          }
        }
      }

      // VALIDATION: Call Google Address Validation API
      const validationResult = await validateAddress(
        suggestion.description,
        coordinates?.lat,
        coordinates?.lng
      );

      if (!validationResult.valid) {
        // HARD GATE: Block invalid addresses
        const errorMessage = validationResult.issues?.includes('Not in Texas')
          ? VALIDATION_ERRORS.NOT_IN_TEXAS
          : validationResult.issues?.includes('Missing street number')
          ? VALIDATION_ERRORS.NO_STREET_NUMBER
          : validationResult.error || VALIDATION_ERRORS.INCOMPLETE_ADDRESS;
        
        setValidationError(errorMessage);
        setIsValidated(false);
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        
        // Clear the input to force re-selection
        onChange('');
        toast.error(errorMessage);
        return; // DO NOT proceed
      }

      // Use standardized address if available
      const finalAddress = validationResult.standardizedAddress || suggestion.description;
      
      // Use validated geocode if available
      if (validationResult.geocode) {
        coordinates = {
          lat: validationResult.geocode.lat,
          lng: validationResult.geocode.lng
        };
      }

      // Update address details from validation
      if (validationResult.components) {
        if (validationResult.components.city) addressDetails.city = validationResult.components.city;
        if (validationResult.components.state) addressDetails.state = validationResult.components.state;
        if (validationResult.components.zip) addressDetails.zipCode = validationResult.components.zip;
        if (validationResult.components.county) addressDetails.county = validationResult.components.county;
      }

      // Mark as validated
      setIsValidated(true);
      setValidationError(null);

      // Auto-detect submarket from neighborhood (works for both Google and Nominatim)
      if (addressDetails.city && addressDetails.neighborhood) {
        const cityData = submarketMapping[addressDetails.city as keyof typeof submarketMapping];
        if (cityData) {
          const submarket = cityData[addressDetails.neighborhood as keyof typeof cityData];
          if (submarket) {
            addressDetails.submarket = submarket;
          }
        }
      }

      onChange(finalAddress, coordinates, addressDetails);

      // Trigger GIS enrichment (without application_id during form fill)
      setEnrichmentStatus('loading');
      try {
        const { data: enrichData, error: enrichError } = await supabase.functions.invoke('enrich-feasibility', {
          body: {
            address: finalAddress
          }
        });

        if (enrichError) throw enrichError;

        if (enrichData?.success) {
          const hasFlags = Array.isArray(enrichData.data_flags) && enrichData.data_flags.length > 0;
          setEnrichmentStatus(hasFlags ? 'partial' : 'success');
          
          // Auto-populate utility access from enriched data
          if (coordinates) {
            try {
              const { data: utilityData, error: utilityError } = await supabase.functions.invoke('enrich-utilities', {
                body: {
                  latitude: coordinates.lat,
                  longitude: coordinates.lng,
                  city: addressDetails.city
                }
              });

              if (!utilityError && utilityData?.success) {
                toast.success("Utility check complete", {
                  description: `Water: ${utilityData.utilities?.water || 0}, Sewer: ${utilityData.utilities?.sewer || 0}, Storm: ${utilityData.utilities?.storm || 0}`
                });
                
                const utilityAccess: string[] = [];
                if (utilityData.utilities?.water > 0) utilityAccess.push('water');
                if (utilityData.utilities?.sewer > 0) utilityAccess.push('sewer');
                if (utilityData.utilities?.storm > 0) utilityAccess.push('storm');
                if (addressDetails.city) {
                  utilityAccess.push('electric');
                }
                addressDetails.utilityAccess = utilityAccess;
              }
            } catch (utilityError) {
              logger.error('Utility enrichment error:', utilityError);
            }
          }
          
          onEnrichmentComplete?.(enrichData);
        } else {
          setEnrichmentStatus('error');
          logger.error('Enrichment failed:', enrichData?.error);
        }
      } catch (enrichError) {
        logger.error('GIS enrichment error:', enrichError);
        setEnrichmentStatus('error');
      }
    } catch (error) {
      logger.error('Error fetching place details:', error);
      setValidationError(VALIDATION_ERRORS.VALIDATION_FAILED);
      setIsValidated(false);
      onChange(suggestion.description, undefined, { placeId: suggestion.place_id });
    }

    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Get input border class based on validation state
  const getInputBorderClass = () => {
    if (validationError || error) {
      return 'border-destructive focus:border-destructive';
    }
    if (isValidated) {
      return 'border-green-500 focus:border-green-500';
    }
    return 'border-charcoal/20';
  };

  return (
    <div className="relative">
      {label && (
        <Label htmlFor="address-autocomplete" className="font-body font-semibold text-charcoal flex items-center gap-1">
          {label} {required && <span className="text-maxx-red text-lg">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`mt-2 pr-10 ${getInputBorderClass()} ${className}`}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? "address-suggestions" : undefined}
          aria-expanded={showSuggestions}
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          role="combobox"
        />
        
        {/* Validation indicator */}
        {isValidated && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
        {validationError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
      </div>

      {/* Validation error message */}
      {validationError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          id="address-suggestions"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-charcoal/20 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          role="listbox"
          aria-label="Address suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              id={`suggestion-${index}`}
              ref={el => suggestionRefs.current[index] = el}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from firing
                handleSuggestionClick(suggestion);
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-medium text-charcoal">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-sm text-charcoal/60">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isLoading && (
        <div 
          className="absolute top-full left-0 right-0 z-50 bg-white border border-charcoal/20 rounded-md shadow-lg mt-1"
          role="status"
          aria-live="polite"
        >
          <div className="px-4 py-3 text-center text-charcoal/60">
            Searching addresses...
          </div>
        </div>
      )}

      {isValidating && (
        <div className="mt-2 flex items-center gap-2 text-sm text-primary" role="status" aria-live="polite">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" aria-hidden="true"></div>
          <span>Validating address...</span>
        </div>
      )}
      
      {enrichmentStatus === 'loading' && !isValidating && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600" role="status" aria-live="polite">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" aria-hidden="true"></div>
          <span>Analyzing property...</span>
        </div>
      )}

      {enrichmentStatus === 'success' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>Property data loaded ✅</span>
        </div>
      )}

      {enrichmentStatus === 'partial' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>Property data loaded (partial data available)</span>
        </div>
      )}

      {enrichmentStatus === 'error' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-amber-600" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>Unable to load property data</span>
        </div>
      )}

      {(error && !validationError) && (
        <p className="mt-2 text-sm text-maxx-red">{error}</p>
      )}
    </div>
  );
}