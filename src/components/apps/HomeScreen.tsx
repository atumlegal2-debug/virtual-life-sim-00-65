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
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { LifeApp } from "./LifeApp";
import { WalletApp } from "./WalletApp";
import { StoreApp } from "./StoreApp";
import { BagApp } from "./BagApp";
import { WorldApp } from "./WorldApp";
import { BankApp } from "./BankApp";
import { RelationshipApp } from "./RelationshipApp";
import { RouletteApp } from "./RouletteApp";
import { HospitalApp } from "./HospitalApp";
import { ManagerApp } from "./ManagerApp";
import { PregnancyApp } from "./PregnancyApp";
import { FriendsApp } from "./FriendsApp";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { useRelationship } from "@/contexts/RelationshipContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppType = "home" | "life" | "bag" | "store" | "world" | "friends" | "wallet" | "bank" | "relationship" | "pregnancy" | "roulette" | "hospital" | "manager";

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
        await supabase.functions.invoke('hunger-decrease');
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
    { id: "pregnancy" as const, icon: Baby, label: "Gravidez" },
    { id: "hospital" as const, icon: HeartHandshake, label: "Hospital" },
    { id: "manager" as const, icon: Building, label: "Gerente" },
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
        {/* User Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowProfileModal(true)}
          >
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              {userProfile?.avatar ? (
                <AvatarImage src={userProfile.avatar} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                  {currentUser?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">
                  {currentUser?.slice(0, -4)}
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-transparent">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <ChevronDown size={12} className="text-muted-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-32">
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(true)}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Online
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(false)}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      Offline
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.relationship_status ? userProfile.relationship_status : "Nível 1"}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut size={16} />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="bg-gradient-card rounded-app p-3 mb-6 border border-border/50">
          <p className="text-sm text-center text-muted-foreground">
            💭 Sentindo-se bem
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {apps.map((app) => (
            <AppIcon
              key={app.id}
              icon={app.icon}
              label={app.label}
              onClick={() => handleAppClick(app.id)}
              className="justify-self-center"
              hasNotification={app.hasNotification}
            />
          ))}
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