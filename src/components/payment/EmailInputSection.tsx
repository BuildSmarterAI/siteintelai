import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailInputSectionProps {
  email: string;
  onEmailChange: (email: string) => void;
  emailError: string;
  onClearError: () => void;
  isAuthenticated?: boolean;
  authenticatedEmail?: string;
}

export const EmailInputSection = ({
  email,
  onEmailChange,
  emailError,
  onClearError,
  isAuthenticated,
  authenticatedEmail,
}: EmailInputSectionProps) => {
  if (isAuthenticated && authenticatedEmail) {
    return (
      <div className="space-y-2">
        <Label className="font-heading text-sm font-medium text-muted-foreground uppercase tracking-wide">Email Address</Label>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-foreground">
            Signed in as <strong className="font-semibold">{authenticatedEmail}</strong>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your report will be delivered to this email.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="font-heading text-sm font-medium uppercase tracking-wide">Email Address</Label>
      <Input
        id="email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          onEmailChange(e.target.value);
          if (emailError) onClearError();
        }}
        className={emailError ? "border-destructive" : ""}
      />
      {emailError && (
        <p className="text-sm text-destructive font-medium">{emailError}</p>
      )}
      <p className="text-xs text-muted-foreground">
        We'll email your report and use this address for secure access. No spam.
      </p>
    </div>
  );
};
