import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, DollarSign, ShoppingBag, CheckCircle, XCircle, Heart, Baby, Clock, Send, Save, LogOut, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STORES } from "@/data/stores";

interface ManagerAppProps {
  onBack: () => void;
}

interface Order {
  id: string;
  user_id: string;
  store_id: string;
  items: any;
  total_amount: number;
  status: string;
  manager_approved: boolean | null;
  manager_notes: string | null;
  created_at: string;
  buyer_username?: string;
  users?: { username: string };
}

interface Sale {
  id: string;
  buyer_username: string;
  item_name: string;
  amount: number;
  created_at: string;
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

interface TreatmentRequest {
  id: string;
  user_id: string;
  username: string;
  treatment_type: string;
  treatment_cost: number;
  request_message: string;
  status: "pending" | "accepted" | "rejected";
  manager_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export function ManagerApp({ onBack }: ManagerAppProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [currentManager, setCurrentManager] = useState<any>(null);
  const [savedLogins, setSavedLogins] = useState<string[]>([]);
  const [showSavedLogins, setShowSavedLogins] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [birthRequests, setBirthRequests] = useState<BirthRequest[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [currentView, setCurrentView] = useState<"dashboard" | "orders" | "sales" | "hospital" | "treatments" | "transfers" | "patient-history" | "motoboy-orders">("dashboard");
  const [motoboyOrders, setMotoboyOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("");
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const { toast } = useToast();

  // Timer for motoboy orders countdown
  useEffect(() => {
    if (currentView === "motoboy-orders" && motoboyOrders.length > 0) {
      const interval = setInterval(() => {
        // Force re-render to update countdown timers
        setMotoboyOrders(prev => [...prev]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentView, motoboyOrders.length]);

  // Load saved logins from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('managerSavedLogins');
    if (saved) {
      setSavedLogins(JSON.parse(saved));
    }
  }, []);

  const saveLogin = (username: string) => {
    const updated = [...savedLogins.filter(u => u !== username), username];
    setSavedLogins(updated);
    localStorage.setItem('managerSavedLogins', JSON.stringify(updated));
    toast({
      title: "Login salvo!",
      description: "Este usuário foi salvo para acesso rápido.",
    });
  };

  const removeSavedLogin = (username: string) => {
    const updated = savedLogins.filter(u => u !== username);
    setSavedLogins(updated);
    localStorage.setItem('managerSavedLogins', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentManager(null);
    setUsername("");
    setCurrentView("dashboard");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do painel gerencial.",
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-BR').format(amount);
  };

  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState<Set<string>>(new Set());

  const getDisplayName = (username: string) => {
    if (!username) return 'Usuário desconhecido';
    // Se já temos o display name carregado, usar ele
    if (displayNames[username]) return displayNames[username];
    
    // Se está carregando, usar fallback temporário
    if (loadingNames.has(username)) {
      const hasCodeSuffix = /\d{4}$/.test(username);
      return hasCodeSuffix ? username.slice(0, -4) : username;
    }
    
    // Carregar o nome se não temos ele
    loadDisplayNameForUser(username);
    
    // Retornar fallback enquanto carrega
    const hasCodeSuffix = /\d{4}$/.test(username);
    return hasCodeSuffix ? username.slice(0, -4) : username;
  };

  const loadDisplayNameForUser = async (username: string) => {
    if (!username || displayNames[username] || loadingNames.has(username)) {
      return displayNames[username] || username;
    }
    
    // Marcar como carregando
    setLoadingNames(prev => new Set([...prev, username]));
    
    try {
      const { data } = await supabase
        .from('users')
        .select('nickname')
        .eq('username', username)
        .maybeSingle();
      
      // Se tem nickname, usar ele. Senão, verificar se tem código de 4 dígitos no final
      let displayName;
      if (data?.nickname) {
        displayName = data.nickname;
      } else {
        // Só remover os últimos 4 caracteres se forem dígitos
        const hasCodeSuffix = /\d{4}$/.test(username);
        displayName = hasCodeSuffix ? username.slice(0, -4) : username;
      }
      
      setDisplayNames(prev => ({ ...prev, [username]: displayName }));
      return displayName;
    } catch {
      // Só remover os últimos 4 caracteres se forem dígitos  
      const hasCodeSuffix = /\d{4}$/.test(username);
      const fallbackName = hasCodeSuffix ? username.slice(0, -4) : username;
      setDisplayNames(prev => ({ ...prev, [username]: fallbackName }));
      return fallbackName;
    } finally {
      // Remover da lista de carregamento
      setLoadingNames(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  };

  const handleLogin = async () => {
    try {
      console.log('Tentando login com usuário:', username);

      // Buscar gerente pelo username
      const { data: manager, error: managerError } = await supabase
        .from('store_managers')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      console.log('Resultado manager:', { manager, managerError });

      if (managerError) {
        console.error('Erro na consulta de gerente:', managerError);
        toast({
          title: "Erro no sistema",
          description: "Erro ao verificar credenciais. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!manager) {
        toast({
          title: "Usuário inválido",
          description: "Verifique o nome do usuário gerente.",
          variant: "destructive",
        });
        return;
      }

      setCurrentManager(manager);
      setIsLoggedIn(true);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo ao painel gerencial, ${manager.username}!`,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const loadPendingOrders = async () => {
    if (!currentManager) return;

    try {
      console.log('=== CARREGANDO PEDIDOS PENDENTES ===');
      console.log('currentManager:', currentManager);
      console.log('Buscando pedidos para store_id:', currentManager.store_id);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!inner(username)
        `)
        .eq('store_id', currentManager.store_id)
        .is('manager_approved', null)
        .order('created_at', { ascending: false });

      console.log('Resultado da busca de pedidos:', { data, error });

      if (error) throw error;

      const ordersWithUsername = (data || []).map((order) => ({
        ...order,
        buyer_username: getDisplayName(order.users?.username || 'Usuário desconhecido')
      }));

      console.log('Pedidos com username:', ordersWithUsername);
      setPendingOrders(ordersWithUsername);
      
      console.log('=== PEDIDOS CARREGADOS ===');
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const loadSalesHistory = async () => {
    if (!currentManager) return;

    try {
      const { data, error } = await supabase
        .from('manager_sales')
        .select('*')
        .eq('manager_id', currentManager.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSalesHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de vendas:', error);
    }
  };

  const approveOrder = async (order: Order) => {
    try {
      // Atualizar status do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          manager_approved: true,
          approved_at: new Date().toISOString(),
          status: 'approved'
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Transferir dinheiro do usuário para o gerente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', order.user_id)
        .single();

      if (userError) throw userError;

      if ((userData.wallet_balance || 0) < order.total_amount) {
        toast({
          title: "Saldo insuficiente",
          description: "O usuário não possui saldo suficiente.",
          variant: "destructive",
        });
        return;
      }

      // Descontar do usuário
      const newUserBalance = (userData.wallet_balance || 0) - order.total_amount;
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ wallet_balance: newUserBalance })
        .eq('id', order.user_id);

      if (updateUserError) throw updateUserError;

      // Adicionar ao gerente
      const newManagerBalance = (currentManager.balance || 0) + order.total_amount;
      const { error: updateManagerError } = await supabase
        .from('store_managers')
        .update({ balance: newManagerBalance })
        .eq('id', currentManager.id);

      if (updateManagerError) throw updateManagerError;

      // Adicionar itens ao inventário do usuário
      const items = Array.isArray(order.items) ? order.items : [];
      
      for (const item of items) {
        const { data: existingItem } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', order.user_id)
          .eq('item_id', item.id)
          .single();

        if (existingItem) {
          await supabase
            .from('inventory')
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq('id', existingItem.id);
        } else {
          await supabase
            .from('inventory')
            .insert({
              user_id: order.user_id,
              item_id: item.id,
              quantity: item.quantity
            });
        }
      }

      // Registrar venda
      for (const item of items) {
        await supabase
          .from('manager_sales')
          .insert({
            manager_id: currentManager.id,
            order_id: order.id,
            buyer_username: order.buyer_username || 'Usuário',
            item_name: item.name,
            amount: item.price * item.quantity
          });
      }

      // Registrar transação de compra do usuário
      const storeName = STORES[order.store_id as keyof typeof STORES]?.name || order.store_id;
      const itemNames = items.map(item => item.name).join(', ');
      await supabase
        .from('transactions')
        .insert({
          from_user_id: order.user_id,
          to_user_id: order.user_id, // Self transaction for purchases
          from_username: order.buyer_username || 'Usuário',
          to_username: 'Sistema',
          amount: order.total_amount,
          transaction_type: 'purchase',
          description: `Compra na ${storeName}: ${itemNames}`
        });

      setCurrentManager({ ...currentManager, balance: newManagerBalance });
      
      toast({
        title: "Pedido aprovado!",
        description: `Transferência de ${formatMoney(order.total_amount)} CM realizada.`,
      });

      loadPendingOrders();
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
      toast({
        title: "Erro ao aprovar pedido",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          manager_approved: false,
          status: 'rejected'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pedido rejeitado",
        description: "O pedido foi rejeitado com sucesso.",
      });

      loadPendingOrders();
    } catch (error) {
      console.error('Erro ao rejeitar pedido:', error);
      toast({
        title: "Erro ao rejeitar pedido",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const loadBirthRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_birth_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBirthRequests(data?.map(item => ({
        ...item,
        status: item.status as "pending" | "accepted" | "rejected"
      })) || []);
    } catch (error) {
      console.error('Error fetching birth requests:', error);
    }
  };

  const loadTreatmentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_treatment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreatmentRequests(data?.map(item => ({
        ...item,
        status: item.status as "pending" | "accepted" | "rejected"
      })) || []);
    } catch (error) {
      console.error('Error fetching treatment requests:', error);
    }
  };

  const handleBirthRequest = async (requestId: string, action: 'accept' | 'reject', notes?: string) => {
    try {
      const { error } = await supabase
        .from('hospital_birth_requests')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          manager_notes: notes,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      if (action === 'accept') {
        const request = birthRequests.find(r => r.id === requestId);
        if (request) {
          const { error: pregnancyError } = await supabase
            .from('user_pregnancy')
            .delete()
            .eq('user_id', request.user_id);

          if (pregnancyError) {
            console.error('Error resetting pregnancy:', pregnancyError);
          }
        }
      }

      toast({
        title: action === 'accept' ? "Solicitação aceita! ✅" : "Solicitação rejeitada ❌",
        description: action === 'accept' 
          ? "O parto foi autorizado e a gravidez foi finalizada" 
          : "A solicitação foi rejeitada"
      });

      await loadBirthRequests();
    } catch (error) {
      console.error('Error handling birth request:', error);
    }
  };

  const handleTreatmentRequest = async (requestId: string, action: 'accept' | 'reject', notes?: string) => {
    try {
      const request = treatmentRequests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'accept') {
        // Get user data and check balance
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', request.user_id)
          .single();

        if (userError) throw userError;

        if ((userData.wallet_balance || 0) < request.treatment_cost) {
          toast({
            title: "Saldo insuficiente",
            description: "O usuário não possui saldo suficiente.",
            variant: "destructive",
          });
          return;
        }

        // Deduct money from user
        const newUserBalance = (userData.wallet_balance || 0) - request.treatment_cost;
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ wallet_balance: newUserBalance })
          .eq('id', request.user_id);

        if (updateUserError) throw updateUserError;

        // Apply health benefits based on treatment type
        let healthGain = 0;
        if (request.treatment_type === "Check-up Básico") healthGain = 10;
        else if (request.treatment_type === "Consulta Especializada") healthGain = 25;
        else if (request.treatment_type === "Cirurgia") healthGain = 50;
        else if (request.treatment_type.includes("Cura para")) healthGain = 20;

        if (healthGain > 0) {
          const { data: currentUserData } = await supabase
            .from('users')
            .select('life_percentage, hunger_percentage, disease_percentage')
            .eq('id', request.user_id)
            .single();

          const newHealth = Math.min(100, (currentUserData?.life_percentage || 100) + healthGain);

          // If treatment is for hunger disease, also boost hunger and reduce disease
          if (request.treatment_type.includes('Desnutrição')) {
            const newHunger = Math.min(100, (currentUserData?.hunger_percentage || 0) + 60);
            const newDisease = Math.max(0, (currentUserData?.disease_percentage || 0) - 15);
            await supabase
              .from('users')
              .update({ life_percentage: newHealth, hunger_percentage: newHunger, disease_percentage: newDisease })
              .eq('id', request.user_id);
          } else {
            await supabase
              .from('users')
              .update({ life_percentage: newHealth })
              .eq('id', request.user_id);
          }
        }
      }

      const { error } = await supabase
        .from('hospital_treatment_requests')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          manager_notes: notes || (action === 'accept' ? 'Tratamento autorizado' : 'Tratamento rejeitado'),
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: action === 'accept' ? "Tratamento aprovado! ✅" : "Tratamento rejeitado ❌",
        description: action === 'accept' 
          ? `${request.treatment_type} foi autorizado e aplicado` 
          : "A solicitação foi rejeitada"
      });

      await loadTreatmentRequests();
    } catch (error) {
      console.error('Error handling treatment request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação",
        variant: "destructive"
      });
    }
  };

  const loadMotoboyOrders = async () => {
    if (!currentManager) return;
    
    try {
      const { data, error } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('store_id', currentManager.store_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load display names for all customers using optimized cache
      const ordersWithDisplayNames = (data || []).map(order => ({
        ...order,
        // Use getDisplayName which handles caching automatically
        customer_display_name: order.customer_username ? getDisplayName(order.customer_username) : order.customer_username
      }));
      
      setMotoboyOrders(ordersWithDisplayNames);
    } catch (error) {
      console.error('Error loading motoboy orders:', error);
    }
  };

  const loadPatientHistory = async () => {
    try {
      // Load all treatment and birth requests for patient history
      const [treatmentRes, birthRes] = await Promise.all([
        supabase
          .from('hospital_treatment_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('hospital_birth_requests')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      const treatments = treatmentRes.data?.map(item => ({
        ...item,
        type: 'treatment',
        service: item.treatment_type,
        cost: item.treatment_cost
      })) || [];

      const births = birthRes.data?.map(item => ({
        ...item,
        type: 'birth',
        service: 'Parto',
        cost: 0
      })) || [];

      const combined = [...treatments, ...births].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPatientHistory(combined);
    } catch (error) {
      console.error('Error loading patient history:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, wallet_balance')
        .order('username');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const sendMoneyFromStore = async () => {
    const amount = Number(transferAmount);
    
    if (!selectedUser || amount <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e um valor válido.",
        variant: "destructive",
      });
      return;
    }

    if (amount > (currentManager?.balance || 0)) {
      toast({
        title: "Saldo insuficiente",
        description: "O estabelecimento não possui saldo suficiente.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the edge function for secure transfer
      const { data, error } = await supabase.functions.invoke('manager-transfer', {
        body: {
          managerId: currentManager.id,
          storeId: currentManager.store_id,
          receiverUserId: selectedUser,
          amount: amount
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Update local state with new balances
      setCurrentManager({ 
        ...currentManager, 
        balance: data.data.newManagerBalance 
      });
      
      setSelectedUser("");
      setTransferAmount("");
      
      toast({
        title: "Transferência realizada!",
        description: `${formatMoney(amount)} CM enviados para ${getDisplayName(data.data.receiverUsername)}.`,
      });

      loadUsers();
    } catch (error) {
      console.error('Erro ao enviar dinheiro:', error);
      toast({
        title: "Erro na transferência",
        description: error.message || "Não foi possível completar a transferência.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isLoggedIn && currentManager) {
      loadPendingOrders();
      loadSalesHistory();
      loadMotoboyOrders(); // Load motoboy orders on login
      if (currentManager.store_id === 'hospital') {
        loadBirthRequests();
        loadTreatmentRequests();
      }
    }
    if (currentView === "transfers") {
      loadUsers();
    }
    if (currentView === "patient-history") {
      loadPatientHistory();
    }
    if (currentView === "motoboy-orders") {
      loadMotoboyOrders();
    }
  }, [isLoggedIn, currentManager, currentView]);

  // Real-time subscriptions for motoboy orders
  useEffect(() => {
    if (!isLoggedIn || !currentManager) return;

    console.log('=== CONFIGURANDO SUBSCRIPTION PARA MOTOBOY ORDERS ===');
    console.log('Store ID:', currentManager.store_id);

    const subscription = supabase
      .channel('motoboy_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motoboy_orders',
          filter: `store_id=eq.${currentManager.store_id}`
        },
        (payload) => {
          console.log('=== MOTOBOY ORDER UPDATE RECEIVED ===');
          console.log('Payload:', payload);
          
          toast({
            title: "Novo pedido de motoboy!",
            description: "Um novo pedido foi recebido.",
          });
          
          // Reload motoboy orders
          loadMotoboyOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('=== REMOVENDO SUBSCRIPTION MOTOBOY ORDERS ===');
      subscription.unsubscribe();
    };
  }, [isLoggedIn, currentManager]);

  // Hospital Management View
  if (currentView === "hospital") {
    const pendingBirthRequests = birthRequests.filter(r => r.status === 'pending');
    const processedBirthRequests = birthRequests.filter(r => r.status !== 'pending');
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Gerenciamento Hospitalar</h1>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* Pending Birth Requests */}
          {pendingBirthRequests.length > 0 && (
            <Card className="bg-yellow-800 border-yellow-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Solicitações de Parto Pendentes ({pendingBirthRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingBirthRequests.map((request) => (
                  <div key={request.id} className="bg-yellow-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">{getDisplayName(request.username)}</h4>
                        <p className="text-sm text-yellow-300">{request.request_message}</p>
                        <p className="text-xs text-yellow-400 mt-1">
                          {new Date(request.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-600 text-yellow-100">
                        Pendente
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleBirthRequest(request.id, 'accept', 'Parto autorizado pelos médicos')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Aceitar Parto
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBirthRequest(request.id, 'reject', 'Solicitação rejeitada pela equipe médica')}
                        className="flex-1"
                      >
                        <XCircle size={16} className="mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Processed Birth Requests */}
          {processedBirthRequests.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Solicitações de Parto Processadas ({processedBirthRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {processedBirthRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white text-sm">{getDisplayName(request.username)}</h4>
                        <p className="text-xs text-gray-300">{request.manager_notes}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(request.processed_at || request.updated_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge 
                        variant={request.status === 'accepted' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {request.status === 'accepted' ? '✅ Aceito' : '❌ Rejeitado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingBirthRequests.length === 0 && processedBirthRequests.length === 0 && (
            <Card className="bg-red-800 border-red-700">
              <CardContent className="pt-6 text-center">
                <Baby className="h-16 w-16 mx-auto text-red-400 mb-4" />
                <p className="text-red-300">Nenhuma solicitação de parto no momento</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Treatment Requests View
  if (currentView === "treatments") {
    const pendingTreatments = treatmentRequests.filter(r => r.status === 'pending');
    const processedTreatments = treatmentRequests.filter(r => r.status !== 'pending');
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Solicitações de Tratamento</h1>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* Pending Treatment Requests */}
          {pendingTreatments.length > 0 && (
            <Card className="bg-blue-800 border-blue-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Tratamentos Pendentes ({pendingTreatments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingTreatments.map((request) => (
                  <div key={request.id} className="bg-blue-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">{getDisplayName(request.username)}</h4>
                        <p className="text-sm text-blue-300">{request.treatment_type}</p>
                        <p className="text-sm text-blue-200">Custo: {request.treatment_cost} C'M</p>
                        <p className="text-xs text-blue-400 mt-1">
                          {new Date(request.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-600 text-blue-100">
                        Pendente
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleTreatmentRequest(request.id, 'accept')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Aprovar Tratamento
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTreatmentRequest(request.id, 'reject')}
                        className="flex-1"
                      >
                        <XCircle size={16} className="mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Processed Treatment Requests */}
          {processedTreatments.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Tratamentos Processados ({processedTreatments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {processedTreatments.slice(0, 10).map((request) => (
                  <div key={request.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white text-sm">{getDisplayName(request.username)}</h4>
                        <p className="text-xs text-gray-300">{request.treatment_type} - {request.treatment_cost} C'M</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(request.processed_at || request.updated_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge 
                        variant={request.status === 'accepted' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {request.status === 'accepted' ? '✅ Aprovado' : '❌ Rejeitado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingTreatments.length === 0 && processedTreatments.length === 0 && (
            <Card className="bg-blue-800 border-blue-700">
              <CardContent className="pt-6 text-center">
                <Heart className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                <p className="text-blue-300">Nenhuma solicitação de tratamento no momento</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Transfers View
  if (currentView === "transfers") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Enviar Dinheiro da Loja</h1>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Saldo da Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <DollarSign size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatMoney(currentManager?.balance || 0)} CM
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Disponível para transferência
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Selecionar Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant={selectedUser === user.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedUser(user.id)}
                >
                  {getDisplayName(user.username)} - {formatMoney(user.wallet_balance || 0)} CM
                </Button>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Carregando usuários...
                </p>
              )}
            </CardContent>
          </Card>

          {selectedUser && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Valor a Enviar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => {
                        setTransferAmount(amount.toString());
                        sendMoneyFromStore();
                      }}
                      disabled={amount > (currentManager?.balance || 0)}
                    >
                      {formatMoney(amount)} CM
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Valor personalizado"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  <Button
                    onClick={sendMoneyFromStore}
                    disabled={!transferAmount || Number(transferAmount) <= 0}
                  >
                    <Send size={16} className="mr-2" />
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Motoboy Orders View
  if (currentView === "motoboy-orders") {
    const pendingMotoboyOrders = motoboyOrders.filter(o => o.manager_status === 'pending');
    const processedMotoboyOrders = motoboyOrders.filter(o => o.manager_status !== 'pending');

    const handleMotoboyOrder = async (orderId: string, action: 'accept' | 'reject', notes?: string) => {
      try {
        const { error } = await supabase
          .from('motoboy_orders')
          .update({ 
            manager_status: action === 'accept' ? 'approved' : 'rejected',
            manager_notes: notes || (action === 'accept' ? 'Pedido aprovado para entrega' : 'Pedido rejeitado'),
            manager_processed_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) throw error;

        toast({
          title: action === 'accept' ? "Pedido aprovado! ✅" : "Pedido rejeitado ❌",
          description: action === 'accept' 
            ? "O pedido foi liberado para o motoboy" 
            : "O pedido foi rejeitado"
        });

        // Reload orders to update the list
        loadMotoboyOrders();

        await loadMotoboyOrders();
      } catch (error) {
        console.error('Error handling motoboy order:', error);
        toast({
          title: "Erro",
          description: "Não foi possível processar o pedido",
          variant: "destructive"
        });
      }
    };
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Pedidos de Motoboy</h1>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* Pending Motoboy Orders */}
          {pendingMotoboyOrders.length > 0 && (
            <Card className="bg-orange-800 border-orange-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Pedidos Pendentes ({pendingMotoboyOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMotoboyOrders.map((order) => {
                  const createdAt = new Date(order.created_at).getTime();
                  const now = Date.now();
                  const elapsedSeconds = Math.floor((now - createdAt) / 1000);
                  const remainingSeconds = Math.max(0, 60 - elapsedSeconds);
                  const remainingMinutes = Math.floor(remainingSeconds / 60);
                  const displaySeconds = remainingSeconds % 60;
                  
                  return (
                    <div key={order.id} className="bg-orange-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-white">{getDisplayName(order.customer_username)}</h4>
                          <p className="text-sm text-orange-300">Endereço: {order.delivery_address || 'Não informado'}</p>
                          <p className="text-sm text-orange-200">Total: {formatMoney(order.total_amount)} CM</p>
                          <p className="text-xs text-orange-400 mt-1">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary" className="bg-orange-600 text-orange-100">
                            Pendente
                          </Badge>
                          {remainingSeconds > 0 ? (
                            <div className="flex items-center gap-1 text-white bg-orange-600 px-2 py-1 rounded text-xs">
                              <Clock size={12} />
                              <span>{remainingMinutes}:{displaySeconds.toString().padStart(2, '0')}</span>
                            </div>
                          ) : (
                            <div className="text-red-300 text-xs font-bold">
                              TEMPO EXPIRADO
                            </div>
                          )}
                        </div>
                      </div>
                    
                    {/* Items */}
                    <div className="mb-3 p-2 bg-orange-600 rounded">
                      <p className="text-xs text-orange-200 mb-1">1 minuto:</p>
                      {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs text-white">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{formatMoney(item.price * item.quantity)} CM</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMotoboyOrder(order.id, 'accept')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Aprovar para Entrega
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMotoboyOrder(order.id, 'reject')}
                        className="flex-1"
                      >
                        <XCircle size={16} className="mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Processed Motoboy Orders */}
          {processedMotoboyOrders.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Pedidos Processados ({processedMotoboyOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {processedMotoboyOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white text-sm">{getDisplayName(order.customer_username)}</h4>
                        <p className="text-xs text-gray-300">{formatMoney(order.total_amount)} CM</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(order.manager_processed_at || order.updated_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge 
                        variant={order.manager_status === 'accepted' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {order.manager_status === 'accepted' ? '✅ Aprovado' : '❌ Rejeitado'}
                      </Badge>
                    </div>
                    {order.manager_notes && (
                      <p className="text-xs text-gray-400 mt-1">{order.manager_notes}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingMotoboyOrders.length === 0 && processedMotoboyOrders.length === 0 && (
            <Card className="bg-orange-800 border-orange-700">
              <CardContent className="pt-6 text-center">
                <Truck className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                <p className="text-orange-300">Nenhum pedido de motoboy no momento</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Painel Gerencial</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-gradient-card border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={32} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Login do Gerente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved Logins */}
              {savedLogins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Logins Salvos:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSavedLogins(!showSavedLogins)}
                    >
                      {showSavedLogins ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>
                  {showSavedLogins && (
                    <div className="space-y-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                      {savedLogins.map((savedUsername) => (
                        <div key={savedUsername} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start text-left"
                            onClick={() => {
                              setUsername(savedUsername);
                              setShowSavedLogins(false);
                            }}
                          >
                            {savedUsername}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSavedLogin(savedUsername)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  placeholder="Usuário do Gerente"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                {username && !savedLogins.includes(username) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveLogin(username)}
                    className="w-full text-xs"
                  >
                    <Save size={12} className="mr-1" />
                    Salvar este login
                  </Button>
                )}
              </div>
              
              <Button onClick={handleLogin} className="w-full" disabled={!username.trim()}>
                Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === "orders") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Pedidos Pendentes</h1>
        </div>

        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhum pedido pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map((order) => (
              <Card key={order.id} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">
                        Pedido de {order.buyer_username}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatMoney(order.total_amount)} CM
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {(Array.isArray(order.items) ? order.items : []).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatMoney(item.price * item.quantity)} CM</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveOrder(order)}
                      className="flex-1"
                      size="sm"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => rejectOrder(order.id)}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <XCircle size={16} className="mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  if (currentView === "sales") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Histórico de Vendas</h1>
        </div>

        <Card className="bg-gradient-card border-border/50 flex-1">
          <CardContent className="space-y-2 p-4">
            {salesHistory.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhuma venda realizada</p>
            ) : (
              salesHistory.map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-background/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {sale.buyer_username} - {sale.item_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {formatMoney(sale.amount)} CM
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Patient History View (Hospital only)
  if (currentView === "patient-history" && currentManager?.store_id === 'hospital') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Histórico de Pacientes</h1>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {patientHistory.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="text-center py-8">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum histórico de paciente encontrado</p>
              </CardContent>
            </Card>
          ) : (
            patientHistory.map((record) => (
              <Card key={record.id} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">
                        {getDisplayName(record.username)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        record.status === 'accepted' ? 'default' : 
                        record.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {record.type === 'birth' ? '👶 Parto' : '💊 Tratamento'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Serviço:</span>
                    <span className="font-medium">{record.service}</span>
                  </div>
                  {record.cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Custo:</span>
                      <span className="font-medium">{formatMoney(record.cost)} CM</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      record.status === 'accepted' ? 'text-green-600' : 
                      record.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {record.status === 'accepted' ? '✅ Aprovado' : 
                       record.status === 'rejected' ? '❌ Rejeitado' : '⏳ Pendente'}
                    </span>
                  </div>
                  {record.manager_notes && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                      <span className="text-muted-foreground">Observações: </span>
                      <span>{record.manager_notes}</span>
                    </div>
                  )}
                  {record.processed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processado em: {new Date(record.processed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Painel - {currentManager.username}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />
          Sair
        </Button>
      </div>

      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Saldo Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(currentManager.balance || 0)} CM
              </p>
              <p className="text-xs text-muted-foreground">
                Receita da loja
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setCurrentView("orders")}
        >
          <ShoppingBag size={16} className="mr-2" />
          Pedidos Pendentes ({pendingOrders.length})
        </Button>
        
        {/* Show motoboy orders for non-hospital stores */}
        {currentManager?.store_id !== 'hospital' && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setCurrentView("motoboy-orders")}
          >
            <Truck size={16} className="mr-2" />
            Pedidos do Motoboy ({motoboyOrders.filter(o => o.manager_status === 'pending').length})
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setCurrentView("sales")}
        >
          <DollarSign size={16} className="mr-2" />
          Histórico de Vendas
        </Button>
        {/* Hospital-specific options */}
        {currentManager.store_id === 'hospital' && (
          <>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setCurrentView("hospital")}
            >
              <Baby size={16} className="mr-2" />
              Gerenciamento Hospitalar ({birthRequests.filter(r => r.status === 'pending').length})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setCurrentView("treatments")}
            >
              <Heart size={16} className="mr-2" />
              Solicitações de Tratamento ({treatmentRequests.filter(r => r.status === 'pending').length})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setCurrentView("patient-history")}
            >
              <Clock size={16} className="mr-2" />
              Histórico de Pacientes
            </Button>
          </>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setCurrentView("transfers")}
        >
          <Send size={16} className="mr-2" />
          Enviar Dinheiro da Loja
        </Button>
      </div>
    </div>
  );
}