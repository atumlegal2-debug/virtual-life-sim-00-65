import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PregnancyData {
  id: string;
  user_id: string;
  pregnancy_percentage: number;
  created_at: string;
  updated_at: string;
}

interface BirthRequest {
  id: string;
  user_id: string;
  username: string;
  request_message: string;
  status: "pending" | "accepted" | "rejected";
  manager_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

interface PregnancyContextType {
  pregnancyData: PregnancyData | null;
  birthRequests: BirthRequest[];
  createPregnancy: () => Promise<void>;
  updatePregnancy: (percentage: number) => Promise<void>;
  sendBirthRequest: () => Promise<void>;
  fetchPregnancyData: () => Promise<void>;
  fetchBirthRequests: () => Promise<void>;
  resetPregnancy: () => Promise<void>;
  isPregnant: boolean;
  canGiveBirth: boolean;
}

const PregnancyContext = createContext<PregnancyContextType | undefined>(undefined);

export function PregnancyProvider({ children }: { children: ReactNode }) {
  const [pregnancyData, setPregnancyData] = useState<PregnancyData | null>(null);
  const [birthRequests, setBirthRequests] = useState<BirthRequest[]>([]);
  const { toast } = useToast();

  const isPregnant = pregnancyData !== null && pregnancyData.pregnancy_percentage > 0;
  const canGiveBirth = pregnancyData !== null && pregnancyData.pregnancy_percentage >= 100;

  const fetchPregnancyData = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const { data, error } = await supabase.rpc('get_user_pregnancy', {
        p_username: currentUser
      });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pregnancy data:', error);
        return;
      }

      setPregnancyData(data);
    } catch (error) {
      console.error('Error fetching pregnancy data:', error);
    }
  };

  const fetchBirthRequests = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Get current user's ID from users table
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (!userData) return;

      const { data, error } = await supabase
        .from('hospital_birth_requests')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching birth requests:', error);
        return;
      }

      const requests = data?.map(item => ({
        ...item,
        status: item.status as "pending" | "accepted" | "rejected"
      })) || [];

      console.log('Birth requests loaded:', requests);
      setBirthRequests(requests);

      // Check if the latest request was accepted and reset pregnancy automatically
      const latestRequest = requests[0];
      if (latestRequest && latestRequest.status === 'accepted' && pregnancyData && !latestRequest.processed_at) {
        console.log('Birth request accepted, resetting pregnancy...');
        setPregnancyData(null);
        
        // Mark as processed to avoid repeated notifications
        await supabase
          .from('hospital_birth_requests')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', latestRequest.id);
          
        toast({
          title: "Parto realizado! 🎉",
          description: "Seu bebê nasceu no hospital!"
        });
      }
    } catch (error) {
      console.error('Error fetching birth requests:', error);
    }
  };

  const createPregnancy = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const { data, error } = await supabase.rpc('create_user_pregnancy', {
        p_username: currentUser,
        p_percentage: 1.0
      });

      if (error) {
        console.error('Error creating pregnancy:', error);
        // Se já existir (duplicado), apenas atualiza os dados e não mostra erro
        // 23505 = unique_violation
        // Alguns ambientes retornam a mensagem com "duplicate key"
        if ((error as any).code === '23505' || (error as any).message?.includes('duplicate key')) {
          await fetchPregnancyData();
          return;
        }
        // Outros erros: apenas logar sem exibir toast destrutivo
        return;
      }

      setPregnancyData(data);
      toast({
        title: "Gravidez iniciada! 🤰",
        description: "Sua jornada maternal começou!"
      });
    } catch (error) {
      console.error('Error creating pregnancy:', error);
    }
  };

  const updatePregnancy = async (percentage: number) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const { data, error } = await supabase.rpc('update_user_pregnancy', {
        p_username: currentUser,
        p_percentage: percentage
      });

      if (error) {
        console.error('Error updating pregnancy via RPC:', error);
        return;
      }

      if (data) setPregnancyData(data as any);
    } catch (error) {
      console.error('Error updating pregnancy:', error);
    }
  };

  const sendBirthRequest = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser || !pregnancyData) return;

      // Get display name (remove last 4 digits)
      const getDisplayName = (username: string) => {
        if (!username) return 'Usuário desconhecido';
        return username.length > 4 ? username.slice(0, -4) : username;
      };

      // Get current user's ID and check balance
      const { data: userData } = await supabase
        .from('users')
        .select('id, wallet_balance')
        .eq('username', currentUser)
        .maybeSingle();

      if (!userData) return;

      // Check if user has enough money (300 CM)
      if (userData.wallet_balance < 300) {
        toast({
          title: "Saldo insuficiente",
          description: "Você precisa de 300 CM para ir ao hospital",
          variant: "destructive"
        });
        return;
      }

      // Deduct 300 CM from user's balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ wallet_balance: userData.wallet_balance - 300 })
        .eq('id', userData.id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        toast({
          title: "Erro",
          description: "Não foi possível processar o pagamento",
          variant: "destructive"
        });
        return;
      }

      const displayName = getDisplayName(currentUser);
      const { error } = await supabase
        .from('hospital_birth_requests')
        .insert({
          user_id: userData.id,
          username: currentUser,
          request_message: `${displayName} está pronta para o parto e precisa de assistência médica. (Pagamento: 300 CM)`
        });

      if (error) {
        console.error('Error sending birth request:', error);
        // Refund the money if birth request fails
        await supabase
          .from('users')
          .update({ wallet_balance: userData.wallet_balance })
          .eq('id', userData.id);
        
        toast({
          title: "Erro",
          description: "Não foi possível enviar solicitação ao hospital",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Solicitação enviada! 🏥",
        description: "300 CM foram descontados. Aguarde a resposta dos médicos"
      });

      await fetchBirthRequests();
    } catch (error) {
      console.error('Error sending birth request:', error);
    }
  };

  const resetPregnancy = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Use the new RPC function to reset pregnancy
      const { data, error } = await supabase.rpc('reset_user_pregnancy', {
        p_username: currentUser
      });

      if (error) {
        console.error('Error resetting pregnancy:', error);
        toast({
          title: "Erro",
          description: "Não foi possível resetar a gravidez",
          variant: "destructive"
        });
        return;
      }

      setPregnancyData(null);
      toast({
        title: "Gravidez resetada",
        description: "Você não está mais grávida"
      });
    } catch (error) {
      console.error('Error resetting pregnancy:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resetar a gravidez",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      fetchPregnancyData();
      fetchBirthRequests();
    } else {
      // Clear data when no user is logged in
      setPregnancyData(null);
      setBirthRequests([]);
    }
  }, []);

  // Listen for user changes and refresh data
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        fetchPregnancyData();
        fetchBirthRequests();
      } else {
        setPregnancyData(null);
        setBirthRequests([]);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (in case the same tab changes user)
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  // Auto-refresh birth requests every 5 seconds to check for status updates
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const interval = setInterval(() => {
      fetchBirthRequests();
      fetchPregnancyData(); // Also refresh pregnancy data in case it was deleted
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PregnancyContext.Provider value={{
      pregnancyData,
      birthRequests,
      createPregnancy,
      updatePregnancy,
      sendBirthRequest,
      fetchPregnancyData,
      fetchBirthRequests,
      resetPregnancy,
      isPregnant,
      canGiveBirth
    }}>
      {children}
    </PregnancyContext.Provider>
  );
}

export function usePregnancy() {
  const context = useContext(PregnancyContext);
  if (context === undefined) {
    throw new Error('usePregnancy must be used within a PregnancyProvider');
  }
  return context;
}