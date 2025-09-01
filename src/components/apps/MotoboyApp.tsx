import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, MapPin, Clock, Package } from "lucide-react";

interface MotoboyAppProps {
  onBack: () => void;
}

export function MotoboyApp({ onBack }: MotoboyAppProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/10 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-primary-foreground hover:bg-background/20"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-bold text-primary-foreground">Motoboy</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="text-primary" size={20} />
              Status do Entregador
            </CardTitle>
            <CardDescription>
              Você está pronto para fazer entregas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Online e disponível</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Entregas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Entrega #001</span>
                <span className="text-green-600 font-bold">R$ 15,00</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>2.5 km - Centro → Zona Sul</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>Estimativa: 20 min</span>
              </div>
              <Button size="sm" className="w-full">
                Aceitar Entrega
              </Button>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Entrega #002</span>
                <span className="text-green-600 font-bold">R$ 22,00</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>4.1 km - Zona Norte → Centro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>Estimativa: 35 min</span>
              </div>
              <Button size="sm" className="w-full">
                Aceitar Entrega
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-xs text-muted-foreground">Entregas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">R$ 67,00</div>
                <div className="text-xs text-muted-foreground">Ganhos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">12.5 km</div>
                <div className="text-xs text-muted-foreground">Distância</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">2h 15m</div>
                <div className="text-xs text-muted-foreground">Tempo Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}