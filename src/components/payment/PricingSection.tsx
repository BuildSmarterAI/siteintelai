interface PricingSectionProps {
  price?: number;
}

export const PricingSection = ({ price = 999 }: PricingSectionProps) => {
  return (
    <div className="text-center py-4 border-y border-border/50">
      <div className="flex items-baseline justify-center gap-1">
        <span className="font-mono text-4xl font-bold tabular-nums text-foreground">${price}</span>
        <span className="text-muted-foreground font-medium">one-time</span>
      </div>
      <p className="text-sm text-primary font-semibold mt-2 tracking-tight">
        Replaces days of manual due diligence
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Most reports deliver in 3–7 minutes. Complex sites may take up to 10.
      </p>
    </div>
  );
};
