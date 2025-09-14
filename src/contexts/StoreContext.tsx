import { createContext, useContext, useState, ReactNode } from "react";
import { StoreOrder, CartItem } from "@/data/stores";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoreContextType {
  carts: Record<string, CartItem[]>;
  orders: StoreOrder[];
  addToCart: (storeId: string, item: CartItem) => void;
  removeFromCart: (storeId: string, itemId: string) => void;
  increaseQuantity: (storeId: string, itemId: string) => void;
  decreaseQuantity: (storeId: string, itemId: string) => void;
  clearCart: (storeId: string) => void;
  submitOrder: (storeId: string, buyerId: string, buyerName: string) => Promise<void>;
  submitOrderWithDeliveryType: (storeId: string, buyerId: string, buyerName: string, deliveryType: string) => Promise<void>;
  approveOrder: (orderId: string, buyerId: string, deductMoney: (amount: number) => void, addToBag: (items: CartItem[]) => void) => void;
  rejectOrder: (orderId: string) => void;
  getOrdersForStore: (storeId: string) => StoreOrder[];
  getCartTotal: (storeId: string) => number;
  getManagerPassword: (storeId: string) => string;
  getCartForStore: (storeId: string) => CartItem[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Manager passwords for each store
const MANAGER_PASSWORDS: Record<string, string> = {
  "bar": "Bar6291",
  "jewelry": "Joalheria8547", 
  "restaurant": "Restaurante3852",
  "pharmacy": "Farmacia1817",
  "cafeteria": "Cafeteria4926",
  "pizzeria": "1616",
  "sexshop": "Sexshop7304",
  "icecream": "Sorveteria5173",
  "hospital": "2023"
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({});
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const { toast } = useToast();
  const MAX_PER_ITEM = 3;

  const getCartForStore = (storeId: string): CartItem[] => {
    return carts[storeId] || [];
  };

  const addToCart = (storeId: string, item: CartItem) => {
    setCarts(prev => {
      const currentCart = prev[storeId] || [];
      const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
      const incomingQty = Math.max(1, item.quantity || 1);

      let newCart: CartItem[];

      if (existingItem) {
        const desired = existingItem.quantity + incomingQty;
        const clamped = Math.min(MAX_PER_ITEM, desired);
        if (desired > MAX_PER_ITEM) {
          toast({
            title: "Limite atingido",
            description: `Máximo de ${MAX_PER_ITEM} unidades por item. Ajustamos a quantidade.`,
            variant: "destructive"
          });
        }
        newCart = currentCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: clamped }
            : cartItem
        );
      } else {
        const clampedNew = Math.min(MAX_PER_ITEM, incomingQty);
        if (incomingQty > MAX_PER_ITEM) {
          toast({
            title: "Limite atingido",
            description: `Máximo de ${MAX_PER_ITEM} unidades por item. Ajustamos a quantidade.`,
            variant: "destructive"
          });
        }
        newCart = [...currentCart, { ...item, quantity: clampedNew }];
      }

      return { ...prev, [storeId]: newCart };
    });
  };

  const removeFromCart = (storeId: string, itemId: string) => {
    setCarts(prev => ({
      ...prev,
      [storeId]: (prev[storeId] || []).filter(item => item.id !== itemId)
    }));
  };

  const increaseQuantity = (storeId: string, itemId: string) => {
    setCarts(prev => ({
      ...prev,
      [storeId]: (prev[storeId] || []).map(item => {
        if (item.id !== itemId) return item;
        if (item.quantity >= MAX_PER_ITEM) {
          toast({
            title: "Limite atingido",
            description: `Máximo de ${MAX_PER_ITEM} unidades por item.`,
            variant: "destructive"
          });
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      })
    }));
  };

  const decreaseQuantity = (storeId: string, itemId: string) => {
    setCarts(prev => ({
      ...prev,
      [storeId]: (prev[storeId] || []).map(item =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    }));
  };

  const clearCart = (storeId: string) => {
    setCarts(prev => ({ ...prev, [storeId]: [] }));
  };

  const submitOrderWithDeliveryType = async (storeId: string, buyerId: string, buyerName: string, deliveryType: string) => {
    const currentCart = getCartForStore(storeId);
    
    try {
      console.log('=== INICIANDO SUBMISSÃO DE PEDIDO ===');
      
      // Get the current user ID from localStorage
      const currentUserId = localStorage.getItem('currentUserId');
      console.log('currentUserId do localStorage:', currentUserId);
      
      if (!currentUserId) {
        console.error('Erro: currentUserId não encontrado no localStorage');
        return;
      }

      // Import STORES to get the correct store ID
      const { STORES } = await import("@/data/stores");
      const store = STORES[storeId as keyof typeof STORES];
      const actualStoreId = store?.id || storeId;
      
      console.log('Mapeamento de loja:', { 
        frontendStoreId: storeId, 
        actualStoreId,
        storeName: store?.name 
      });

      // Buscar o ID real do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', buyerId)
        .single();

      console.log('Resultado busca userData:', { userData, userError });

      if (userError || !userData) {
        console.error('Erro: usuário não encontrado na tabela users');
        return;
      }

      const orderData = {
        user_id: userData.id,
        store_id: actualStoreId,
        items: JSON.parse(JSON.stringify(currentCart)) as any,
        total_amount: getCartTotal(storeId),
        status: 'pending',
        delivery_type: deliveryType
      };

      console.log('Dados do pedido:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select();

      console.log('Resultado da inserção:', { data, error });

      if (error) throw error;

      // Create local order for compatibility with existing code
      const newOrder: StoreOrder = {
        id: data?.[0]?.id || Date.now().toString(),
        buyerId: userData.id,
        buyerName,
        storeId: actualStoreId,
        items: [...currentCart],
        total: getCartTotal(storeId),
        status: "pending",
        timestamp: new Date()
      };
      
      console.log('Pedido local criado:', newOrder);
      
      setOrders(prev => [...prev, newOrder]);
      clearCart(storeId);
      
      console.log('=== PEDIDO SUBMETIDO COM SUCESSO ===');
    } catch (error) {
      console.error('Erro na submissão do pedido:', error);
    }
  };

  const submitOrder = async (storeId: string, buyerId: string, buyerName: string) => {
    // Default to pickup for backward compatibility
    return submitOrderWithDeliveryType(storeId, buyerId, buyerName, 'pickup');
  };

  const approveOrder = (orderId: string, buyerId: string, deductMoney: (amount: number) => void, addToBag: (items: CartItem[]) => void) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.buyerId === buyerId) {
      // Deduct money from buyer's wallet
      deductMoney(order.total);
      
      // Add items to buyer's bag
      addToBag(order.items);
      
      // Update order status
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, status: "approved" as const } : o
        )
      );
    }
  };

  const rejectOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status: "rejected" as const } : order
      )
    );
  };

  const getOrdersForStore = (storeId: string) => {
    return orders.filter(order => order.storeId === storeId);
  };

  const getCartTotal = (storeId: string) => {
    const currentCart = getCartForStore(storeId);
    return currentCart.reduce((total, item) => total + (item.price * Math.min(item.quantity, MAX_PER_ITEM)), 0);
  };

  const getManagerPassword = (storeId: string) => {
    return MANAGER_PASSWORDS[storeId.toLowerCase()] || "";
  };

  return (
    <StoreContext.Provider value={{
      carts,
      orders,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      submitOrder,
      submitOrderWithDeliveryType,
      approveOrder,
      rejectOrder,
      getOrdersForStore,
      getCartTotal,
      getManagerPassword,
      getCartForStore
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}