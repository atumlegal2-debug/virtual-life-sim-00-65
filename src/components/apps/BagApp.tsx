import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Package, Send, Utensils, Wine, Pill, Heart, History, Clock, Users, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORES } from "@/data/stores";
import { useGame } from "@/contexts/GameContext";
import { getItemType, getCategoryIcon, getCategoryName, getEffectIcon, getEffectName, isAlcoholic } from "@/lib/itemCategories";
import { SendRingModal } from "@/components/modals/SendRingModal";
import { SendItemModal } from "@/components/modals/SendItemModal";
import { SendFriendshipItemModal } from "@/components/modals/SendFriendshipItemModal";
import { DivideItemModal } from "@/components/modals/DivideItemModal";
import { StoreItem } from "@/data/stores";

interface BagAppProps {
  onBack: () => void;
}

interface InventoryItem {
  id: string;
  inventoryId: string; // ID da linha na tabela inventory
  name: string;
  description: string;
  itemType: "food" | "drink" | "object";
  quantity: number;
  storeId: string;
  canUse: boolean;
  canSend: boolean;
  isRing: boolean;
  price?: number; // Add price property for hunger calculation
  relationshipType?: string;
  originalItem?: StoreItem;
  effect?: {
    type: string;
    value: number;
    message?: string;
  } | {
    type: "multiple";
    effects: Array<{
      type: string;
      value: number;
      message?: string;
    }>;
    message?: string;
  };
  // Add effects array for items from stores that have multiple effects
  effects?: Array<{
    type: string;
    value: number;
    message?: string;
  }>;
}

interface HistoryItem {
  id: string;
  name: string;
  description: string;
  itemType: "food" | "drink" | "object";
  quantity: number;
  sent_by_username: string | null;
  received_at: string;
  storeId: string;
  isCustom: boolean;
  originalItem?: StoreItem;
  effect?: {
    type: string;
    value: number;
    message: string;
  };
}

