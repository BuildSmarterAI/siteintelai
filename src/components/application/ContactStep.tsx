import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { FIELD_TOOLTIPS } from "@/lib/fieldTooltips";

interface ContactStepProps {
  formData: {
    fullName: string;
    company: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function ContactStep({ formData, onChange, errors }: ContactStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Contact Information</legend>
      
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base flex items-center gap-2">
          Full Name <span className="text-destructive" aria-label="required">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{FIELD_TOOLTIPS.fullName.content}</p>
                <p className="text-xs text-muted-foreground">Example: {FIELD_TOOLTIPS.fullName.example}</p>
                {FIELD_TOOLTIPS.fullName.whyWeAsk && (
                  <p className="text-xs text-primary mt-2">Why we ask: {FIELD_TOOLTIPS.fullName.whyWeAsk}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          className="touch-target"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          autoComplete="name"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p id="fullName-error" className="text-sm text-destructive" role="alert">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company" className="text-base flex items-center gap-2">
          Company <span className="text-destructive" aria-label="required">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{FIELD_TOOLTIPS.company.content}</p>
                <p className="text-xs text-muted-foreground">Example: {FIELD_TOOLTIPS.company.example}</p>
                {FIELD_TOOLTIPS.company.whyWeAsk && (
                  <p className="text-xs text-primary mt-2">Why we ask: {FIELD_TOOLTIPS.company.whyWeAsk}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => onChange('company', e.target.value)}
          className="touch-target"
          aria-invalid={!!errors.company}
          aria-describedby={errors.company ? "company-error" : undefined}
          autoComplete="organization"
          placeholder="Your Company LLC"
        />
        {errors.company && (
          <p id="company-error" className="text-sm text-destructive" role="alert">
            {errors.company}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base flex items-center gap-2">
          Email Address <span className="text-destructive" aria-label="required">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{FIELD_TOOLTIPS.email.content}</p>
                <p className="text-xs text-muted-foreground">Example: {FIELD_TOOLTIPS.email.example}</p>
                {FIELD_TOOLTIPS.email.whyWeAsk && (
                  <p className="text-xs text-primary mt-2">Why we ask: {FIELD_TOOLTIPS.email.whyWeAsk}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="touch-target"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          autoComplete="email"
          placeholder="you@company.com"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base flex items-center gap-2">
          Phone Number <span className="text-destructive" aria-label="required">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{FIELD_TOOLTIPS.phone.content}</p>
                <p className="text-xs text-muted-foreground">Example: {FIELD_TOOLTIPS.phone.example}</p>
                {FIELD_TOOLTIPS.phone.whyWeAsk && (
                  <p className="text-xs text-primary mt-2">Why we ask: {FIELD_TOOLTIPS.phone.whyWeAsk}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className="touch-target"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          autoComplete="tel"
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive" role="alert">
            {errors.phone}
          </p>
        )}
      </div>
    </fieldset>
  );
}
