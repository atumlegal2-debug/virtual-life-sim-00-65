import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBar } from "@/components/ui/stat-bar";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    'Febre de Dragão': 'Sinto meu corpo queimando por dentro… Néctar das Sereias vai me refrescar.',
    'Desnutrição': getHungerDiseaseFeeling()
  };
  
  return diseaseFeels[diseaseName] || `Não me sinto bem por causa de ${diseaseName}.`;
};

// Hunger-related disease messages
const getHungerDiseaseFeeling = (): string => {
  const hungerMessages = [
    "Você sente o corpo pesado e uma febre começando a subir.",
    "Sua cabeça lateja como se tivesse um tambor batendo lá dentro.",
    "A garganta está arranhando e cada palavra dói para sair.",
    "Seus olhos ardem e você mal consegue mantê-los abertos.",
    "Uma tosse seca insiste em não te deixar em paz.",
    "Seu estômago está embrulhado, e nada parece cair bem.",
    "Você sente calafrios, mesmo estando em um lugar quente.",
    "Seu corpo está fraco, e cada passo parece um esforço enorme.",
    "Um enjoo constante não deixa você se concentrar em mais nada.",
    "Sua respiração está curta e você sente-se ofegante com facilidade."
  ];
  
  return hungerMessages[Math.floor(Math.random() * hungerMessages.length)];
};

export function LifeApp({ onBack }: LifeAppProps) {
  const { gameStats, currentUser, diseases, checkAndFixDiseaseLevel, cureHungerDisease } = useGame();
  const [localEffects, setLocalEffects] = useState<any[]>([]);
  const [showHungerAlert, setShowHungerAlert] = useState(false);

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

  // Listen for hunger alert events
  useEffect(() => {
    const handleHungerAlert = () => {
      setShowHungerAlert(true);
      setTimeout(() => setShowHungerAlert(false), 5000); // Hide after 5 seconds
    };

    window.addEventListener('showHungerAlert', handleHungerAlert);
    return () => window.removeEventListener('showHungerAlert', handleHungerAlert);
  }, []);

  // Check if user has hunger-related disease and show alert
  useEffect(() => {
    if (gameStats.hunger <= 49 && diseases.some(d => d.name === "Desnutrição")) {
      setShowHungerAlert(true);
      const timer = setTimeout(() => setShowHungerAlert(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [gameStats.hunger, diseases]);

  // Listen for consultation approval events to cure hunger disease
  useEffect(() => {
    const checkConsultationApproval = async () => {
      if (!currentUser) return;

      try {
        // Get user profile to get user_id
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('username', currentUser)
          .single();

        if (!profile) return;

        // Check for approved treatment requests for this user
        const { data: approvedTreatments, error } = await supabase
          .from('hospital_treatment_requests')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'accepted')
          .gte('processed_at', new Date(Date.now() - 60000).toISOString()); // Check last minute

        if (error) {
          console.error('Error checking treatment requests:', error);
          return;
        }

        // Check if any approved treatment is for hunger disease cure
        const hungerTreatment = approvedTreatments?.find(treatment => 
          treatment.treatment_type.includes('Desnutrição') || 
          treatment.request_message.includes('Desnutrição')
        );

        if (hungerTreatment && diseases.some(d => d.name === "Desnutrição")) {
          console.log('Hunger disease treatment approved, curing patient');
          await cureHungerDisease();
          
          // Mark this treatment as processed so we don't cure again
          await supabase
            .from('hospital_treatment_requests')
            .update({ manager_notes: (hungerTreatment.manager_notes || '') + ' [CURED]' })
            .eq('id', hungerTreatment.id);
        }
      } catch (error) {
        console.error('Error checking consultation approval:', error);
      }
    };

    // Check every 30 seconds if user is logged in and has hunger disease
    if (currentUser && diseases.some(d => d.name === "Desnutrição")) {
      const interval = setInterval(checkConsultationApproval, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, diseases]);

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
                     {disease.name === "Desnutrição" ? 
                       "🏥 Vá ao hospital fazer uma consulta médica" : 
                       "💊 Vá à farmácia para comprar o remédio correto"
                     }
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

        {/* Hunger Alert */}
        {showHungerAlert && (
          <Card className="bg-destructive/20 border-destructive/30 animate-pulse">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg font-bold text-destructive mb-2">⚠️ ALERTA MÉDICO ⚠️</p>
                <p className="text-sm text-destructive-foreground mb-2">
                  Sua fome está muito baixa e você ficou doente!
                </p>
                <p className="text-xs text-muted-foreground">
                  🏥 Vá ao hospital fazer um checkup urgente!
                </p>
              </div>
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