export default function BagApp({ onBack }: BagAppProps) {
  const { currentUser, updateStats, gameStats, cureDisease, diseases, addTemporaryEffect, cureDiseaseWithMedicine } = useGame();
  const { toast } = useToast();
  
  // States otimizados
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"food" | "drink" | "object" | "history">("food");
  const [sendRingModalOpen, setSendRingModalOpen] = useState(false);
  const [sendItemModalOpen, setSendItemModalOpen] = useState(false);
  const [sendFriendshipItemModalOpen, setSendFriendshipItemModalOpen] = useState(false);
  const [divideItemModalOpen, setDivideItemModalOpen] = useState(false);
  const [selectedRing, setSelectedRing] = useState<StoreItem | null>(null);
  const [selectedItemToSend, setSelectedItemToSend] = useState<InventoryItem | null>(null);
  const [selectedFriendshipItem, setSelectedFriendshipItem] = useState<InventoryItem | null>(null);
  const [selectedItemToDivide, setSelectedItemToDivide] = useState<InventoryItem | null>(null);

  // Cache em memória para dados da bolsa
  const [cachedData, setCachedData] = useState<{
    inventory: InventoryItem[];
    history: HistoryItem[];
    timestamp: number;
  } | null>(() => {
    if (!currentUser) return null;
    const cached = sessionStorage.getItem(`bagData_${currentUser}`);
    return cached ? JSON.parse(cached) : null;
  });

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    if (!username) return 'Usuário desconhecido';
    // Só remover os últimos 4 caracteres se forem dígitos
    const hasCodeSuffix = /\d{4}$/.test(username);
    return hasCodeSuffix ? username.slice(0, -4) : username;
  };

  // Otimizar lookup de itens das lojas usando Map
  const itemLookupMap = useMemo(() => {
    const lookupMap = new Map<string, StoreItem>();
    const nameToIdMap = new Map<string, string>();
    
    Object.values(STORES).forEach(store => {
      store.items.forEach(item => {
        lookupMap.set(item.id, { ...item, storeId: store.id } as StoreItem & { storeId: string });
        nameToIdMap.set(item.name.toLowerCase(), item.id);
      });
    });
    
    return { lookupMap, nameToIdMap };
  }, []);

  const getIceCreamIcon = (item: { name: string }) => {
    switch (item.name.toLowerCase()) {
      case 'sorvete de chocolate':
        return '🍫';
      case 'sorvete de morango':
        return '🍓';
      case 'sorvete de baunilha':
        return '🍦';
      case 'picolé de limão':
        return '🍋';
      case 'açaí na tigela':
        return '🍯';
      case 'milkshake de chocolate':
        return '🥤';
      case 'casquinha mista':
        return '🍦';
      case 'sundae de caramelo':
        return '🍨';
      case 'frozen yogurt':
        return '🍦';
      case 'gelato italiano':
        return '🍨';
      case 'aurora açucarada':
        return '✨';
      case 'neblina doce':
        return '☁️';
      default:
        return '🍦';
    }
  };

  const getUserId = async (username: string) => {
    const cacheKey = `userId_${username}`;
    
    // Check cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setCachedUserId(cached);
      return cached;
    }

    try {
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error || !userRecord) return null;
      
      const userId = userRecord.id;
      sessionStorage.setItem(cacheKey, userId);
      setCachedUserId(userId);
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  // Cache check - mostra dados imediatamente se disponível
  const showCachedDataFirst = useCallback(() => {
    if (cachedData && Date.now() - cachedData.timestamp < 60000) { // Cache válido por 1 minuto
      setInventory(cachedData.inventory);
      setHistoryItems(cachedData.history);
      return true;
    }
    return false;
  }, [cachedData]);

  // Item processing ultra-otimizado usando Map
  const processInventoryItemOptimized = useCallback((item: any, allCustomItems: Map<string, any>) => {
    // Custom item processing - check if it starts with "custom_"
    if (item.item_id.startsWith('custom_') || allCustomItems.has(item.item_id)) {
      const customItem = allCustomItems.get(item.item_id);
      
      if (!customItem) {
        // Fallback simples e rápido
        const fallbackItem = {
          id: item.item_id,
          name: `Item Personalizado`,
          description: 'Item criado por usuário',
          itemType: 'object' as const,
          icon: '📦'
        };
        
        const inventoryItem: InventoryItem = {
          id: item.item_id,
          inventoryId: item.id,
          name: fallbackItem.name,
          description: fallbackItem.description,
          itemType: fallbackItem.itemType,
          quantity: item.quantity || 1,
          storeId: 'custom',
          canUse: true, // Fallback items também podem ser usados
          canSend: true,
          isRing: false,
          originalItem: fallbackItem as any,
          price: 0,
          effect: null
        };

        const historyItem: HistoryItem = {
          id: item.item_id,
          name: fallbackItem.name,
          description: fallbackItem.description,
          itemType: fallbackItem.itemType,
          quantity: item.quantity || 1,
          sent_by_username: item.sent_by_username,
          received_at: item.received_at,
          storeId: 'custom',
          isCustom: true,
          originalItem: fallbackItem as any
        };

        return { inventoryItem, historyItem };
      }
      
      // Normal custom item processing
      const inventoryItem: InventoryItem = {
        id: customItem.id,
        inventoryId: item.id,
        name: customItem.name,
        description: customItem.description || '',
        itemType: customItem.itemType || 'object',
        quantity: item.quantity || 1,
        storeId: 'custom',
        canUse: true, // Todos os itens customizados podem ser usados
        canSend: customItem.canSend !== false,
        isRing: false,
        originalItem: customItem,
        price: customItem.price || 0,
        effect: customItem.effect || null
      };

      const historyItem: HistoryItem = {
        id: customItem.id,
        name: customItem.name,
        description: customItem.description || '',
        itemType: customItem.itemType || 'object',
        quantity: item.quantity || 1,
        sent_by_username: item.sent_by_username,
        received_at: item.received_at,
        storeId: 'custom',
        isCustom: true,
        originalItem: customItem
      };

      return { inventoryItem, historyItem };
    }

    // Standard item processing using optimized lookup
    const storeItem = itemLookupMap.lookupMap.get(item.item_id);
    if (!storeItem) {
      console.warn(`Item ${item.item_id} not found in lookup map`);
      return null;
    }

    const inventoryItem: InventoryItem = {
      id: storeItem.id,
      inventoryId: item.id,
      name: storeItem.name,
      description: storeItem.description || '',
      itemType: storeItem.itemType || getItemType((storeItem as any).storeId || '', storeItem.id),
      quantity: item.quantity || 1,
      storeId: (storeItem as any).storeId || '',
      canUse: true, // Todos os itens podem ser usados
      canSend: (storeItem as any).canSend !== false,
      isRing: storeItem.relationshipType !== undefined,
      relationshipType: storeItem.relationshipType,
      originalItem: storeItem,
      price: storeItem.price || 0,
      effect: storeItem.effects ? {
        type: "multiple",
        effects: storeItem.effects,
        message: ""
      } : (storeItem.effect ? { ...storeItem.effect, message: storeItem.effect.message || '' } : undefined)
    };

    const historyItem: HistoryItem = {
      id: storeItem.id,
      name: storeItem.name,
      description: storeItem.description || '',
      itemType: storeItem.itemType || getItemType((storeItem as any).storeId || '', storeItem.id),
      quantity: item.quantity || 1,
      sent_by_username: item.sent_by_username,
      received_at: item.received_at,
      storeId: (storeItem as any).storeId || '',
      isCustom: false,
      originalItem: storeItem,
      effect: storeItem.effect ? { ...storeItem.effect, message: storeItem.effect.message || '' } : undefined
    };
    
    return { inventoryItem, historyItem };
  }, [itemLookupMap.lookupMap, itemLookupMap.nameToIdMap]);

  // Carregamento ultra-otimizado
  const loadAllData = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;

    // Mostra dados do cache primeiro se não for refresh forçado
    const hasCache = !forceRefresh && showCachedDataFirst();
    
    try {
      setIsLoading(!hasCache); // Só mostra loading se não tiver cache
      
      // Get user ID from cache or fetch once
      let userId = cachedUserId;
      if (!userId) {
        userId = sessionStorage.getItem(`userId_${currentUser}`);
        if (!userId) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('username', currentUser)
            .maybeSingle();
          
          if (!userRecord) {
            setIsLoading(false);
            return;
          }
          userId = userRecord.id;
          sessionStorage.setItem(`userId_${currentUser}`, userId);
        }
        setCachedUserId(userId);
      }

      // Helper para aplicar timeout em promessas (aceita Thenables do Supabase)
      const raceWithTimeout = <T,>(p: PromiseLike<T> | T, ms = 6000) =>
        Promise.race([Promise.resolve(p as any), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);

      // 1) Buscar inventário primeiro (rápido)
      const inventoryResult = await raceWithTimeout(
        supabase
          .from('inventory')
          .select('id, item_id, quantity, sent_by_username, received_at, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)
      );
      const { data: inventoryData, error: inventoryError } = inventoryResult as any;

      if (inventoryError) {
        console.error('Inventory error:', inventoryError);
        throw inventoryError;
      }

      // 2) Coletar apenas IDs de itens custom do usuário
      const customIds: string[] = (inventoryData || [])
        .map((it: any) => it.item_id)
        .filter((id: string) => typeof id === 'string' && id.startsWith('custom_'));
      const customIdSet = new Set(customIds);

      // 3) Buscar somente os custom_items usados pelo usuário (evita baixar todo o catálogo pesado)
      const customItemsDB = customIdSet.size > 0
        ? await raceWithTimeout(
            supabase
              .from('custom_items')
              .select('id, name, description, item_type, icon')
              .in('id', Array.from(customIdSet))
          )
        : { data: [] as any[] };
      const customItemsFromDB = customItemsDB as any;

      // Load custom items from localStorage com fallback
      let customItems = {};
      try {
        customItems = JSON.parse(localStorage.getItem('customItems') || '{}');
      } catch (e) {
        console.warn('Failed to parse custom items from localStorage');
      }

      // Merge all custom items efficiently com Map para performance
      const allCustomItems = new Map();
      
      // Add localStorage items (somente os que o usuário possui)
      Object.entries(customItems).forEach(([id, item]) => {
        if (customIdSet.has(id)) {
          allCustomItems.set(id, item);
        }
      });
      
      // Add DB items (override localStorage if exists)
      if (customItemsFromDB.data) {
        customItemsFromDB.data.forEach((item: any) => {
          // Get existing item from localStorage to preserve effect
          const existingItem = customItems[item.id];
          allCustomItems.set(item.id, {
            id: item.id,
            name: item.name,
            description: item.description,
            itemType: item.item_type,
            icon: item.icon,
            isCustom: true,
            effect: existingItem?.effect || null // Preserve effect from localStorage
          });
        });
      }

      // Process data usando Map para lookup O(1)
      const formattedInventory: InventoryItem[] = [];
      const formattedHistory: HistoryItem[] = [];
      
      // Batch process items
      if (inventoryData) {
        inventoryData.forEach((item: any) => {
          const processedItem = processInventoryItemOptimized(item, allCustomItems);
          
          if (processedItem) {
            formattedInventory.push(processedItem.inventoryItem);
            
            if (item.sent_by_username) {
              formattedHistory.push(processedItem.historyItem);
            }
          }
        });
      }

      // Update states em batch
      setInventory(formattedInventory);
      setHistoryItems(formattedHistory);
      
      // Cache the data com compressão
      const newCacheData = {
        inventory: formattedInventory,
        history: formattedHistory,
        timestamp: Date.now()
      };
      setCachedData(newCacheData);
      
      // Salva cache de forma assíncrona
      setTimeout(() => {
        try {
          sessionStorage.setItem(`bagData_${currentUser}`, JSON.stringify(newCacheData));
        } catch (e) {
          console.warn('Failed to save cache');
        }
      }, 0);
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error loading bag data:', error);
      // Em caso de erro, tenta mostrar dados do cache se disponível
      if (cachedData) {
        setInventory(cachedData.inventory);
        setHistoryItems(cachedData.history);
      }
      setIsLoading(false);
    }
  }, [currentUser, cachedUserId, showCachedDataFirst, cachedData, processInventoryItemOptimized]);

  // Realtime: refresh inventory when it changes (especialmente motoboy)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`inventory-realtime-${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'inventory',
          filter: `user_id=eq.${currentUser}`
        },
        (payload) => {
          console.log('📦 Novo item recebido:', payload);
          const newItem = payload.new;
          
          // Atualização especial para itens do motoboy
          if (newItem?.sent_by_username === 'motoboy') {
            console.log('🚚 Item do motoboy recebido em tempo real!');
            // Refresh imediato para mostrar item do motoboy
            setTimeout(() => {
              loadAllData(true);
            }, 100);
          } else {
            // Refresh normal para outros itens
            setTimeout(() => {
              loadAllData(true);
            }, 300);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'inventory',
          filter: `user_id=eq.${currentUser}`
        },
        (payload) => {
          console.log('📦 Item atualizado:', payload);
          setTimeout(() => {
            loadAllData(true);
          }, 200);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public', 
          table: 'inventory',
          filter: `user_id=eq.${currentUser}`
        },
        (payload) => {
          console.log('📦 Item removido:', payload);
          setTimeout(() => {
            loadAllData(true);
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status real-time inventory: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadAllData]);

  // Load data on component mount with instant cache
  useEffect(() => {
    if (!currentUser) return;

    // Try cache first, then load fresh data
    const hasCache = showCachedDataFirst();
    if (!hasCache) {
      loadAllData();
    } else {
      // Load fresh data in background se o cache for antigo
      const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
      if (cacheAge > 10000) { // Refresh em background se cache > 10s
        setTimeout(() => loadAllData(), 100);
      }
    }
  }, [currentUser, loadAllData, showCachedDataFirst, cachedData]);

  // Auto-refresh quando receber novos itens (polling a cada 30s quando app está aberto)
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      // Força refresh para pegar novos itens do motoboy
      loadAllData(true);
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [currentUser, loadAllData]);

  const handleUseItem = async (item: InventoryItem) => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para usar itens",
        variant: "destructive",
      });
      return;
    }

    try {
      let effectApplied = false;
      const userRecord = await getUserId(currentUser);
      
      if (!userRecord) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Check if it's a medicine and if user has the corresponding disease
      const medicineToDisease: { [key: string]: string } = {
        'Protetor Solar "Luz de Sombra"': 'Queimadura Solar Arcana',
        'Elixir Refrescante de Gelo': 'Gripe do Vento Gelado', 
        'Máscara da Luz Divina': 'Febre da Lua Cheia',
        'Essência do Calmante Sereno': 'Enjoo do Portal',
        'Gel Purificador do Clérigo': 'Virose do Pó de Fada',
        'Pomada do Sábio Curador': 'Dor Fantasma de Batalha',
        'Máscara da Névoa Purificadora': 'Irritação de Poeira Mágica',
        'Pomada da Fênix': 'Pele de Pedra',
        'Néctar das Sereias': 'Febre de Dragão'
      };

      // Medicine: try to cure corresponding disease
      if (medicineToDisease[item.name]) {
        console.log(`Attempting to use medicine: ${item.name}`);
        try {
          const cured = await (cureDiseaseWithMedicine?.(item.name, userRecord));
          
          if (cured) {
            effectApplied = true;
            toast({
              title: "Medicina aplicada!",
              description: `${item.name} curou sua doença!`,
            });
          } else {
            toast({
              title: "Medicina ineficaz",
              description: "Você não possui a doença correspondente a este remédio.",
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error('Error using medicine:', error);
          toast({
            title: "Erro ao usar remédio",
            description: "Tente novamente",
            variant: "destructive",
          });
          return;
        }
      } else if (item.effect || item.effects) {
        // Handle items with effects (both single effect and multiple effects)
        let healthChange = 0;
        let hungerChange = 0;
        let moodChange = 0;
        let happinessChange = 0;
        let energyChange = 0;
        let alcoholismChange = 0;
        let effectMessage = "";

        // Check if item has multiple effects (effects array)
        if (item.effects && Array.isArray(item.effects)) {
          // Handle multiple effects from effects array
          item.effects.forEach(effect => {
            switch (effect.type) {
              case "health":
                healthChange += effect.value;
                break;
              case "hunger":
                hungerChange += effect.value;
                break;
              case "mood":
                moodChange += effect.value;
                if (effect.message && !effectMessage) effectMessage = effect.message;
                break;
              case "happiness":
                happinessChange += effect.value;
                break;
              case "energy":
                energyChange += effect.value;
                break;
              case "alcoholism":
                alcoholismChange += effect.value;
                break;
            }
          });
        } else if (item.effect && item.effect.type === "multiple" && "effects" in item.effect) {
          // Handle multiple effects from effect.effects
          item.effect.effects.forEach(effect => {
            switch (effect.type) {
              case "health":
                healthChange += effect.value;
                break;
              case "hunger":
                hungerChange += effect.value;
                break;
              case "mood":
                moodChange += effect.value;
                if (effect.message && !effectMessage) effectMessage = effect.message;
                break;
              case "happiness":
                happinessChange += effect.value;
                break;
              case "energy":
                energyChange += effect.value;
                break;
              case "alcoholism":
                alcoholismChange += effect.value;
                break;
            }
          });
          if (item.effect.message && !effectMessage) effectMessage = item.effect.message;
        } else if (item.effect) {
          // Handle single effect
          const effect = item.effect as { type: string; value: number; message?: string };
          if (effect.message) effectMessage = effect.message;
          
          switch (effect.type) {
            case "health":
              healthChange = effect.value;
              break;
            case "hunger":
              hungerChange = effect.value;
              break;
            case "mood":
              moodChange = effect.value;
              break;
            case "happiness":
              happinessChange = effect.value;
              break;
            case "energy":
              energyChange = effect.value;
              break;
            case "alcoholism":
              alcoholismChange = effect.value;
              break;
          }
        }

        // Apply all changes at once
        const updates: any = {};
        
        if (healthChange !== 0) {
          updates.health = Math.min(100, Math.max(0, (gameStats.health || 100) + healthChange));
        }
        
        if (hungerChange !== 0) {
          updates.hunger = Math.min(100, Math.max(0, (gameStats.hunger ?? 0) + hungerChange));
        }
        
        if (energyChange !== 0) {
          updates.energy = Math.min(100, Math.max(0, (gameStats.energy || 100) + energyChange));
        }
        
        // Handle happiness - for ice cream and sexshop stores, always apply happiness from any effect
        const isHappinessStore = item.storeId === 'sexshop' || item.storeId === 'sorveteria';
        let totalHappinessChange = happinessChange;
        
        if (isHappinessStore) {
          // Add happiness from mood, hunger, or energy effects if happiness wasn't explicitly set
          if (happinessChange === 0) {
            totalHappinessChange = moodChange || hungerChange || energyChange || 0;
          }
        }
        
        if (totalHappinessChange !== 0) {
          updates.happiness = Math.min(100, Math.max(0, (gameStats.happiness || 100) + totalHappinessChange));
        }
        
        if (alcoholismChange !== 0) {
          updates.alcoholism = Math.min(100, Math.max(0, (gameStats.alcoholism || 0) + alcoholismChange));
        }

        // Apply updates to database
        if (Object.keys(updates).length > 0) {
          await updateStats(updates);
          effectApplied = true;
        }

        // Add temporary mood effect if there's a message
        if (effectMessage && (moodChange !== 0 || item.itemType === "drink")) {
          await addTemporaryEffect(effectMessage, 60, item.itemType === "drink" ? "bar" : "other");
        }
      } else {
        // Itens sem efeito ainda podem ser consumidos
        effectApplied = true;
        toast({
          title: "Item consumido!",
          description: `Você usou ${item.name}`,
        });
      }
      
      if (effectApplied) {
        // Use the database function to properly consume the item
        const { data: consumeResult, error: consumeError } = await supabase
          .rpc('consume_inventory_item', {
            p_user_id: userRecord,
            p_item_id: item.id,
            p_quantity_to_consume: 1
          });

        if (consumeError) {
          console.error('Error consuming item:', consumeError);
          toast({
            title: "Erro ao consumir item",
            description: "Não foi possível remover o item do inventário",
            variant: "destructive",
          });
          return;
        }

        // Refresh inventory to reflect changes
        loadAllData(true);
        
        toast({
          title: "Item usado!",
          description: `Você usou ${item.name}`,
        });
      }
    } catch (error) {
      console.error('Error using item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível usar o item",
        variant: "destructive",
      });
    }
  };

  const handleSendItem = (item: InventoryItem) => {
    setSelectedItemToSend(item);
    setSendItemModalOpen(true);
  };

  const handleSendFriendshipItem = (item: InventoryItem) => {
    setSelectedFriendshipItem(item);
    setSendFriendshipItemModalOpen(true);
  };

  const handleRomanticProposal = (item: InventoryItem) => {
    if (item.originalItem) {
      setSelectedRing(item.originalItem);
      setSendRingModalOpen(true);
    }
  };

  const handleDivideItem = (item: InventoryItem) => {
    setSelectedItemToDivide(item);
    setDivideItemModalOpen(true);
  };

  const handleDivideItemConfirm = async (friendId: string, friendUsername: string, shareAmount: number, remainingAmount: number) => {
    if (!selectedItemToDivide || !currentUser) return;

    try {
      // Get current user data
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (currentUserError || !currentUserData) {
        toast({
          title: "Erro",
          description: "Usuário atual não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Create a shared item with reduced effect for the friend
      const sharedItem = {
        ...selectedItemToDivide,
        effect: selectedItemToDivide.effect ? {
          ...selectedItemToDivide.effect,
          ...(selectedItemToDivide.effect.type === "multiple" && "effects" in selectedItemToDivide.effect
            ? {
                effects: selectedItemToDivide.effect.effects.map(effect => ({
                  ...effect,
                  value: shareAmount
                }))
              }
            : { value: shareAmount })
        } : undefined
      };

      // Send shared portion to friend
      const { data: existingItem } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('user_id', friendId)
        .eq('item_id', selectedItemToDivide.id)
        .single();

      if (existingItem) {
        // Update existing item quantity
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: existingItem.quantity + 1,
            sent_by_username: `${currentUser} (dividido)`,
            sent_by_user_id: currentUserData.id,
            received_at: new Date().toISOString()
          })
          .eq('user_id', friendId)
          .eq('item_id', selectedItemToDivide.id);

        if (updateError?.message?.includes('Limite de 3 itens')) {
          throw new Error(`${friendUsername} já atingiu o limite de 3 itens deste tipo`);
        }
        if (updateError) throw updateError;
      } else {
        // Add new item to friend's inventory
        const { error: addError } = await supabase
          .from('inventory')
          .insert({
            user_id: friendId,
            item_id: selectedItemToDivide.id,
            quantity: 1,
            sent_by_username: `${currentUser} (dividido)`,
            sent_by_user_id: currentUserData.id,
            received_at: new Date().toISOString()
          });

        if (addError?.message?.includes('Limite de 3 itens')) {
          throw new Error(`${friendUsername} já atingiu o limite de 3 itens deste tipo`);
        }
        if (addError) throw addError;

        // If it's a custom item, store it in custom_items table too
        if (selectedItemToDivide.storeId === "custom" && selectedItemToDivide.originalItem) {
          await supabase
            .from('custom_items')
            .upsert({
              id: selectedItemToDivide.id,
              name: selectedItemToDivide.originalItem.name,
              description: selectedItemToDivide.originalItem.description,
              item_type: selectedItemToDivide.originalItem.itemType,
              icon: selectedItemToDivide.originalItem.icon,
              created_by_user_id: currentUserData.id
            }, { onConflict: 'id' });
        }
      }

      // Apply reduced effect to current user and consume item
      if (selectedItemToDivide.effect) {
        const effects = selectedItemToDivide.effect.type === "multiple" && "effects" in selectedItemToDivide.effect
          ? selectedItemToDivide.effect.effects
          : [selectedItemToDivide.effect];

        for (const effect of effects) {
          const reducedValue = remainingAmount;
          
          switch (effect.type) {
            case "health":
              await updateStats({ health: Math.min(100, (gameStats.health || 0) + reducedValue) });
              break;
            case "hunger":
              await updateStats({ hunger: Math.min(100, (gameStats.hunger || 0) + reducedValue) });
              if (selectedItemToDivide.storeId === 'sexshop' || selectedItemToDivide.storeId === 'sorveteria') {
                await updateStats({ happiness: Math.min(100, (gameStats.happiness || 0) + reducedValue) });
              }
              break;
            case "mood":
              if (selectedItemToDivide.storeId === 'sexshop' || selectedItemToDivide.storeId === 'sorveteria') {
                await updateStats({ happiness: Math.min(100, (gameStats.happiness || 0) + reducedValue) });
              }
              break;
            case "energy":
              await updateStats({ energy: Math.min(100, (gameStats.energy || 0) + reducedValue) });
              if (selectedItemToDivide.storeId === 'sexshop' || selectedItemToDivide.storeId === 'sorveteria') {
                await updateStats({ happiness: Math.min(100, (gameStats.happiness || 0) + reducedValue) });
              }
              break;
            case "alcoholism":
              if (isAlcoholic(selectedItemToDivide.storeId || '', selectedItemToDivide.id)) {
                await updateStats({ alcoholism: Math.min(100, (gameStats.alcoholism || 0) + reducedValue) });
              }
              break;
            case "happiness":
              await updateStats({ happiness: Math.min(100, (gameStats.happiness || 100) + reducedValue) });
              if (selectedItemToDivide.storeId === 'sexshop' || selectedItemToDivide.storeId === 'sorveteria') {
                await updateStats({ happiness: Math.min(100, (gameStats.happiness || 100) + reducedValue) });
              }
              break;
          }
        }
      }

      // Remove/decrease item from current user's inventory
      await supabase
        .from('inventory')
        .update({ quantity: selectedItemToDivide.quantity - 1 })
        .eq('id', selectedItemToDivide.inventoryId);

      if (selectedItemToDivide.quantity <= 1) {
        await supabase
          .from('inventory')
          .delete()
          .eq('id', selectedItemToDivide.inventoryId);
      }

      // Refresh inventory
      loadAllData(true);
      
      toast({
        title: "Item dividido! 🤝",
        description: `Você dividiu ${selectedItemToDivide.name} com ${friendUsername.replace(/\d{4}$/, '')}`
      });

    } catch (error) {
      console.error('Error dividing item:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível dividir o item",
        variant: "destructive"
      });
    }
  };

  // Group items by category
  const foodItems = inventory.filter(item => item.itemType === "food");
  const drinkItems = inventory.filter(item => item.itemType === "drink");
  const objectItems = inventory.filter(item => item.itemType === "object");

  const renderItems = (items: InventoryItem[]) => {
    if (items.length === 0) {
      return (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum item nesta categoria</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((item, index) => (
      <Card key={`${item.id}-${index}`} className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {/* Show custom item icon/image if available */}
            {item.originalItem?.icon ? (
              typeof item.originalItem.icon === 'string' && item.originalItem.icon.startsWith('data:') ? (
                <img src={item.originalItem.icon} alt={item.name} className="w-6 h-6 rounded object-cover" width={24} height={24} loading="lazy" decoding="async" />
              ) : (
                <span className="text-lg">{item.originalItem.icon}</span>
              )
            ) : item.storeId === "icecream" ? (
              <span className="text-lg">{getIceCreamIcon(item)}</span>
            ) : (
              <span className="text-lg">{getCategoryIcon(item.itemType, item.name, item.storeId)}</span>
            )}
            {item.name}
            {item.quantity > 1 && (
              <Badge variant="secondary" className="text-xs">
                {item.quantity}x
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            {(item.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2')}
          </p>
          
          {item.isRing && (
            <div className="mb-3 p-2 bg-love/10 border border-love/20 rounded">
              <p className="text-xs text-love font-medium">
                ❤️ {item.relationshipType === 'friendship' 
                  ? 'Use este anel para criar uma amizade épica especial'
                  : 'Use este anel para fazer uma proposta romântica especial'}
              </p>
            </div>
          )}
          
           {item.effect && !item.isRing && (
            <div className="mb-3 flex gap-1 flex-wrap">
              {item.effect.type === "multiple" && "effects" in item.effect ? (
                item.effect.effects.map((effect, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {getEffectIcon(effect.type as any)}
                    +{effect.value} {getEffectName(effect.type as any)}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">
                  {getEffectIcon(item.effect.type as any)}
                  +{(item.effect as any).value} {getEffectName(item.effect.type as any)}
                </Badge>
              )}
            </div>
          )}
          
          {/* Show original item effects if available (for items with multiple effects) */}
          {item.originalItem?.effects && !item.effect && !item.isRing && (
            <div className="mb-3 flex gap-1 flex-wrap">
              {item.originalItem.effects.map((effect, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {getEffectIcon(effect.type as any)}
                  +{effect.value} {getEffectName(effect.type as any)}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            {item.canUse && (
              <>
                {(item.itemType === "food" || item.itemType === "drink") ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="flex-1">
                        {item.itemType === "drink" ? "Beber" : "Comer"}
                        <ChevronDown size={14} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[160px]">
                      <DropdownMenuItem onClick={() => handleUseItem(item)}>
                        <Utensils size={14} className="mr-2" />
                        {item.itemType === "drink" ? "Beber tudo" : "Comer tudo"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDivideItem(item)}>
                        <Users size={14} className="mr-2" />
                        Dividir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleUseItem(item)}
                    className="flex-1"
                  >
                    Usar
                  </Button>
                )}
              </>
            )}
            
            {item.isRing ? (
              <Button
                size="sm"
                onClick={() => item.relationshipType === 'friendship' 
                  ? handleSendFriendshipItem(item) 
                  : handleRomanticProposal(item)}
                className="flex-1 bg-love hover:bg-love/90 text-white"
              >
                <Heart size={14} className="mr-1" />
                {item.relationshipType === 'friendship' 
                  ? 'Que tal a gente criar uma amizade épica'
                  : 'Fazer pedido romântico'}
              </Button>
            ) : item.relationshipType === "friendship" ? (
              <Button
                size="sm"
                onClick={() => handleSendFriendshipItem(item)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Users size={14} className="mr-1" />
                Enviar para amigo
              </Button>
            ) : item.canSend && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendItem(item)}
                className="flex-1"
              >
                <Send size={14} className="mr-1" />
                Enviar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderHistory = () => {
    if (historyItems.length === 0) {
      return (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6 text-center">
            <History size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum item recebido ainda</p>
            <p className="text-xs text-muted-foreground mt-2">
              Os itens enviados por outros jogadores aparecerão aqui
            </p>
          </CardContent>
        </Card>
      );
    }

    return historyItems.map((item, index) => (
      <Card key={`${item.id}-${index}`} className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {/* Show custom item icon/image if available */}
            {item.isCustom && item.originalItem?.icon ? (
              typeof item.originalItem.icon === 'string' && item.originalItem.icon.startsWith('data:') ? (
                <img src={item.originalItem.icon} alt={item.name} className="w-6 h-6 rounded object-cover" width={24} height={24} loading="lazy" decoding="async" />
              ) : (
                <span className="text-lg">{item.originalItem.icon}</span>
              )
            ) : item.storeId === "icecream" ? (
              <span className="text-lg">{getIceCreamIcon(item)}</span>
            ) : (
              <span className="text-lg">{getCategoryIcon(item.itemType, item.name, item.storeId)}</span>
            )}
            {item.name}
            {item.quantity > 1 && (
              <Badge variant="secondary" className="text-xs">
                {item.quantity}x
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            {(item.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2')}
          </p>
          
          {/* Sender and date info */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-primary/5 rounded border border-primary/10">
            <Send size={14} className="text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium text-primary">
                Enviado por: {item.sent_by_username ? getDisplayName(item.sent_by_username) : 'Desconhecido'}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} />
                {new Date(item.received_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          {/* Effect info */}
          {item.effect && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {getEffectIcon(item.effect.type as any)}
                +{item.effect.value} {getEffectName(item.effect.type as any)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Package className="text-primary-foreground" size={20} />
            </div>
            <h1 className="text-lg font-bold text-foreground">Minha Bolsa</h1>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && inventory.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Carregando itens...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {(!isLoading || inventory.length > 0) && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="food" className="flex items-center gap-1 text-xs">
              <Utensils size={14} />
              Comidas ({foodItems.length})
            </TabsTrigger>
            <TabsTrigger value="drink" className="flex items-center gap-1 text-xs">
              <Wine size={14} />
              Bebidas ({drinkItems.length})
            </TabsTrigger>
            <TabsTrigger value="object" className="flex items-center gap-1 text-xs">
              <Package size={14} />
              Objetos ({objectItems.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 text-xs">
              <History size={14} />
              Recebidos ({historyItems.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="food" className="space-y-3 mt-0">
              {renderItems(foodItems)}
            </TabsContent>

            <TabsContent value="drink" className="space-y-3 mt-0">
              {renderItems(drinkItems)}
            </TabsContent>

            <TabsContent value="object" className="space-y-3 mt-0">
              {renderItems(objectItems)}
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-0">
              {renderHistory()}
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* Modals */}
      <SendRingModal
        isOpen={sendRingModalOpen}
        onClose={() => setSendRingModalOpen(false)}
        ring={selectedRing}
      />
      
      <SendItemModal
        isOpen={sendItemModalOpen}
        onClose={() => setSendItemModalOpen(false)}
        item={selectedItemToSend}
        onItemSent={() => {
          setSendItemModalOpen(false);
          loadAllData(true);
        }}
      />

      <SendFriendshipItemModal
        isOpen={sendFriendshipItemModalOpen}
        onClose={() => {
          setSendFriendshipItemModalOpen(false);
          loadAllData(true);
        }}
        item={selectedFriendshipItem}
      />

      <DivideItemModal
        isOpen={divideItemModalOpen}
        onClose={() => {
          setDivideItemModalOpen(false);
          setSelectedItemToDivide(null);
        }}
        item={selectedItemToDivide}
        onDivide={handleDivideItemConfirm}
      />
    </div>
  );
}
