import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  show: boolean;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  'aria-busy'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export const FadeIn = ({ 
  show, 
  children, 
  delay = 150, 
  className = "",
  'aria-busy': ariaBusy = false,
  'aria-live': ariaLive = 'polite'
}: FadeInProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setMounted(true), delay);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [show, delay]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0",
        className
      )}
      aria-busy={ariaBusy}
      aria-live={ariaLive}
    >
      {children}
    </div>
  );
};
