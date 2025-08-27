import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatBar } from "@/components/ui/stat-bar";
import { ArrowLeft, Heart, Clock, UserPlus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "@/contexts/GameContext";
import { useFriendship } from "@/contexts/FriendshipContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface UserData {
  id: string;
  username: string;
  avatar?: string;
  life_percentage: number;
  hunger_percentage: number;
  alcoholism_percentage: number;
  disease_percentage: number;
  mood: string;
  nickname?: string | null;
}

export function UserProfileModal({ isOpen, onClose, userId, username }: UserProfileModalProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [localEffects, setLocalEffects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { diseases, currentUser } = useGame();
  const { sendFriendRequest, areFriends, hasPendingRequest } = useFriendship();

  useEffect(() => {
    if (isOpen && username) {
      fetchUserData();
      loadUserEffects();
      
      // Auto-refresh data every 5 seconds when modal is open
      const interval = setInterval(() => {
        fetchUserData();
        loadUserEffects();
        setUserDiseases(loadUserDiseases()); // Update diseases as well
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, username]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching user data for:', username);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        console.log('User data fetched:', data);
        setUserData({
          ...data,
          mood: data.mood?.toString() || "Sentindo-se bem"
        });
      } else {
        console.log('No user data found for:', username);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserEffects = () => {
    // Load temporary effects for this user from localStorage
    // Check both global and user-specific storage
    const globalEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
    const userSpecificEffects = JSON.parse(localStorage.getItem(`${username}_temporaryEffects`) || '[]');
    
    const currentTime = Date.now();
    const allEffects = [...globalEffects, ...userSpecificEffects];
    const userEffects = allEffects.filter((effect: any) => 
      (effect.userId === username || effect.username === username) && effect.expiresAt > currentTime
    );
    setLocalEffects(userEffects);
  };

  // Load user diseases from localStorage (synced from GameContext)
  const loadUserDiseases = () => {
    const savedDiseases = localStorage.getItem(`${username}_diseases`);
    if (savedDiseases) {
      try {
        return JSON.parse(savedDiseases);
      } catch (error) {
        console.error('Error parsing user diseases:', error);
        return [];
      }
    }
    return [];
  };

  const [userDiseases, setUserDiseases] = useState<any[]>([]);

  useEffect(() => {
    if (username) {
      setUserDiseases(loadUserDiseases());
    }
  }, [username]);

  // Disease feeling messages with emojis (moved from LifeApp)
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

  const getCurrentFeeling = () => {
    // Priority 1: Active diseases with specific messages
    if (userDiseases.length > 0) {
      return getDiseaseFeeling(userDiseases[0].name);
    }
    
    // Priority 2: Temporary effects (stored per user)
    if (localEffects.length > 0) {
      return localEffects[0].message;
    }
    
    // Priority 3: Stats-based feelings from database
    if (userData) {
      if (userData.hunger_percentage < 30) return "Com fome 😋";
      if (userData.life_percentage < 50) return "Não se sentindo bem 😷";
      if (userData.alcoholism_percentage > 50) return "Sentindo efeitos do álcool 🍺";
    }
    
    return "Sentindo-se bem 😊";
  };

  const handleAddFriend = async () => {
    if (currentUser && userData && userData.id !== currentUser) {
      await sendFriendRequest(userData.id, username);
    }
  };

  const getButtonState = () => {
    if (!currentUser || !userData || userData.username === currentUser) {
      return { text: "Você", disabled: true, variant: "outline" as const };
    }
    
    if (areFriends(userData.id) || areFriends(username)) {
      return { text: "✓ Amigos", disabled: true, variant: "outline" as const };
    }
    
    if (hasPendingRequest(userData.id) || hasPendingRequest(username)) {
      return { text: "Pendente", disabled: true, variant: "outline" as const };
    }
    
    return { text: "Adicionar Amigo", disabled: false, variant: "default" as const };
  };

  if (!userData && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Usuário não encontrado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Não foi possível encontrar os dados deste usuário.
            </p>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft size={20} />
            </Button>
            <DialogTitle>Perfil de {(userData?.nickname || username.replace(/\d{4}$/, ''))}</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                fetchUserData();
                setUserDiseases(loadUserDiseases());
              }}
              className="ml-auto"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </Button>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary/20">
                  {userData?.avatar ? (
                    <AvatarImage src={userData.avatar} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                      {(userData?.nickname || username.replace(/\d{4}$/, '')).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {(userData?.nickname || username.replace(/\d{4}$/, ''))}
                </h2>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatBar
                  label="Saúde"
                  value={userData?.life_percentage || 0}
                  color="health"
                />
                <StatBar
                  label="Fome"
                  value={userData?.hunger_percentage || 0}
                  color="hunger"
                />
                <StatBar
                  label="Alcoolismo"
                  value={userData?.alcoholism_percentage || 0}
                  color="primary"
                />
                <StatBar
                  label="Doença"
                  value={userData?.disease_percentage || 0}
                  color="health"
                />
              </CardContent>
            </Card>

            {/* Current Feeling */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Como Está Se Sentindo</p>
                  <p className="text-lg font-medium text-foreground">
                    {getCurrentFeeling()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Diseases */}
            {userDiseases.length > 0 && (
              <Card className="bg-gradient-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    😷 Doenças Ativas
                    <Badge variant="destructive" className="text-xs">
                      {userDiseases.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userDiseases.map((disease, index) => (
                    <div key={index} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="font-medium text-destructive text-sm">{disease.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Remédio necessário: {disease.medicine}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Effects */}
            {localEffects.length > 0 && (
              <Card className="bg-gradient-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    ✨ Efeitos Ativos
                    <Badge variant="secondary" className="text-xs">
                      {localEffects.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localEffects.map((effect) => {
                    const timeLeft = Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 60000));
                    return (
                      <div key={effect.id} className="border border-border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{effect.type}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            {timeLeft}min
                          </div>
                        </div>
                        <p className="text-sm text-primary italic">
                          "{effect.message}"
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {(() => {
                const buttonState = getButtonState();
                return (
                  <Button 
                    onClick={handleAddFriend}
                    className="w-full"
                    disabled={buttonState.disabled}
                    variant={buttonState.variant}
                  >
                    <UserPlus size={16} className="mr-2" />
                    {buttonState.text}
                  </Button>
                );
              })()}
              
              {userData && (areFriends(userData.id) || areFriends(username)) && (
                <Button variant="outline" className="w-full">
                  <Heart size={16} className="mr-2" />
                  Amigos desde hoje
                </Button>
              )}
              
              <Button variant="outline" className="w-full" disabled>
                💝 Enviar Item
              </Button>
              <Button variant="outline" className="w-full" disabled>
                💰 Enviar Dinheiro
              </Button>
              <Button variant="outline" className="w-full" disabled>
                💌 Proposta de Relacionamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}