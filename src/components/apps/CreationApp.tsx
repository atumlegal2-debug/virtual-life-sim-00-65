import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Palette, Wand2 } from "lucide-react";
import { useState } from "react";
import { CreateItemModal } from "@/components/modals/CreateItemModal";
import { useGame } from "@/contexts/GameContext";

interface CreationAppProps {
  onBack: () => void;
}

const CATEGORIES = {
  food: { name: "Comida", price: 30, icon: "🍽️", description: "Crie comidas deliciosas que aumentam 5 pontos de fome" },
  drink: { name: "Bebida", price: 8, icon: "🍺", description: "Invente bebidas refrescantes que aumentam 10 pontos de energia" },
  object: { name: "Objeto", price: 300, icon: "📦", description: "Desenvolva objetos únicos que aumentam 100 pontos de felicidade" }
};

export function CreationApp({ onBack }: CreationAppProps) {
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const { money } = useGame();

  const handleCreateItem = () => {
    setShowCreateItemModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="text-primary" size={24} />
          Minha Criação
        </h1>
      </div>

      {/* Welcome Section */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Palette className="text-primary" size={20} />
            Atelier de Criação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-muted-foreground">
            Liberte sua criatividade! Crie itens únicos e personalizados para usar ou presentear seus amigos.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              💰 Saldo: {money} CM
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="space-y-4 flex-1">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wand2 size={18} className="text-primary" />
          Categorias Disponíveis
        </h2>
        
        <div className="space-y-3">
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Card 
              key={key}
              className="bg-gradient-card border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={handleCreateItem}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={money >= category.price ? "default" : "secondary"} 
                      className={money < category.price ? "opacity-50" : ""}
                    >
                      {category.price} CM
                    </Badge>
                    {money < category.price && (
                      <p className="text-xs text-destructive mt-1">Saldo insuficiente</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-card border-border/50 mt-4">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              ✨ <strong>Dica:</strong> Itens criados são únicos e aparecem na sua bolsa
            </p>
            <p className="text-xs text-muted-foreground">
              🎨 Use sua criatividade! Adicione fotos personalizadas ou escolha emojis
            </p>
            <p className="text-xs text-muted-foreground">
              💝 Seus amigos podem receber itens criados por você
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={showCreateItemModal}
        onClose={() => setShowCreateItemModal(false)}
      />
    </div>
  );
}