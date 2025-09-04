import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Truck, MapPin, Clock, Package, Lock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        .select('username, nickname')
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
    
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === "Motoboy1719") {
      setIsAuthenticated(true);
      if (rememberLogin) {
        localStorage.setItem('motoboy_auth', 'true');
      }
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
      
      // Load display names for all customers
      const allOrders = [...(waitingOrders || []), ...(acceptedOrdersData || [])];
      for (const order of allOrders) {
        if (order.customer_name) {
          await loadDisplayNameForUser(order.customer_name);
        }
      }
      
      setOrders(waitingOrders || []);
      setAcceptedOrders(acceptedOrdersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      for (const item of order.items) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            user_id: userData.id,
            item_id: item.name,
            quantity: item.quantity,
            sent_by_username: 'Motoboy',
            received_at: new Date().toISOString()
          });

        if (inventoryError) {
          console.error('Error adding item to inventory:', inventoryError);
        }
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

      toast({
        title: "Itens enviados!",
        description: `Itens enviados para ${displayName} e ${order.total_amount.toFixed(2)} CM descontado`
      });

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem('motoboy_auth');
            setIsAuthenticated(false);
          }}
          className="text-primary-foreground hover:bg-background/20"
        >
          Sair
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
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
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-4">Carregando entregas...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma entrega disponível no momento
              </div>
            ) : (
              (() => {
                const groupedOrders = groupOrdersByItems(orders);
                return (
                  <>
                    {groupedOrders.slice(0, 5).map((group) => (
                      <div key={group.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{group.store_id}</span>
                          <span className="text-green-600 font-bold">
                            {group.totalAmount.toFixed(2)} CM
                          </span>
                        </div>
                        <div className="text-sm">
                          <strong>Clientes:</strong> {group.customers.join(', ')} 
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
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Aceitar todos os pedidos do grupo
                            group.orders.forEach(order => handleAcceptOrder(order.id));
                          }}
                        >
                          Aceitar {group.orders.length > 1 ? `${group.orders.length} Entregas` : 'Entrega'}
                        </Button>
                      </div>
                    ))}
                    {groupedOrders.length > 5 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowAllOrdersModal(true)}
                      >
                        + Ver todos os {groupedOrders.length} pedidos agrupados
                      </Button>
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
              {acceptedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{order.store_id}</span>
                    <span className="text-green-600 font-bold">
                      {order.total_amount.toFixed(2)} CM
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>Cliente:</strong> {getDisplayName(order.customer_name || order.customer_username)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Itens:</strong> {Array.isArray(order.items) ? order.items.map((item: any) => 
                      `${item.quantity}x ${item.name}`
                    ).join(', ') : 'Itens não disponíveis'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>Aceito em: {new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleSendItems(order)}
                  >
                    Enviar
                  </Button>
                </div>
              ))}
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
                  <div className="text-sm">
                    <strong>Clientes:</strong> {group.customers.join(', ')} 
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
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Aceitar todos os pedidos do grupo
                      group.orders.forEach(order => handleAcceptOrder(order.id));
                      setShowAllOrdersModal(false);
                    }}
                  >
                    Aceitar {group.orders.length > 1 ? `${group.orders.length} Entregas` : 'Entrega'}
                  </Button>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}