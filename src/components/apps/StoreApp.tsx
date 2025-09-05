import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/contexts/StoreContext";
import { useGame } from "@/contexts/GameContext";
import { useRelationship } from "@/contexts/RelationshipContext";
import { ArrowLeft, ShoppingCart, Coffee, Pizza, UtensilsCrossed, ShoppingBag, 
         Heart, Zap, IceCream, Wine, Pill, Shield, Crown, Sparkles, X, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { STORES, StoreItem, CartItem } from "@/data/stores";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendRingModal } from "@/components/modals/SendRingModal";
import { RelationshipProposalModal } from "@/components/modals/RelationshipProposalModal";

interface StoreAppProps {
  onBack: () => void;
}

type StoreType = keyof typeof STORES;

// Store categories with icons and colors
const STORE_CATEGORIES = [
  {
    id: "food",
    name: "Alimentação",
    description: "Restaurantes e comidas",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-red-500",
    stores: ["restaurant", "pizzeria", "cafeteria"]
  },
  {
    id: "drinks",
    name: "Bebidas",
    description: "Bares e sorveterias", 
    icon: Wine,
    color: "from-purple-500 to-pink-500",
    stores: ["bar", "icecream"]
  },
  {
    id: "health",
    name: "Saúde & Bem-estar",
    description: "Farmácia e cuidados",
    icon: Pill,
    color: "from-green-500 to-blue-500",
    stores: ["pharmacy"]
  },
  {
    id: "lifestyle",
    name: "Estilo de Vida",
    description: "Joias e produtos especiais",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    stores: ["jewelry"]
  },
  {
    id: "adult",
    name: "Produtos Adultos",
    description: "Conteúdo +18",
    icon: Shield,
    color: "from-red-500 to-pink-500",
    stores: ["sexshop"]
  }
];

const STORE_ICONS = {
  restaurant: UtensilsCrossed,
  pizzeria: Pizza,
  cafeteria: Coffee,
  bar: Wine,
  icecream: IceCream,
  pharmacy: Pill,
  jewelry: Heart,
  sexshop: Shield
};

