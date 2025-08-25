import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { HomeScreen } from "@/components/apps/HomeScreen";

const Index = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <HomeScreen />;
};

export default Index;
