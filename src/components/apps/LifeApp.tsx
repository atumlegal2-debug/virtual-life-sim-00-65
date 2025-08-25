import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBar } from "@/components/ui/stat-bar";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface LifeAppProps {
  onBack: () => void;
}

// Disease feeling messages with emojis
const getDiseaseFeeling = (diseaseName: string): string => {
  const diseaseFeels: { [key: string]: string } = {
    'Queimadura Solar Arcana': 'Ai, minha pele está ardendo! Preciso do Protetor Solar "Luz de Sombra".',
    'Gripe do Vento Gelado': 'Estou todo tremendo e espirrando! Um Elixir Refrescante de Gelo me salvaria.',
    'Febre da Lua Cheia': 'Minha cabeça está girando e minha magia instável… Melhor usar a Máscara da Luz Divina.',
    'Enjoo do Portal': 'Que tontura estranha… Preciso da Essência do Calmante Sereno.',
    'Virose do Pó de Fada': 'Minha pele brilha estranho e estou exausto! Gel Purificador do Clérigo, me ajude!',
    'Dor Fantasma de Batalha': 'Meus músculos doem demais… Pomada do Sábio Curador, por favor!',
    'Irritação de Poeira Mágica': 'Meus olhos coçam e estou tossindo… Máscara da Névoa Purificadora vai salvar.',
    'Pele de Pedra': 'Minha pele está seca e rachando… Pomada da Fênix é a solução!',
    'Febre de Dragão': 'Sinto meu corpo queimando por dentro… Néctar das Sereias vai me refrescar.'
  };
  
  return diseaseFeels[diseaseName] || `Não me sinto bem por causa de ${diseaseName}.`;
};

export function LifeApp({ onBack }: LifeAppProps) {
  const { gameStats, currentUser, diseases, checkAndFixDiseaseLevel } = useGame();
  const [localEffects, setLocalEffects] = useState<any[]>([]);

  // Load temporary effects from localStorage
  useEffect(() => {
    const loadEffects = () => {
      const effects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
      const currentTime = Date.now();
      const validEffects = effects.filter((effect: any) => effect.expiresAt > currentTime);
      
      // Clean expired effects
      localStorage.setItem('temporaryEffects', JSON.stringify(validEffects));
      setLocalEffects(validEffects);
    };

    loadEffects();
    const interval = setInterval(loadEffects, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Vida</h1>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4 mb-6">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estatísticas de Vida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatBar
              label="Saúde"
              value={gameStats.health}
              color="health"
            />
            <StatBar
              label="Fome"
              value={gameStats.hunger}
              color="hunger"
            />
            <StatBar
              label="Alcoolismo"
              value={gameStats.alcoholism || 0}
              color="primary"
            />
            <StatBar
              label="Doença"
              value={gameStats.disease || 0}
              color="health"
            />
          </CardContent>
        </Card>

        {/* Mood Card */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Como Estou Me Sentindo</p>
              <p className="text-lg font-medium text-foreground">
                {diseases.length > 0 ? getDiseaseFeeling(diseases[0].name) : 
                 localEffects.length > 0 ? localEffects[0].message : "Sentindo-se bem 😊"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diseases */}
        {diseases.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-destructive">😷 Doenças Ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {diseases.map((disease, index) => (
                <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">
                    {disease.name}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Remédio necessário: {disease.medicine}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    💊 Vá à farmácia para comprar o remédio correto
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Temporary Effects */}
        {localEffects.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Efeitos Ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {localEffects.map((effect) => {
                const timeLeft = Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 60000));
                return (
                  <div key={effect.id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {effect.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeLeft > 0 ? `${timeLeft} min restantes` : "Expirando..."}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Debug/Fix Button - only show if disease level > 0 but no diseases */}
      {diseases.length === 0 && gameStats.disease > 0 && (
        <div className="mt-4">
          <Button
            onClick={checkAndFixDiseaseLevel}
            variant="outline"
            className="w-full"
          >
            🔧 Corrigir Nível de Doença
          </Button>
        </div>
      )}

    </div>
  );
}