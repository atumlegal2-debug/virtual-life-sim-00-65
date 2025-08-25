import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color: "health" | "hunger" | "money" | "love" | "primary";
  className?: string;
}

export function StatBar({ label, value, maxValue = 100, color, className }: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const colorClasses = {
    health: "bg-health",
    hunger: "bg-hunger", 
    money: "bg-money",
    love: "bg-love",
    primary: "bg-primary"
  };

  const bgColorClasses = {
    health: "bg-health/20",
    hunger: "bg-hunger/20",
    money: "bg-money/20", 
    love: "bg-love/20",
    primary: "bg-primary/20"
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          {Math.round(value)}/{maxValue}
        </span>
      </div>
      
      <div className={cn(
        "w-full h-3 rounded-full overflow-hidden",
        bgColorClasses[color]
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}