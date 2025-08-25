import { createContext, useContext, useState, ReactNode } from "react";
import { StoreOrder, CartItem } from "@/data/stores";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoreContextType {
  cart: CartItem[];
  orders: StoreOrder[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  submitOrder: (storeId: string, buyerId: string, buyerName: string) => Promise<void>;
  approveOrder: (orderId: string, buyerId: string, deductMoney: (amount: number) => void, addToBag: (items: CartItem[]) => void) => void;
  rejectOrder: (orderId: string) => void;
  getOrdersForStore: (storeId: string) => StoreOrder[];
  getCartTotal: () => number;
  getManagerPassword: (storeId: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Manager passwords for each store
const MANAGER_PASSWORDS: Record<string, string> = {
  "bar": "1212",
  "jewelry": "1329", 
  "restaurant": "1313",
  "pharmacy": "1414",
  "cafeteria": "2020",
  "pizzeria": "1616",
  "sexshop": "1717",
  "icecream": "1818",
  "hospital": "2023"
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitOrder = async (storeId: string, buyerId: string, buyerName: string) => {
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
        items: JSON.parse(JSON.stringify(cart)) as any,
        total_amount: getCartTotal(),
        status: 'pending'
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
        items: [...cart],
        total: getCartTotal(),
        status: "pending",
        timestamp: new Date()
      };
      
      console.log('Pedido local criado:', newOrder);
      
      setOrders(prev => [...prev, newOrder]);
      clearCart();
      
      console.log('=== PEDIDO SUBMETIDO COM SUCESSO ===');
    } catch (error) {
      console.error('Erro na submissão do pedido:', error);
    }
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

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getManagerPassword = (storeId: string) => {
    return MANAGER_PASSWORDS[storeId.toLowerCase()] || "";
  };

  return (
    <StoreContext.Provider value={{
      cart,
      orders,
      addToCart,
      removeFromCart,
      clearCart,
      submitOrder,
      approveOrder,
      rejectOrder,
      getOrdersForStore,
      getCartTotal,
      getManagerPassword
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