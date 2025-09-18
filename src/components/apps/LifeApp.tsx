import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBar } from "@/components/ui/stat-bar";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft, Heart, Utensils, AlertTriangle, Smile, Zap, Activity, Clock, Pill, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LifeAppProps {
  onBack: () => void;
}

// Disease feeling messages with emojis
const getDiseaseFeeling = (diseaseName: string, currentUser: string | null): string => {
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
    'Desnutrição': getHungerDiseaseFeeling(currentUser)
  };
  
  return diseaseFeels[diseaseName] || `Não me sinto bem por causa de ${diseaseName}.`;
};

// Hunger-related disease messages
const getHungerDiseaseFeeling = (currentUser: string | null): string => {
  if (!currentUser) return "Não me sinto bem...";
  
  // Get saved feeling for this user
  const savedFeeling = localStorage.getItem(`${currentUser}_hunger_disease_feeling`);
  if (savedFeeling) {
    return savedFeeling;
  }
  
  // If no saved feeling, generate and save a new one
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
  
  const randomFeeling = hungerMessages[Math.floor(Math.random() * hungerMessages.length)];
  localStorage.setItem(`${currentUser}_hunger_disease_feeling`, randomFeeling);
  
  return randomFeeling;
};

export function LifeApp({ onBack }: LifeAppProps) {
  const { 
    gameStats, 
    currentUser, 
    diseases, 
    checkAndFixDiseaseLevel, 
    cureHungerDisease, 
    updateStats
  } = useGame();
  const [localEffects, setLocalEffects] = useState<any[]>([]);
  const [showHungerAlert, setShowHungerAlert] = useState(false);
  const [localDiseases, setLocalDiseases] = useState(diseases);
  const [localGameStats, setLocalGameStats] = useState(gameStats);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setUserId(null);
      return;
    }

    const getUserId = async () => {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('username', currentUser)
          .single();

        if (profile) {
          setUserId(profile.id);
          console.log('LifeApp: User ID loaded for real-time:', profile.id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };

    getUserId();
  }, [currentUser]);

  // Listen for disease cure events
  useEffect(() => {
    const handleDiseaseCured = (event: CustomEvent) => {
      console.log('🎯 Disease cure event received:', event.detail);
      const { diseaseName, remainingDiseases } = event.detail;
      
      // Update local diseases immediately
      setLocalDiseases(remainingDiseases);
      
      // Clear any disease-specific localStorage if it's hunger disease
      if (diseaseName === 'Desnutrição' && currentUser) {
        localStorage.removeItem(`${currentUser}_hunger_disease_feeling`);
      }
      
      console.log('🔄 Local diseases updated after cure, remaining:', remainingDiseases.length);
    };

    window.addEventListener('diseaseCured', handleDiseaseCured as EventListener);
    return () => window.removeEventListener('diseaseCured', handleDiseaseCured as EventListener);
  }, [currentUser]);

  // Sync diseases from GameContext
  useEffect(() => {
    setLocalDiseases(diseases);
  }, [diseases]);

  // Sync game stats from GameContext in real-time
  useEffect(() => {
    setLocalGameStats(gameStats);
  }, [gameStats]);

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
    if (gameStats.hunger <= 49 && localDiseases.some(d => d.name === "Desnutrição")) {
      setShowHungerAlert(true);
      const timer = setTimeout(() => setShowHungerAlert(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [gameStats.hunger, localDiseases]);

  // Listen for real-time updates on hospital treatment requests
  useEffect(() => {
    if (!currentUser || !userId) return;

    console.log('Setting up real-time subscription for hospital treatments for user:', currentUser, 'with ID:', userId);

    const channel = supabase
      .channel(`hospital-treatments-${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hospital_treatment_requests',
          filter: `user_id=eq.${userId}` // Use user_id filter instead of username
        },
        async (payload) => {
          console.log('🏥 Hospital treatment real-time update received:', payload);
          
          const treatment = payload.new;
          if (treatment.status === 'accepted') {
            let healthIncrease = 0;
            
            console.log('Treatment accepted:', treatment.treatment_type);
            
            // Determine health increase based on treatment type
            if (treatment.treatment_type === "Check-up Básico") {
              healthIncrease = 10;
            } else if (treatment.treatment_type === "Consulta Especializada") {
              healthIncrease = 25;
            } else if (treatment.treatment_type === "Cirurgia") {
              healthIncrease = 50;
            } else if (treatment.treatment_type.includes("Cura para")) {
              healthIncrease = 15;
              
              // If it's a hunger disease cure, handle disease removal
              if (treatment.treatment_type.includes('Desnutrição')) {
                console.log('🍎 Real-time hunger disease treatment approved, curing patient');
                await cureHungerDisease();
                
                // Force immediate UI update by removing disease from local state
                setLocalDiseases(prev => prev.filter(d => d.name !== 'Desnutrição'));
                
                // Trigger a complete refresh after a short delay to ensure sync
                setTimeout(async () => {
                  if (currentUser) {
                    const savedDiseases = localStorage.getItem(`${currentUser}_diseases`);
                    if (savedDiseases) {
                      try {
                        const parsedDiseases = JSON.parse(savedDiseases);
                        setLocalDiseases(parsedDiseases);
                        console.log('🔄 Diseases refreshed after treatment:', parsedDiseases);
                      } catch (error) {
                        console.error('Error parsing refreshed diseases:', error);
                      }
                    } else {
                      setLocalDiseases([]);
                      console.log('🔄 No diseases found in localStorage, clearing local state');
                    }
                  }
                }, 500);
              }
            }

            // Apply health increase immediately
            if (healthIncrease > 0) {
              const currentHealth = gameStats.health;
              const newHealth = Math.min(100, currentHealth + healthIncrease);
              
              console.log(`💚 Applying health increase: ${currentHealth} + ${healthIncrease} = ${newHealth}`);
              
              // Update stats immediately in GameContext
              await updateStats({ health: newHealth });
              
              // Force immediate UI update by setting local state
              setLocalGameStats(prev => ({ ...prev, health: newHealth }));
              
              // Force a complete state refresh to ensure all components update
              setTimeout(async () => {
                try {
                  const { data: freshProfile } = await supabase
                    .from('users')
                    .select('life_percentage, hunger_percentage, mood, alcoholism_percentage, happiness_percentage, energy_percentage')
                    .eq('id', userId)
                    .single();
                  
                  if (freshProfile) {
                    const freshStats = {
                      health: freshProfile.life_percentage || 100,
                      hunger: freshProfile.hunger_percentage || 100,
                      mood: freshProfile.mood?.toString() || "Sentindo-se bem",
                      alcoholism: freshProfile.alcoholism_percentage || 0,
                      happiness: freshProfile.happiness_percentage || 100,
                      energy: freshProfile.energy_percentage || 100,
                      disease: gameStats.disease || 0 // Add missing disease property
                    };
                    
                    // Update local state only to avoid feedback loop; GameContext realtime will sync globally
                    setLocalGameStats(freshStats);
                    console.log('🔄 Forced complete stats refresh after treatment (local only)');
                  }
                } catch (error) {
                  console.error('Error refreshing stats:', error);
                }
              }, 1000);
              
              console.log(`✅ Treatment ${treatment.treatment_type} applied successfully: +${healthIncrease} health`);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Hospital treatment subscription status:', status);
      });

    return () => {
      console.log('Cleaning up hospital treatment subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser, userId]);

  // Listen for real-time alcoholism decreases
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('alcoholism-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `username=eq.${currentUser}`
        },
        (payload) => {
          console.log('User alcoholism update received:', payload);
          const updatedUser = payload.new;
          if (updatedUser.alcoholism_percentage !== undefined) {
            setLocalGameStats(prev => ({
              ...prev,
              alcoholism: updatedUser.alcoholism_percentage
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Realtime: sync user stats (health, hunger, etc.) when Users table updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-stats-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('🩺 User stats update received:', payload);
          const u: any = payload.new;
          const freshStats = {
            health: u.life_percentage ?? 100,
            hunger: u.hunger_percentage ?? 100,
            mood: u.mood?.toString() ?? "Sentindo-se bem",
            alcoholism: u.alcoholism_percentage ?? 0,
            happiness: u.happiness_percentage ?? 100,
            energy: u.energy_percentage ?? 100,
            disease: gameStats.disease || 0,
          };
          
          // Only update if there's a meaningful change
          setLocalGameStats(prev => {
            const hasSignificantChange = Math.abs(prev.hunger - freshStats.hunger) > 0.1 ||
                                       Math.abs(prev.health - freshStats.health) > 0.1;
            
            if (hasSignificantChange) {
              console.log('🩺 LifeApp stats updated from realtime');
              return freshStats;
            }
            
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background/80 to-muted/30">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl mb-6 border border-primary/10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="hover:bg-primary/10 transition-all duration-300 rounded-xl"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Activity className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Central de Vida
              </h1>
              <p className="text-sm text-muted-foreground">Monitor de saúde e bem-estar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Health */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="text-green-600 dark:text-green-400" size={18} />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Saúde</span>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600 font-semibold">
                  {localGameStats.health}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.health} color="health" />
            </CardContent>
          </Card>

          {/* Hunger */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200/50 dark:border-orange-800/30 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="text-orange-600 dark:text-orange-400" size={18} />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Fome</span>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600 font-semibold">
                  {localGameStats.hunger}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.hunger} color="hunger" />
            </CardContent>
          </Card>

          {/* Happiness */}
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200/50 dark:border-yellow-800/30 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smile className="text-yellow-600 dark:text-yellow-400" size={18} />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Felicidade</span>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600 font-semibold">
                  {localGameStats.happiness || 100}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.happiness || 100} color="happiness" />
            </CardContent>
          </Card>

          {/* Energy */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="text-blue-600 dark:text-blue-400" size={18} />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Energia</span>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600 font-semibold">
                  {localGameStats.energy || 100}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.energy || 100} color="energy" />
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50 dark:border-purple-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Alcoolismo</span>
                <Badge variant={localGameStats.alcoholism > 50 ? "destructive" : "secondary"} className="text-xs">
                  {localGameStats.alcoholism || 0}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.alcoholism || 0} color="primary" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200/50 dark:border-red-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800 dark:text-red-200">Doença</span>
                <Badge variant={localGameStats.disease > 0 ? "destructive" : "secondary"} className="text-xs">
                  {localGameStats.disease || 0}%
                </Badge>
              </div>
              <StatBar label="" value={localGameStats.disease || 0} color="health" />
            </CardContent>
          </Card>
        </div>

        {/* Status Card */}
        <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Smile className="text-primary-foreground" size={16} />
              </div>
              Como Estou Me Sentindo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-base text-foreground leading-relaxed">
                {localDiseases.length > 0 ? getDiseaseFeeling(localDiseases[0].name, currentUser) : 
                 localEffects.length > 0 ? localEffects[0].message : "Sentindo-se bem e com energia! 😊✨"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diseases Card */}
        {localDiseases.length > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                Doenças Ativas
                <Badge variant="destructive" className="ml-auto">
                  {localDiseases.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {localDiseases.map((disease, index) => (
                <div key={index} className="p-4 bg-white dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      {disease.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Pill size={14} />
                    <span>Remédio: {disease.medicine}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                    <Stethoscope size={16} className="text-primary" />
                    <p className="text-sm font-medium text-primary">
                      {disease.name === "Desnutrição" ? 
                        "Vá ao hospital fazer uma consulta médica" : 
                        "Vá à farmácia para comprar o remédio correto"
                      }
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Effects */}
        {localEffects.length > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                <Zap className="text-green-600 dark:text-green-400" size={20} />
                Efeitos Ativos
                <Badge variant="secondary" className="ml-auto bg-green-100 dark:bg-green-900/30">
                  {localEffects.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {localEffects.map((effect) => {
                const timeLeft = Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 60000));
                return (
                  <div key={effect.id} className="p-4 bg-white dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {effect.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{timeLeft > 0 ? `${timeLeft} min restantes` : "Expirando..."}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Hunger Alert */}
        {showHungerAlert && (
          <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400 dark:border-red-600 shadow-xl animate-pulse">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-bounce">
                  <AlertTriangle className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">ALERTA MÉDICO</h3>
                <p className="text-red-600 dark:text-red-400 mb-3 font-medium">
                  Sua fome está muito baixa e você ficou doente!
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Stethoscope size={16} />
                  <span>Vá ao hospital fazer um checkup urgente!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Activity className="text-white" size={16} />
              </div>
              Como Melhorar Seus Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {/* Health Instructions */}
              <div className="p-4 bg-white dark:bg-blue-950/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="text-green-600 dark:text-green-400" size={16} />
                  <span className="font-semibold text-green-700 dark:text-green-300">Saúde</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para melhorar a saúde, use o app do Hospital.<br/>
                  Marque uma consulta, escolhendo de acordo com a quantidade de pontos que deseja recuperar.<br/>
                  Após agendar, basta ir ao chat do hospital para o atendimento.
                </p>
              </div>

              {/* Hunger Instructions */}
              <div className="p-4 bg-white dark:bg-blue-950/20 border border-orange-200 dark:border-orange-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="text-orange-600 dark:text-orange-400" size={16} />
                  <span className="font-semibold text-orange-700 dark:text-orange-300">Fome</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ao sentir fome, você pode comprar qualquer comida disponível nas lojas.<br/>
                  Verifique se a loja está aberta antes de pedir.<br/>
                  <strong>Faça o pedido online:</strong><br/>
                  • <strong>Retirada:</strong> vá até o chat da loja.<br/>
                  • <strong>Motoboy:</strong> ele entregará direto no seu chat.
                </p>
              </div>

              {/* Happiness Instructions */}
              <div className="p-4 bg-white dark:bg-blue-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="text-yellow-600 dark:text-yellow-400" size={16} />
                  <span className="font-semibold text-yellow-700 dark:text-yellow-300">Felicidade</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A felicidade pode ser aumentada de duas formas:<br/>
                  • <strong>Sorveteria:</strong> qualquer item aumenta felicidade.<br/>
                  • <strong>Sexshop:</strong> produtos especiais que também aumentam felicidade.
                </p>
              </div>

              {/* Energy Instructions */}
              <div className="p-4 bg-white dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-blue-600 dark:text-blue-400" size={16} />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Energia</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para recuperar energia:<br/>
                  • Qualquer refrigerante aumenta energia.<br/>
                  • Sorvete também ajuda a recuperar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug/Fix Button */}
        {localDiseases.length === 0 && gameStats.disease > 0 && (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-4">
              <Button
                onClick={checkAndFixDiseaseLevel}
                variant="outline"
                className="w-full hover:bg-primary/10 transition-all duration-300"
              >
                🔧 Corrigir Nível de Doença
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}