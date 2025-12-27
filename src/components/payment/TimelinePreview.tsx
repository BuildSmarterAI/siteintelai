import { CreditCard, Cpu, Mail } from "lucide-react";

const steps = [
  { icon: CreditCard, label: "Secure checkout", description: "Pay via Stripe" },
  { icon: Cpu, label: "AI analysis", description: "3–7 minutes" },
  { icon: Mail, label: "Report delivered", description: "To your inbox" },
];

export const TimelinePreview = () => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">What Happens Next</h3>
      <div className="flex items-center justify-between gap-2">
        {steps.map(({ icon: Icon, label, description }, index) => (
          <div key={label} className="flex-1 relative">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-px bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
