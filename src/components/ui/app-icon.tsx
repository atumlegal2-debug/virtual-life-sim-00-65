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

export function AppIcon({ icon: Icon, label, onClick, className, size = "md", hasNotification = false, style }: AppIconProps & { style?: React.CSSProperties }) {
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
        "flex flex-col items-center gap-3 cursor-pointer group",
        "transition-all duration-300 ease-out",
        "hover:scale-110 active:scale-95",
        className
      )}
      style={style}
      onClick={onClick}
    >
      <div className={cn(
        sizeClasses[size],
        "relative overflow-hidden",
        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
        "rounded-3xl shadow-lg border border-border/20",
        "flex items-center justify-center",
        "group-hover:shadow-2xl group-hover:shadow-primary/25",
        "group-hover:border-primary/30",
        "transition-all duration-300 ease-out",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-primary/20 before:via-transparent before:to-primary-glow/20",
        "before:opacity-0 group-hover:before:opacity-100",
        "before:transition-opacity before:duration-300"
      )}>
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl opacity-60"></div>
        
        {/* Icon with enhanced styling */}
        <div className="relative z-10 p-2">
          <Icon 
            size={iconSizes[size]} 
            className="text-primary group-hover:text-primary-glow transition-colors duration-300 drop-shadow-sm" 
          />
        </div>
        
        {/* Notification badge */}
        {hasNotification && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-pulse border-2 border-background shadow-lg">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>
      
      {/* Modern label styling */}
      <span className="text-xs text-foreground/90 font-medium text-center leading-tight max-w-full truncate group-hover:text-foreground transition-colors duration-200">
        {label}
      </span>
    </div>
  );
}