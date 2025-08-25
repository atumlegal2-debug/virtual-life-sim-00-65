import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AppIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  hasNotification?: boolean;
}

export function AppIcon({ icon: Icon, label, onClick, className, size = "md", hasNotification = false }: AppIconProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-24 h-24"
  };

  const iconSizes = {
    sm: 24,
    md: 28,
    lg: 32
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2 cursor-pointer group",
        "transition-transform duration-200 hover:scale-110",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        sizeClasses[size],
        "bg-gradient-primary rounded-app shadow-app",
        "flex items-center justify-center relative",
        "border border-primary/20",
        "group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
        "transition-all duration-300"
      )}>
        <Icon 
          size={iconSizes[size]} 
          className="text-primary-foreground drop-shadow-sm" 
        />
        {hasNotification && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse border-2 border-background">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
      <span className="text-xs text-foreground/80 font-medium text-center">
        {label}
      </span>
    </div>
  );
}