import { useAuth } from "@/contexts/AuthContext";
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
    // Redirect to auth page instead of showing LoginForm directly
    window.location.href = '/auth';
    return null;
  }
  
  return <HomeScreen />;
};

export default Index;
