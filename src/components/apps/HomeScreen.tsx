import { AppIcon } from "@/components/ui/app-icon";
import { PhoneContainer } from "@/components/ui/phone-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGame } from "@/contexts/GameContext";
import { 
  Heart, 
  ShoppingBag, 
  Store, 
  Users, 
  Wallet, 
  Building, 
  Coffee,
  Baby,
  Globe,
  Zap,
  LogOut,
  HeartHandshake,
  ChevronDown,
  Sparkles,
  Cookie,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { LifeApp } from "./LifeApp";
import { WalletApp } from "./WalletApp";
import { StoreApp } from "./StoreApp";
import BagApp from "./BagApp";
import { WorldApp } from "./WorldApp";
import { BankApp } from "./BankApp";
import { RelationshipApp } from "./RelationshipApp";
import { RouletteApp } from "./RouletteApp";
import { HospitalApp } from "./HospitalApp";
import { ManagerApp } from "./ManagerApp";
import { PregnancyApp } from "./PregnancyApp";
import { FriendsApp } from "./FriendsApp";
import { CreationApp } from "./CreationApp";
import { MeyBabyApp } from "./MeyBabyApp";
import { FortuneApp } from "./FortuneApp";

import { ProfileModal } from "@/components/profile/ProfileModal";
import { useRelationship } from "@/contexts/RelationshipContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppType = "home" | "life" | "bag" | "store" | "world" | "friends" | "wallet" | "bank" | "relationship" | "pregnancy" | "roulette" | "hospital" | "manager" | "creation" | "meybaby" | "fortune";

export function HomeScreen() {
  const { currentUser, logout } = useGame();
  const { getProposalsForUser, markProposalsAsViewed } = useRelationship();
  const [currentApp, setCurrentApp] = useState<AppType>("home");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();

  // Iniciar sistema automático de diminuição da fome
  useEffect(() => {
    const hungerInterval = setInterval(async () => {
      try {
        // Tenta primeiro via RPC (seguro: a função só diminui se já tiver passado 10min)
        console.log('🔄 HomeScreen - Calling decrease_hunger (RPC)');
        const { data, error } = await supabase.rpc('decrease_hunger');

        if (error) {
          console.warn('RPC decrease_hunger failed, falling back to Edge Function:', error.message || error);
          try {
            const edgeResult = await supabase.functions.invoke('hunger-decrease');
            console.log('🔄 HomeScreen - Edge hunger-decrease result:', edgeResult);
          } catch (edgeErr) {
            console.error('Erro ao chamar Edge Function hunger-decrease:', edgeErr);
          }
        } else {
          console.log('🔄 HomeScreen - RPC decrease_hunger result:', data);
        }
        // Atualizar o perfil do usuário após diminuir a fome
        fetchUserProfile();
      } catch (error) {
        console.error('Erro ao diminuir fome:', error);
      }
    }, 60000); // 1 minuto

    return () => clearInterval(hungerInterval);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
      // Load online status from localStorage
      const savedStatus = localStorage.getItem(`${currentUser}_onlineStatus`);
      if (savedStatus !== null) {
        setIsOnline(savedStatus === 'true');
      }

      // Real-time listener for user updates
      const channel = supabase
        .channel(`home-profile-${currentUser}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `username=eq.${currentUser}`
          },
          (payload) => {
            console.log('🔄 HomeScreen - Real-time user update:', payload.new);
            setUserProfile(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const fetchUserProfile = async () => {
    try {
      if (currentUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('username', currentUser)
          .single();
        
        console.log('🔄 HomeScreen - Profile refreshed for', currentUser, 'hunger:', data?.hunger_percentage);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Check for pending proposals
  const userProposals = currentUser ? getProposalsForUser(currentUser) : [];
  const hasRelationshipNotifications = userProposals.length > 0;



  const handleAppClick = (appId: AppType) => {
    if (appId === "relationship" && hasRelationshipNotifications) {
      // Mark proposals as viewed when entering relationship app
      markProposalsAsViewed(currentUser || "");
    }
    setCurrentApp(appId);
  };

  const handleStatusChange = (status: boolean) => {
    setIsOnline(status);
    if (currentUser) {
      localStorage.setItem(`${currentUser}_onlineStatus`, status.toString());
    }
    
    // Update friends status in real-time in FriendsApp and WorldApp
    const statusEvent = new CustomEvent('statusChanged', { detail: { username: currentUser, isOnline: status } });
    window.dispatchEvent(statusEvent);
    
    toast({
      title: status ? "Você está online! 🟢" : "Você está offline! 🔴",
      description: status ? "Outros usuários podem ver que você está ativo" : "Outros usuários verão você como offline"
    });
  };

  const apps = [
    { id: "life" as const, icon: Heart, label: "Vida" },
    { id: "bag" as const, icon: ShoppingBag, label: "Bolsa" },
    { id: "store" as const, icon: Store, label: "Loja" },
    { id: "world" as const, icon: Globe, label: "Mundo" },
    { id: "friends" as const, icon: Users, label: "Amigos" },
    { id: "wallet" as const, icon: Wallet, label: "Carteira" },
    { id: "bank" as const, icon: Building, label: "Banco" },
    { id: "relationship" as const, icon: Coffee, label: "Relacionamento", hasNotification: hasRelationshipNotifications },
    { id: "roulette" as const, icon: Zap, label: "Roleta" },
    { id: "pregnancy" as const, icon: Activity, label: "Gravidez" },
    { id: "hospital" as const, icon: HeartHandshake, label: "Hospital" },
    { id: "manager" as const, icon: Building, label: "Gerente" },
    { id: "creation" as const, icon: Sparkles, label: "Minha Criação" },
    { id: "meybaby" as const, icon: Baby, label: "My Baby" },
    { id: "fortune" as const, icon: Cookie, label: "Biscoito da Sorte" },
  ];

  const renderApp = () => {
    switch (currentApp) {
      case "life":
        return <LifeApp onBack={() => setCurrentApp("home")} />;
      case "wallet":
        return <WalletApp onBack={() => setCurrentApp("home")} />;
      case "store":
        return <StoreApp onBack={() => setCurrentApp("home")} />;
      case "bag":
        return <BagApp onBack={() => setCurrentApp("home")} />;
      case "world":
        return <WorldApp onBack={() => setCurrentApp("home")} />;
      case "friends":
        return <FriendsApp onBack={() => setCurrentApp("home")} />;
      case "bank":
        return <BankApp onBack={() => setCurrentApp("home")} />;
      case "relationship":
        return <RelationshipApp onBack={() => setCurrentApp("home")} />;
      case "roulette":
        return <RouletteApp onBack={() => setCurrentApp("home")} />;
      case "hospital":
        return <HospitalApp onBack={() => setCurrentApp("home")} />;
      case "manager":
        return <ManagerApp onBack={() => setCurrentApp("home")} />;
      case "pregnancy":
        return <PregnancyApp onBack={() => setCurrentApp("home")} />;
      case "creation":
        return <CreationApp onBack={() => setCurrentApp("home")} />;
      case "meybaby":
        return <MeyBabyApp onBack={() => setCurrentApp("home")} />;
      case "fortune":
        return <FortuneApp onBack={() => setCurrentApp("home")} />;
      default:
        return null;
    }
  };

  if (currentApp !== "home") {
    return (
      <PhoneContainer>
        {renderApp()}
      </PhoneContainer>
    );
  }

  return (
    <PhoneContainer>
      <div className="flex flex-col h-full">
        {/* User Profile Header - Modern Glass Card */}
        <div className="relative mb-8">
          <div className="bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-5 border border-border/20 shadow-lg">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary-glow/10 rounded-3xl opacity-50"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div 
                className="flex items-center gap-4 cursor-pointer group transition-all duration-300 hover:scale-[1.02] p-2 -m-2 rounded-2xl hover:bg-primary/5"
                onClick={() => setShowProfileModal(true)}
              >
                <div className="relative">
                  <Avatar className="w-16 h-16 border-3 border-primary/30 shadow-lg ring-2 ring-background/50 group-hover:border-primary/50 transition-all duration-300">
                    {userProfile?.avatar ? (
                      <AvatarImage src={userProfile.avatar} alt="Profile" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                        {currentUser?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* Online indicator with glow */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background shadow-sm ${isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-gray-400'} transition-all duration-300`}>
                    {isOnline && <div className="w-full h-full rounded-full bg-green-400 animate-pulse"></div>}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors duration-300">
                      {currentUser?.slice(0, -4)}
                    </h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-2 hover:bg-primary/10 rounded-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-sm font-medium text-muted-foreground">
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                            <ChevronDown size={14} className="text-muted-foreground" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36 bg-card/95 backdrop-blur-sm border-border/30">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(true)}
                          className="flex items-center gap-3 hover:bg-primary/10 rounded-lg"
                        >
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                          <span className="font-medium">Online</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(false)}
                          className="flex items-center gap-3 hover:bg-primary/10 rounded-lg"
                        >
                          <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm" />
                          <span className="font-medium">Offline</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-medium">
                    {userProfile?.relationship_status ? userProfile.relationship_status : "Nível 1"}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl p-3 transition-all duration-300 hover:scale-105"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {userProfile?.hunger_percentage === 0 ? (
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-app p-4 mb-6 border border-red-500/30 backdrop-blur-sm">
            <p className="text-sm text-center text-red-300 font-bold">
              ⚠️ Seu personagem está desmaiado por falta de comida!
            </p>
            <p className="text-xs text-center text-red-400 mt-1">
              Apenas o hospital está disponível para tratamento
            </p>
          </div>
        ) : (
          <div className="bg-gradient-card rounded-app p-3 mb-6 border border-border/50">
            <p className="text-sm text-center text-muted-foreground">
              💭 Sentindo-se bem
            </p>
          </div>
        )}

        {/* App Grid - Modern iOS style layout */}
        <div className="grid grid-cols-3 gap-6 flex-1 px-2">
          {apps.map((app, index) => {
            // Se fome = 0, só hospital disponível
            const isDisabled = userProfile?.hunger_percentage === 0 && app.id !== "hospital";
            
            return (
              <AppIcon
                key={app.id}
                icon={app.icon}
                label={app.label}
                onClick={() => isDisabled ? null : handleAppClick(app.id)}
                className={`justify-self-center animate-fade-in ${
                  isDisabled ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                hasNotification={!isDisabled && app.hasNotification}
              />
            );
          })}
        </div>
        
        {/* Time */}
        <div className="text-center mt-4">
          <p className="text-lg font-bold text-foreground">
            {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>

        {/* Profile Modal */}
        {currentUser && userProfile?.id && (
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => {
              setShowProfileModal(false);
              fetchUserProfile(); // Refresh profile data
            }}
            userId={userProfile.id}
            username={currentUser.slice(0, -4)}
          />
        )}
      </div>
    </PhoneContainer>
  );
}