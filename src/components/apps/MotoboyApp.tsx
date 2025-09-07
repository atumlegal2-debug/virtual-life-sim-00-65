import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Truck, MapPin, Clock, Package, Lock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfileModal } from "@/components/modals/UserProfileModal";

interface MotoboyAppProps {
  onBack: () => void;
}

interface MotoboyOrder {
  id: string;
  order_id: string;
  store_id: string;
  customer_name: string;
  customer_username: string;
  items: any;
  total_amount: number;
  delivery_address?: string;
  manager_status: string;
  motoboy_status: string;
  created_at: string;
}

export function MotoboyApp({ onBack }: MotoboyAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(false);
  const [orders, setOrders] = useState<MotoboyOrder[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<MotoboyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ userId: string, username: string } | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, { avatar?: string, nickname?: string, id: string }>>({});
  const [processingDeliveries, setProcessingDeliveries] = useState(false);
  const { toast } = useToast();

  const getDisplayName = (username: string) => {
    if (!username) return 'Cliente desconhecido';
    
    // Se já tem o display name carregado, usa ele
    if (displayNames[username]) {
      console.log('Display name encontrado no cache:', username, '->', displayNames[username]);
      return displayNames[username];
    }
    
    // Fallback: remove últimos 4 dígitos se terminar com números
    const hasCodeSuffix = /\d{4}$/.test(username);
    const fallback = hasCodeSuffix ? username.slice(0, -4) : username;
    console.log('Usando fallback para:', username, '->', fallback);
    return fallback;
  };

  const groupOrdersByClient = (orders: MotoboyOrder[]) => {
    const groups: { [key: string]: { orders: MotoboyOrder[], totalAmount: number, customerData: { username: string, displayName: string, profile: any } } } = {};
    
    orders.forEach(order => {
      const username = order.customer_name || order.customer_username;
      
      if (!groups[username]) {
        const userProfile = userProfiles[username];
        const displayName = getDisplayName(username);
        
        groups[username] = {
          orders: [],
          totalAmount: 0,
          customerData: {
            username,
            displayName,
            profile: userProfile
          }
        };
      }
      
      groups[username].orders.push(order);
      groups[username].totalAmount += order.total_amount;
    });
    
    return Object.values(groups);
  };

  const groupOrdersByItems = (orders: MotoboyOrder[]) => {
    const groups: { [key: string]: { orders: MotoboyOrder[], totalAmount: number, customers: string[] } } = {};
    
    orders.forEach(order => {
      // Criar chave baseada nos itens do pedido
      const itemsKey = Array.isArray(order.items) 
        ? order.items.map((item: any) => `${item.name}`).sort().join('|')
        : 'no-items';
      
      if (!groups[itemsKey]) {
        groups[itemsKey] = {
          orders: [],
          totalAmount: 0,
          customers: []
        };
      }
      
      groups[itemsKey].orders.push(order);
      groups[itemsKey].totalAmount += order.total_amount;
      const customerName = getDisplayName(order.customer_name || order.customer_username);
      if (!groups[itemsKey].customers.includes(customerName)) {
        groups[itemsKey].customers.push(customerName);
      }
    });
    
    return Object.entries(groups).map(([itemsKey, group]) => ({
      id: `group-${itemsKey}`,
      itemsKey,
      orders: group.orders,
      totalAmount: group.totalAmount,
      customers: group.customers,
      items: group.orders[0]?.items || [],
      store_id: group.orders[0]?.store_id || '',
      created_at: group.orders[0]?.created_at || ''
    }));
  };

  const loadDisplayNameForUser = async (username: string) => {
    if (!username || displayNames[username]) return displayNames[username] || username;
    
    try {
      console.log('=== CARREGANDO DISPLAY NAME ===');
      console.log('Username:', username);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, nickname, avatar')
        .eq('username', username)
        .maybeSingle();
      
      console.log('Resultado da consulta:', { data, error });
      
      let displayName: string;
      
      if (error || !data) {
        // Fallback: remove últimos 4 dígitos do username se terminar com números
        const hasCodeSuffix = /\d{4}$/.test(username);
        displayName = hasCodeSuffix ? username.slice(0, -4) : username;
        console.log('Usando fallback:', displayName);
      } else {
        // Usa nickname se disponível, senão username sem dígitos
        const hasCodeSuffix = /\d{4}$/.test(username);
        displayName = data.nickname || (hasCodeSuffix ? username.slice(0, -4) : username);
        console.log('Nome final:', displayName, '(nickname:', data.nickname, ')');
        
        // Armazenar dados do perfil do usuário
        setUserProfiles(prev => ({ 
          ...prev, 
          [username]: { 
            id: data.id, 
            avatar: data.avatar, 
            nickname: data.nickname 
          } 
        }));
      }
      
      setDisplayNames(prev => ({ ...prev, [username]: displayName }));
      return displayName;
    } catch (error) {
      console.error('Error loading display name for user:', error);
      const fallbackName = username.length > 4 ? username.slice(0, -4) : username;
      setDisplayNames(prev => ({ ...prev, [username]: fallbackName }));
      return fallbackName;
    }
  };

  const handleUserClick = (username: string) => {
    const userProfile = userProfiles[username];
    if (userProfile) {
      setProfileModalUser({ userId: userProfile.id, username });
      setProfileModalOpen(true);
    }
  };

  useEffect(() => {
    // Check if login is saved
    const savedAuth = localStorage.getItem('motoboy_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadOrders();
    }
    
    // Load today's delivery count
    const today = new Date().toDateString();
    const savedDeliveries = localStorage.getItem(`motoboy_deliveries_${today}`);
    if (savedDeliveries) {
      setTodayDeliveries(parseInt(savedDeliveries, 10));
    }
  }, []);

  // Auto-refresh orders every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      // Silent refresh without loading state
      loadOrdersSilently();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadOrdersSilently = async () => {
    try {
      console.log('=== REFRESH SILENCIOSO PEDIDOS MOTOBOY ===');
      
      // Carregar pedidos disponíveis (waiting)
      const { data: waitingOrders, error: waitingError } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'waiting')
        .order('created_at', { ascending: false });

      // Carregar pedidos aceitos (accepted)
      const { data: acceptedOrdersData, error: acceptedError } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'accepted')
        .order('created_at', { ascending: false });
      
      if (waitingError) throw waitingError;
      if (acceptedError) throw acceptedError;
      
      // Update orders without showing loading
      setOrders(waitingOrders || []);
      setAcceptedOrders(acceptedOrdersData || []);
      
      // Load display names in background for new customers
      const allOrders = [...(waitingOrders || []), ...(acceptedOrdersData || [])];
      const uniqueCustomers = new Set(allOrders.map(order => order.customer_name).filter(Boolean));
      
      Promise.all(
        Array.from(uniqueCustomers)
          .filter(customer => !displayNames[customer]) // Only load new ones
          .map(customer => loadDisplayNameForUser(customer))
      ).catch(error => {
        console.error('Error loading display names silently:', error);
      });
      
    } catch (error) {
      console.error('Error in silent refresh:', error);
      // Don't show toast on silent refresh errors
    }
  };

  const handleLogin = () => {
    if (password === "Motoboy1719") {
      setIsAuthenticated(true);
      if (rememberLogin) {
        localStorage.setItem('motoboy_auth', 'true');
      }
      // Disparar evento para notificar o login em tempo real
      window.dispatchEvent(new CustomEvent('motoboyLogin'));
      loadOrders();
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao app Motoboy"
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Verifique a senha e tente novamente",
        variant: "destructive"
      });
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('=== CARREGANDO PEDIDOS MOTOBOY APP ===');
      
      // Carregar pedidos disponíveis (waiting)
      const { data: waitingOrders, error: waitingError } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'waiting')
        .order('created_at', { ascending: false });

      // Carregar pedidos aceitos (accepted)
      const { data: acceptedOrdersData, error: acceptedError } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'accepted')
        .order('created_at', { ascending: false });

      console.log('Query results:', { waitingOrders, acceptedOrdersData, waitingError, acceptedError });
      
      if (waitingError) throw waitingError;
      if (acceptedError) throw acceptedError;
      
      // Set orders first to show them immediately
      setOrders(waitingOrders || []);
      setAcceptedOrders(acceptedOrdersData || []);
      
      // Load display names in background without blocking UI
      const allOrders = [...(waitingOrders || []), ...(acceptedOrdersData || [])];
      const uniqueCustomers = new Set(allOrders.map(order => order.customer_name).filter(Boolean));
      
      // Load display names for unique customers only
      Promise.all(
        Array.from(uniqueCustomers).map(customer => loadDisplayNameForUser(customer))
      ).catch(error => {
        console.error('Error loading display names:', error);
      });
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('motoboy_orders')
        .update({
          motoboy_status: 'accepted',
          motoboy_accepted_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Entrega aceita!",
        description: "Você aceitou a entrega"
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Erro",
        description: "Erro ao aceitar entrega",
        variant: "destructive"
      });
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('motoboy_orders')
        .update({
          motoboy_status: 'rejected',
          motoboy_accepted_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Entrega rejeitada!",
        description: "Você rejeitou a entrega"
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar entrega",
        variant: "destructive"
      });
    }
  };

  const handleSendItems = async (order: MotoboyOrder) => {
    try {
      console.log('=== ENVIANDO ITENS ===');
      console.log('customer_username:', order.customer_username);
      console.log('customer_name:', order.customer_name);
      
      // Buscar dados do usuário - usar customer_name que tem o username completo
      const usernameToSearch = order.customer_name || order.customer_username;
      console.log('Buscando usuário:', usernameToSearch);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, wallet_balance, nickname')
        .eq('username', usernameToSearch)
        .single();

      console.log('Resultado da busca do usuário:', { userData, userError });

      if (userError || !userData) {
        throw new Error('Usuário não encontrado');
      }

      const newBalance = userData.wallet_balance - order.total_amount;
      if (newBalance < 0) {
        throw new Error('Usuário não tem saldo suficiente');
      }

      // Atualizar saldo do usuário  
      const { error: balanceError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('username', usernameToSearch);

      if (balanceError) throw balanceError;

      // Adicionar itens à bolsa do usuário
      console.log(`🎒 Adicionando ${order.items.length} itens ao inventário do usuário ${userData.username} (ID: ${userData.id})`);
      
      let itemsAdded = 0;
      let itemsSkipped = 0;
      const errors = [];

      for (const item of order.items) {
        try {
          console.log(`📦 Processando item: ${item.name} (quantidade: ${item.quantity})`);
          
          // Check if user already has this item and would exceed limit
          const { data: existingItems, error: checkError } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('user_id', userData.id)
            .eq('item_id', item.name);

          if (checkError) {
            console.error('❌ Error checking existing inventory for', item.name, ':', checkError);
            errors.push(`Erro ao verificar inventário de ${item.name}: ${checkError.message}`);
            continue;
          }

          const currentQuantity = existingItems?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
          const maxQuantityToAdd = Math.max(0, 10 - currentQuantity);
          const finalQuantity = Math.min(item.quantity, maxQuantityToAdd);
          
          console.log(`📊 Item ${item.name}: atual=${currentQuantity}, máximo a adicionar=${maxQuantityToAdd}, final=${finalQuantity}`);
          
          if (finalQuantity === 0) {
            console.log(`⚠️ Skipping ${item.name} - user already has 10 items`);
            itemsSkipped++;
            toast({
              title: "Limite de inventário atingido",
              description: `${item.name}: você já possui o máximo de 10 itens`,
              variant: "destructive",
              duration: 5000
            });
            continue;
          }
          
          if (finalQuantity < item.quantity) {
            console.log(`📦 Item ${item.name} quantity limited from ${item.quantity} to ${finalQuantity} (current: ${currentQuantity})`);
            toast({
              title: "Quantidade limitada",
              description: `${item.name}: quantidade limitada para ${finalQuantity} (máximo 10 por item)`,
              duration: 5000
            });
          }

          console.log(`✅ Inserindo no inventário: user_id=${userData.id}, item_id=${item.name}, quantity=${finalQuantity}`);
          
          const { error: inventoryError } = await supabase
            .from('inventory')
            .insert({
              user_id: userData.id,
              item_id: item.name,
              quantity: finalQuantity,
              sent_by_username: 'Motoboy',
              received_at: new Date().toISOString()
            });

          if (inventoryError) {
            console.error('❌ Error adding item to inventory:', inventoryError);
            errors.push(`Erro ao adicionar ${item.name}: ${inventoryError.message}`);
            
            if (inventoryError.message?.includes('Limite de 10 itens')) {
              toast({
                title: "Limite de inventário atingido",
                description: `${item.name}: limite de 10 itens atingido`,
                variant: "destructive",
                duration: 5000
              });
            }
          } else {
            console.log(`✅ Item ${item.name} adicionado com sucesso ao inventário`);
            itemsAdded++;
          }
        } catch (error) {
          console.error('❌ Error processing item delivery for', item.name, ':', error);
          errors.push(`Erro ao processar ${item.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      console.log(`📋 Resumo da entrega: ${itemsAdded} itens adicionados, ${itemsSkipped} ignorados, ${errors.length} erros`);
      
      if (errors.length > 0) {
        console.error('❌ Erros durante a entrega:', errors);
        toast({
          title: "Alguns itens não foram entregues",
          description: `${errors.length} erro(s) durante a entrega. Verifique o console.`,
          variant: "destructive",
          duration: 8000
        });
      }

      // Marcar pedido como entregue
      const { error } = await supabase
        .from('motoboy_orders')
        .update({
          motoboy_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      // Criar registro da transação no histórico
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: userData.id,
          to_user_id: userData.id, // mesma pessoa, é um gasto
          from_username: userData.username,
          to_username: order.store_id,
          amount: order.total_amount,
          transaction_type: 'motoboy_delivery',
          description: `Entrega de ${order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')} da ${order.store_id}`
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Continue mesmo se der erro na transação, pois o principal (entrega) já funcionou
      }

      const displayName = userData.nickname || (userData.username.endsWith('1919') || userData.username.endsWith('4444') || userData.username.endsWith('3852') || userData.username.endsWith('5555') ? userData.username.slice(0, -4) : userData.username);

      if (itemsAdded > 0) {
        toast({
          title: "Itens enviados com sucesso!",
          description: `${itemsAdded} itens enviados para ${displayName} e ${order.total_amount.toFixed(2)} CM descontado`,
          duration: 6000
        });
      } else {
        toast({
          title: "Nenhum item foi enviado",
          description: `Todos os itens foram rejeitados ou ocorreram erros. Verifique o inventário de ${displayName}`,
          variant: "destructive",
          duration: 8000
        });
      }

      // Incrementar estatísticas do dia
      const newDeliveryCount = todayDeliveries + 1;
      setTodayDeliveries(newDeliveryCount);
      
      // Salvar no localStorage
      const today = new Date().toDateString();
      localStorage.setItem(`motoboy_deliveries_${today}`, newDeliveryCount.toString());

      loadOrders();
    } catch (error) {
      console.error('Error sending items:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar itens",
        variant: "destructive"
      });
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('motoboy_orders')
        .update({
          motoboy_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Entrega concluída!",
        description: "Entrega marcada como entregue"
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir entrega",
        variant: "destructive"
      });
    }
  };

  const processPendingDeliveries = async () => {
    if (processingDeliveries) return;
    
    setProcessingDeliveries(true);
    try {
      console.log('🚚 Iniciando processamento de entregas pendentes via edge function...');
      
      const { data, error } = await supabase.functions.invoke('process-pending-deliveries');
      
      if (error) {
        console.error('❌ Erro ao processar entregas:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar entregas pendentes: " + error.message,
          variant: "destructive"
        });
        return;
      }

      const result = data;
      console.log('✅ Resultado do processamento:', result);
      
      if (result.success) {
        const { summary } = result;
        toast({
          title: "Entregas processadas!",
          description: `${summary.itemsAdded} itens entregues em ${summary.ordersProcessed} pedidos`,
          duration: 6000
        });
        
        // Recarregar pedidos
        loadOrders();
      } else {
        toast({
          title: "Erro no processamento",
          description: result.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar entregas:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar entregas pendentes",
        variant: "destructive"
      });
    } finally {
      setProcessingDeliveries(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-gradient-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/10 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary-foreground hover:bg-background/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-bold text-primary-foreground">Motoboy</h1>
          <div className="w-8" />
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <Lock className="mx-auto mb-2 text-primary" size={48} />
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Digite a senha para acessar o app Motoboy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Digite a senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="remember" className="text-sm">
                  Salvar login
                </label>
              </div>
              <Button onClick={handleLogin} className="w-full">
                Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-gradient-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/10 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-primary-foreground hover:bg-background/20"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-bold text-primary-foreground">Motoboy</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={processPendingDeliveries}
            disabled={processingDeliveries}
            className="text-primary-foreground hover:bg-background/20"
            title="Processar entregas pendentes"
          >
            {processingDeliveries ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
            ) : (
              <Package size={16} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('motoboy_auth');
              setIsAuthenticated(false);
              // Disparar evento para limpar notificações
              window.dispatchEvent(new CustomEvent('motoboyLogout'));
              toast({
                title: "Logout realizado",
                description: "Você foi desconectado do Motoboy"
              });
            }}
            className="text-primary-foreground hover:bg-background/20"
          >
            Sair
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-orange-500" size={20} />
              Processamento de Entregas
            </CardTitle>
            <CardDescription>
              Processar entregas pendentes e garantir que os itens sejam entregues aos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={processPendingDeliveries}
              disabled={processingDeliveries}
              className="w-full"
              variant="outline"
            >
              {processingDeliveries ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Processando entregas...
                </>
              ) : (
                <>
                  <Package className="mr-2" size={16} />
                  Processar Entregas Pendentes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="text-primary" size={20} />
              Status do Entregador
            </CardTitle>
            <CardDescription>
              Você está pronto para fazer entregas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Online e disponível</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Entregas Disponíveis ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Carregando entregas...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg">Nenhuma entrega disponível</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Aguarde novos pedidos chegarem</p>
              </div>
            ) : (
              (() => {
                const groupedOrders = groupOrdersByItems(orders);
                return (
                  <>
                    {groupedOrders.slice(0, 5).map((group) => (
                      <div key={group.id} className="relative bg-gradient-to-r from-background to-muted/20 border border-border/50 rounded-xl p-4 space-y-4 hover:shadow-md transition-all duration-200 hover:border-primary/20">
                        {/* Header com loja e valor */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                              <Truck className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{group.store_id}</h3>
                              <p className="text-sm text-muted-foreground">
                                {group.orders.length} {group.orders.length === 1 ? 'pedido' : 'pedidos'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {group.totalAmount.toFixed(2)} CM
                            </div>
                          </div>
                        </div>

                        {/* Seção de clientes */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm font-medium mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span>Clientes</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              // Criar array de clientes únicos
                              const uniqueClients = Array.from(new Set(group.orders.map(order => order.customer_name || order.customer_username)))
                                .map(username => {
                                  const userProfile = userProfiles[username];
                                  const displayName = getDisplayName(username);
                                  return { username, userProfile, displayName };
                                });
                              
                              return uniqueClients.map((client, index) => (
                                <div key={index} className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-2 hover:bg-background transition-colors">
                                  <Avatar 
                                    className="w-8 h-8 cursor-pointer border-2 border-primary/20 hover:border-primary/60 transition-all hover:scale-105"
                                    onClick={() => handleUserClick(client.username)}
                                  >
                                    {client.userProfile?.avatar ? (
                                      <AvatarImage src={client.userProfile.avatar} alt={client.displayName} />
                                    ) : (
                                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                                        {client.displayName.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span 
                                    className="cursor-pointer hover:text-primary transition-colors font-medium text-sm"
                                    onClick={() => handleUserClick(client.username)}
                                  >
                                    {client.displayName}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Seção de itens */}
                        <div className="bg-muted/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Package className="w-4 h-4 text-primary" />
                            <span>Itens do pedido</span>
                          </div>
                          <p className="text-sm text-foreground/80">
                            {Array.isArray(group.items) ? group.items.map((item: any) => 
                              `${item.quantity * group.orders.length}x ${item.name}`
                            ).join(', ') : 'Itens não disponíveis'}
                          </p>
                        </div>

                        {/* Horário e botões */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock size={12} />
                            <span>{new Date(group.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="px-4 hover:scale-105 transition-transform"
                              onClick={() => {
                                // Rejeitar todos os pedidos do grupo
                                group.orders.forEach(order => handleRejectOrder(order.id));
                              }}
                            >
                              Rejeitar
                            </Button>
                            <Button 
                              size="sm" 
                              className="px-4 hover:scale-105 transition-transform"
                              onClick={() => {
                                // Aceitar todos os pedidos do grupo
                                group.orders.forEach(order => handleAcceptOrder(order.id));
                              }}
                            >
                              Aceitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {groupedOrders.length > 5 && (
                      <div className="text-center pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => setShowAllOrdersModal(true)}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Ver todos os {groupedOrders.length} pedidos agrupados
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Accepted Orders - Ready to Send */}
        {acceptedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="text-primary" size={20} />
                Entregas Aceitas ({acceptedOrders.length})
              </CardTitle>
              <CardDescription>
                Clique em "Enviar" para enviar os itens e descontar da carteira do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const groupedClientOrders = groupOrdersByClient(acceptedOrders);
                return groupedClientOrders.map((clientGroup) => (
                  <div key={clientGroup.customerData.username} className="border rounded-lg p-4 space-y-3 bg-muted/20 dark:bg-muted/10">
                    {/* Cabeçalho com informações do cliente */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="w-12 h-12 cursor-pointer border-2 border-primary/20 hover:border-primary/60 transition-all hover:scale-105"
                          onClick={() => handleUserClick(clientGroup.customerData.username)}
                        >
                          {clientGroup.customerData.profile?.avatar ? (
                            <AvatarImage src={clientGroup.customerData.profile.avatar} alt={clientGroup.customerData.displayName} />
                          ) : (
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                              {clientGroup.customerData.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            <span 
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleUserClick(clientGroup.customerData.username)}
                            >
                              {clientGroup.customerData.displayName}
                            </span>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {clientGroup.orders.length} {clientGroup.orders.length === 1 ? 'pedido' : 'pedidos'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {clientGroup.totalAmount.toFixed(2)} CM
                        </div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>


                    {/* Botão para enviar todos os itens */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-sm py-2 px-3 h-auto min-h-[2.5rem] whitespace-normal text-center"
                      onClick={() => {
                        // Enviar todos os pedidos do cliente
                        clientGroup.orders.forEach(order => handleSendItems(order));
                      }}
                    >
                      Enviar
                    </Button>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Como fazer uma entrega:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Aceite a entrega acima</li>
                <li>Vá no privado da pessoa que fez o pedido</li>
                <li>Faça sua cena de entregar a comida</li>
                <li>Espere ela pegar o pedido</li>
                <li>Envie o item dela usando /enviaritem</li>
                <li>Marque a entrega como concluída</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{todayDeliveries}</div>
              <div className="text-xs text-muted-foreground">Entregas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para mostrar todos os pedidos */}
      <Dialog open={showAllOrdersModal} onOpenChange={setShowAllOrdersModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Todos os Pedidos Disponíveis ({orders.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {(() => {
              const groupedOrders = groupOrdersByItems(orders);
              return groupedOrders.map((group) => (
                <div key={group.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{group.store_id}</span>
                    <span className="text-green-600 font-bold">
                      {group.totalAmount.toFixed(2)} CM
                    </span>
                  </div>
                   <div className="flex items-center gap-2 text-sm mb-2">
                     <strong>Clientes:</strong>
                     <div className="flex items-center gap-1 flex-wrap">
                       {(() => {
                         // Criar array de clientes únicos no modal também
                         const uniqueClients = Array.from(new Set(group.orders.map(order => order.customer_name || order.customer_username)))
                           .map(username => {
                             const userProfile = userProfiles[username];
                             const displayName = getDisplayName(username);
                             return { username, userProfile, displayName };
                           });
                         
                         return uniqueClients.map((client, index) => (
                           <div key={index} className="flex items-center gap-1">
                             <Avatar 
                               className="w-6 h-6 cursor-pointer border border-primary/20 hover:border-primary/40 transition-colors"
                               onClick={() => handleUserClick(client.username)}
                             >
                               {client.userProfile?.avatar ? (
                                 <AvatarImage src={client.userProfile.avatar} alt={client.displayName} />
                               ) : (
                                 <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                                   {client.displayName.slice(0, 2).toUpperCase()}
                                 </AvatarFallback>
                               )}
                             </Avatar>
                             <span 
                               className="cursor-pointer hover:text-primary transition-colors"
                               onClick={() => handleUserClick(client.username)}
                             >
                               {client.displayName}
                             </span>
                             {index < uniqueClients.length - 1 && <span className="text-muted-foreground">,</span>}
                           </div>
                         ));
                       })()}
                     </div>
                     {group.orders.length > 1 && (
                       <span className="text-blue-600 font-medium ml-1">
                         ({group.orders.length} pedidos)
                       </span>
                     )}
                   </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Itens:</strong> {Array.isArray(group.items) ? group.items.map((item: any) => 
                      `${item.quantity * group.orders.length}x ${item.name}`
                    ).join(', ') : 'Itens não disponíveis'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>Pedido feito em: {new Date(group.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        // Rejeitar todos os pedidos do grupo
                        group.orders.forEach(order => handleRejectOrder(order.id));
                        setShowAllOrdersModal(false);
                      }}
                    >
                      Rejeitar
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Aceitar todos os pedidos do grupo
                        group.orders.forEach(order => handleAcceptOrder(order.id));
                        setShowAllOrdersModal(false);
                      }}
                    >
                      Aceitar
                    </Button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      {profileModalUser && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          userId={profileModalUser.userId}
          username={profileModalUser.username}
        />
      )}
    </div>
  );
}