import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PhoneContainerProps {
  children: ReactNode;
  className?: string;
}

export function PhoneContainer({ children, className }: PhoneContainerProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={cn(
        "bg-gradient-phone rounded-phone shadow-phone",
        "w-full max-w-sm h-[740px]",
        "border border-border/50",
        "relative overflow-hidden",
        "transition-transform duration-300 hover:scale-[1.02]",
        className
      )}>
        {/* Phone notch/status bar */}
        <div className="h-6 bg-background/10 rounded-t-phone flex items-center justify-center">
          <div className="w-16 h-1 bg-foreground/20 rounded-full"></div>
        </div>
        
        {/* Phone content */}
        <div className="h-[calc(100%-1.5rem)] p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}