import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface ManagerButtonProps {
  storeName?: string;
}

export function ManagerButton({ storeName }: ManagerButtonProps) {
  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={() => window.open('/manager', '_blank')}
      title={`Acesso Gerencial ${storeName ? `- ${storeName}` : ''}`}
      className="flex items-center gap-2"
    >
      <Settings size={16} />
      <span className="text-xs hidden sm:inline">Gerente</span>
    </Button>
  );
}