export function StoreApp({ onBack }: StoreAppProps) {
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [managerMode, setManagerMode] = useState<string | null>(null);
  const [managerPassword, setManagerPassword] = useState("");
  const [sendRingModalOpen, setSendRingModalOpen] = useState(false);
  const [selectedRing, setSelectedRing] = useState<StoreItem | null>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any>(null);
  const [showCartCheckout, setShowCartCheckout] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "motoboy">("pickup");
  
  const { addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, submitOrder, getCartTotal, getOrdersForStore, approveOrder, rejectOrder, getManagerPassword, getCartForStore } = useStore();
  const { currentUser, money, updateMoney, addTemporaryEffect, refreshWallet } = useGame();
  const { proposals, getProposalsForUser, acceptProposal, rejectProposal } = useRelationship();
  const { toast } = useToast();
  
  // Get cart for current store
  const cart = getCartForStore(selectedStore);
  // Refresh wallet when component mounts and when entering stores
  useEffect(() => {
    if (currentUser) {
      refreshWallet();
    }
  }, [currentUser, refreshWallet]);

  // Also refresh when entering a specific store
  useEffect(() => {
    if (selectedStore && currentUser) {
      refreshWallet();
    }
  }, [selectedStore, currentUser, refreshWallet]);

  const handleManagerLogin = (storeId: string) => {
    const store = STORES[storeId as StoreType];
    const correctPassword = getManagerPassword(storeId);
    
    if (managerPassword === correctPassword) {
      setManagerMode(storeId);
      setManagerPassword("");
      toast({
        title: "Acesso liberado",
        description: `Bem-vindo, gerente da ${store.name}!`
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Credenciais de gerente inválidas",
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = async (item: StoreItem) => {
    // Check current inventory for this item
    if (!currentUser) return;
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (userError || !userData) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('user_id', userData.id)
        .eq('item_id', item.id);

      if (inventoryError) {
        console.error('Erro ao verificar inventário:', inventoryError);
      }

      const currentInventoryCount = inventoryItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const cartItemCount = cart.find(cartItem => cartItem.id === item.id)?.quantity || 0;
      
      if (currentInventoryCount + cartItemCount >= 10) {
        toast({
          title: "Limite atingido",
          description: `Você já possui/tem no carrinho o máximo de 10 unidades de ${item.name}`,
          variant: "destructive"
        });
        return;
      }

      const cartItem: CartItem = { ...item, quantity: 1 };
      addToCart(selectedStore, cartItem);
      toast({
        title: "Item adicionado",
        description: `${item.name} adicionado ao carrinho`
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar limite de inventário",
        variant: "destructive"
      });
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    
    const total = getCartTotal(selectedStore);
    
    if (money < total) {
      toast({
        title: "Saldo insuficiente",
        description: `Você tem ${money} CM, mas precisa de ${total} CM para esta compra`,
        variant: "destructive"
      });
      return;
    }

    if (selectedStore && currentUser) {
      setOrderProcessing(true);
      
      try {
        // Check if this is a hospital order (no motoboy delivery for hospital)
        const isHospital = false; // Hospital is not in current stores
        
        if (deliveryOption === "motoboy" && !isHospital) {
          // Create motoboy order - use the correct store ID from STORES data
          const storeData = STORES[selectedStore];
          const sanitizedItems = cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity }));
          const { error } = await supabase
            .from('motoboy_orders')
            .insert({
              order_id: crypto.randomUUID(),
              store_id: storeData.id,
              customer_name: currentUser,
              customer_username: currentUser, // Salvar username completo para buscar nickname
              items: sanitizedItems as any,
              total_amount: total,
              manager_status: 'pending',
              motoboy_status: 'waiting'
            });

          if (error) throw error;

          toast({
            title: "Pedido enviado para o gerente!",
            description: "Aguarde a aprovação para envio ao motoboy",
            duration: 5000
          });
        } else {
          // Regular order submission
          await submitOrder(selectedStore, currentUser, currentUser.slice(0, -4));
          toast({
            title: "Pedido enviado!",
            description: "Olá, seu pedido está em processo, entre em contato com o chat do estabelecimento e aguarde",
            duration: 5000
          });
        }

        setShowCartCheckout(false);
        clearCart(selectedStore);
        setDeliveryOption("pickup");
      } catch (error) {
        console.error('Error submitting order:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar pedido",
          variant: "destructive"
        });
      } finally {
        setOrderProcessing(false);
      }
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    // Note: This function is no longer used in StoreApp since we're using ManagerApp for approvals
    // But keeping it for backward compatibility with manager mode in this component
    const order = getOrdersForStore(managerMode!).find(o => o.id === orderId);
    if (order) {
      try {
        // The actual approval logic has been moved to ManagerApp.tsx
        // This is just a fallback for the old manager mode in StoreApp
        approveOrder(orderId, order.buyerId, (amount) => updateMoney(-amount), () => {});
        
        toast({
          title: "Pedido aprovado",
          description: `Pedido de ${order.buyerName} foi aprovado!`
        });
      } catch (error) {
        console.error('Error approving order:', error);
        toast({
          title: "Erro",
          description: "Não foi possível aprovar o pedido",
          variant: "destructive"
        });
      }
    }
  };

  const handleRejectOrder = (orderId: string) => {
    const order = getOrdersForStore(managerMode!).find(o => o.id === orderId);
    if (order) {
      rejectOrder(orderId);
      toast({
        title: "Pedido recusado",
        description: `Pedido de ${order.buyerName} foi recusado`
      });
    }
  };

  // Manager interface
  if (managerMode) {
    const orders = getOrdersForStore(managerMode);
    const pendingOrders = orders.filter(o => o.status === "pending");
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setManagerMode(null)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Gerência - {STORES[managerMode as StoreType].name}
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Pedidos Pendentes ({pendingOrders.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum pedido pendente
                </p>
              ) : (
                pendingOrders.map(order => (
                  <div key={order.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{order.buyerName}</span>
                      <span className="text-money font-bold">{order.total} CM</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.map(item => (
                        <div key={item.id}>
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveOrder(order.id)}
                        className="flex-1"
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectOrder(order.id)}
                        className="flex-1"
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Category selection
  if (!selectedCategory && !selectedStore) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Categorias de Lojas</h1>
        </div>

        <div className="grid gap-4">
          {STORE_CATEGORIES.map((category) => (
            <Card 
              key={category.id}
              className="bg-gradient-card border-border/50 cursor-pointer hover:shadow-app transition-all group"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <category.icon size={32} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <div className="flex gap-1 mt-2">
                      {category.stores.map(storeId => (
                        <Badge key={storeId} variant="secondary" className="text-xs">
                          {STORES[storeId as StoreType].name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Store selection within category
  if (selectedCategory && !selectedStore) {
    const category = STORE_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {category.stores.map((storeId) => {
            const store = STORES[storeId as StoreType];
            const StoreIcon = STORE_ICONS[storeId as StoreType];
            
            return (
              <Card 
                key={storeId}
                className="bg-gradient-card border-border/50 cursor-pointer hover:shadow-app transition-all group"
                onClick={() => setSelectedStore(storeId as StoreType)}
              >
                <CardContent className="pt-6 pb-4 text-center">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <StoreIcon size={32} className="text-white drop-shadow-lg" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground">{store.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{store.items.length} produtos</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const store = STORES[selectedStore];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedStore(null);
            if (selectedCategory) setSelectedCategory(null);
          }}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            {(() => {
              const StoreIcon = STORE_ICONS[selectedStore];
              const category = STORE_CATEGORIES.find(c => c.stores.includes(selectedStore));
              return (
                <>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category?.color || 'from-primary to-primary'} flex items-center justify-center`}>
                    <StoreIcon size={20} className="text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Wallet Display */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-money/10 border border-money/20">
            <span className="text-xs font-medium text-money">{money} CM</span>
          </div>
          
          {/* Cart */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCartCheckout(true)}
              disabled={cart.length === 0}
            >
              <ShoppingCart size={16} />
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* Relationship Proposals Indicator */}
          {currentUser && getProposalsForUser(currentUser).length > 0 && (
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const userProposals = getProposalsForUser(currentUser);
                  if (userProposals.length > 0) {
                    setCurrentProposal(userProposals[0]);
                    setProposalModalOpen(true);
                  }
                }}
                className="animate-pulse border-pink-500/50 hover:border-pink-500"
              >
                <Heart size={16} className="text-pink-500" />
              </Button>
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-pink-500">
                {getProposalsForUser(currentUser).length}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Store Items grouped by category */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-4">
        {(() => {
          // Group items by category
          const itemsByCategory = store.items.reduce((acc, item) => {
            const category = item.category || 'Outros';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(item);
            return acc;
          }, {} as Record<string, StoreItem[]>);

          // Sort categories alphabetically
          const sortedCategories = Object.keys(itemsByCategory).sort();

          return sortedCategories.map(category => (
            <div key={category} className="space-y-3">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2">
                <h2 className="text-sm font-bold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-primary">{category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {itemsByCategory[category].length} {itemsByCategory[category].length === 1 ? 'item' : 'itens'}
                  </Badge>
                </h2>
                <div className="h-px bg-border/50 mt-2"></div>
              </div>
              
              {itemsByCategory[category].map(item => (
                <Card key={item.id} className="bg-gradient-card border-border/50 hover:shadow-md transition-all group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            {item.isMagical && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                ✨ MÁGICO
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        {item.visualEffect && (
                          <p className="text-xs text-muted-foreground/80 mb-2 italic">
                            Efeito: {item.visualEffect}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-money font-bold text-lg">{item.price} CM</span>
                          <div className="flex gap-1">
                            {item.relationshipType && (
                              <Badge variant="secondary" className="text-xs">
                                {item.relationshipType === "namoro" && "💕"}
                                {item.relationshipType === "noivado" && "👑"}
                                {item.relationshipType === "casamento" && "💍"}
                                {item.relationshipType}
                              </Badge>
                            )}
                            {item.effect && (
                              <Badge variant="secondary" className="text-xs">
                                {item.effect.type === "health" && "💊"}
                                {item.effect.type === "hunger" && "🍽️"}
                                {item.effect.type === "mood" && "😊"}
                                {item.effect.type === "energy" && "⚡"}
                                {item.effect.type === "alcoholism" && "🍷"}
                                +{item.effect.value}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        className="shrink-0 group-hover:scale-105 transition-transform"
                      >
                        <ShoppingBag size={16} className="mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ));
        })()}
      </div>

      {/* Cart Checkout Modal */}
      {showCartCheckout && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart size={20} className="text-primary" />
                  Finalizar Compra
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCartCheckout(false)}
                  className="h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.price} CM cada
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => decreaseQuantity(selectedStore, item.id)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Check inventory limit before increasing quantity
                            if (!currentUser) return;
                            
                            try {
                              const { data: userData, error: userError } = await supabase
                                .from('users')
                                .select('id')
                                .eq('username', currentUser)
                                .single();

                              if (userError || !userData) return;

                              const { data: inventoryItems, error: inventoryError } = await supabase
                                .from('inventory')
                                .select('quantity')
                                .eq('user_id', userData.id)
                                .eq('item_id', item.id);

                              if (inventoryError) {
                                console.error('Erro ao verificar inventário:', inventoryError);
                              }

                              const currentInventoryCount = inventoryItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                              const cartItemCount = cart.find(cartItem => cartItem.id === item.id)?.quantity || 0;
                              
                              // Limita quantidade no carrinho para máximo 10 unidades por item
                              if (cartItemCount >= 10) {
                                toast({
                                  title: "Limite atingido",
                                  description: `Você só pode ter até 10 unidades de ${item.name} no carrinho`,
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              // Verifica se já possui muitos itens no total (inventário + carrinho)
                              if (currentInventoryCount + cartItemCount >= 10) {
                                toast({
                                  title: "Limite atingido",
                                  description: `Você já possui/tem no carrinho o máximo de 10 unidades de ${item.name}`,
                                  variant: "destructive"
                                });
                                return;
                              }

                              increaseQuantity(selectedStore, item.id);
                            } catch (error) {
                              console.error('Erro ao aumentar quantidade:', error);
                            }
                          }}
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                      <span className="text-money font-semibold text-sm">
                        {item.price * item.quantity} CM
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(selectedStore, item.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-lg text-money">{getCartTotal(selectedStore)} CM</span>
                </div>
                {/* Delivery Option Selection */}
                <div className="space-y-3 mb-4">
                  <div className="text-sm font-medium">Opção de entrega:</div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="pickup"
                        checked={deliveryOption === "pickup"}
                        onChange={(e) => setDeliveryOption(e.target.value as "pickup" | "motoboy")}
                        className="rounded"
                      />
                      <span className="text-sm">Retirada no local</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="motoboy"
                        checked={deliveryOption === "motoboy"}
                        onChange={(e) => setDeliveryOption(e.target.value as "pickup" | "motoboy")}
                        className="rounded"
                      />
                      <span className="text-sm">Entrega por motoboy</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => clearCart(selectedStore)} 
                    className="flex-1"
                    disabled={orderProcessing}
                  >
                    Limpar
                  </Button>
                  <Button 
                    onClick={handleSubmitOrder}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    disabled={orderProcessing}
                  >
                    {orderProcessing ? "Processando..." : "Finalizar Compra"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Modals */}
      <SendRingModal
        ring={selectedRing}
        isOpen={sendRingModalOpen}
        onClose={() => {
          setSendRingModalOpen(false);
          setSelectedRing(null);
        }}
      />
      
      <RelationshipProposalModal
        proposal={currentProposal}
        isOpen={proposalModalOpen}
        onClose={() => {
          setProposalModalOpen(false);
          setCurrentProposal(null);
        }}
        currentUserId={currentUser || ""}
        onAccept={(proposal) => {
          acceptProposal(proposal);
          setCurrentProposal(null);
        }}
        onReject={(proposal) => {
          rejectProposal(proposal);
          setCurrentProposal(null);
        }}
      />
    </div>
  );
}