import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-cta transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "maxx-red": "bg-maxx-red text-maxx-red-foreground hover:bg-maxx-red/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        "maxx-red-outline": "border-2 border-maxx-red text-maxx-red bg-background hover:bg-maxx-red hover:text-maxx-red-foreground",
        navy: "bg-navy text-navy-foreground hover:bg-navy/90",
        charcoal: "bg-charcoal text-charcoal-foreground hover:bg-charcoal/90",
        expandIcon: "group relative bg-[#FF7A00] text-white hover:bg-[#06B6D4] transition-all duration-300 gap-0 overflow-hidden shadow-lg hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  Icon?: React.ComponentType<{ className?: string }>;
  iconPlacement?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, Icon, iconPlacement = 'right', children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    if (variant === 'expandIcon' && Icon) {
      return (
        <Comp 
          className={cn(buttonVariants({ variant, size, className }))} 
          ref={ref} 
          {...props}
        >
          {iconPlacement === 'left' && (
            <div className="w-0 group-hover:w-5 opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className={cn(
            "transition-all duration-300",
            iconPlacement === 'right' && "group-hover:translate-x-1",
            iconPlacement === 'left' && "group-hover:-translate-x-1"
          )}>
            {children}
          </span>
          {iconPlacement === 'right' && (
            <div className="w-0 group-hover:w-5 opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </Comp>
      );
    }
    
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Comp>;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
