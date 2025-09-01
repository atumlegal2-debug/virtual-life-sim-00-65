import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Truck, MapPin, Clock, Package, Lock } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if login is saved
    const savedAuth = localStorage.getItem('motoboy_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadOrders();
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
      const { data, error } = await supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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
              orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{order.store_id}</span>
                    <span className="text-green-600 font-bold">
                      R$ {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>Cliente:</strong> {order.customer_name} (@{order.customer_username})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Itens:</strong> {Array.isArray(order.items) ? order.items.map((item: any) => 
                      `${item.quantity}x ${item.name}`
                    ).join(', ') : 'Itens não disponíveis'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>Pedido feito em: {new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAcceptOrder(order.id)}
                  >
                    Aceitar Entrega
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Entregas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
                <div className="text-xs text-muted-foreground">Ganhos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0 km</div>
                <div className="text-xs text-muted-foreground">Distância</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0h 0m</div>
                <div className="text-xs text-muted-foreground">Tempo Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}