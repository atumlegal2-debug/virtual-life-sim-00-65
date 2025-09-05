import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PhoneContainerProps {
  children: ReactNode;
  className?: string;
}

export function PhoneContainer({ children, className }: PhoneContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5 opacity-50"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-glow/10 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className={cn(
        "bg-gradient-to-b from-card/90 to-card/95 backdrop-blur-xl",
        "rounded-[2.5rem] shadow-phone border border-border/30",
        "w-full max-w-sm h-[740px]",
        "relative overflow-hidden",
        "transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-primary-glow/10 before:opacity-50 before:rounded-[2.5rem]",
        className
      )}>
        {/* Phone notch/status bar - Modern iPhone style */}
        <div className="h-8 bg-background/5 rounded-t-[2.5rem] flex items-center justify-center relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-foreground/15 rounded-full"></div>
          <div className="absolute top-1 right-6 w-1.5 h-1.5 bg-foreground/20 rounded-full"></div>
          <div className="absolute top-1 left-6 text-[10px] text-foreground/40 font-medium">9:41</div>
          <div className="absolute top-1 right-3 text-[10px] text-foreground/40">100%</div>
        </div>
        
        {/* Phone content - Modernized */}
        <div className="h-[calc(100%-2rem)] p-5 overflow-y-auto relative scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background/5 pointer-events-none rounded-b-[2rem]"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}