import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
        <Label htmlFor="fullName" className="text-base">
          Full Name <span className="text-destructive" aria-label="required">*</span>
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
        <Label htmlFor="company" className="text-base">
          Company <span className="text-destructive" aria-label="required">*</span>
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
        <Label htmlFor="email" className="text-base">
          Email Address <span className="text-destructive" aria-label="required">*</span>
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
        <Label htmlFor="phone" className="text-base">
          Phone Number <span className="text-destructive" aria-label="required">*</span>
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
