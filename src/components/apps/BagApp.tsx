import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Send, Utensils, Wine, Pill, Heart, History, Clock, Users } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORES } from "@/data/stores";
import { useGame } from "@/contexts/GameContext";
import { getItemType, getCategoryIcon, getCategoryName, getEffectIcon, getEffectName, isAlcoholic, getAlcoholLevel } from "@/lib/itemCategories";
import { SendRingModal } from "@/components/modals/SendRingModal";

import { SendItemModal } from "@/components/modals/SendItemModal";
import { SendFriendshipItemModal } from "@/components/modals/SendFriendshipItemModal";
import { StoreItem } from "@/data/stores";

interface BagAppProps {
  onBack: () => void;
}

interface InventoryItem {
  id: string;
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
    message: string;
  } | {
    type: "multiple";
    effects: Array<{
      type: string;
      value: number;
    }>;
    message: string;
  };
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
  const [selectedRing, setSelectedRing] = useState<StoreItem | null>(null);
  const [selectedItemToSend, setSelectedItemToSend] = useState<InventoryItem | null>(null);
  const [selectedFriendshipItem, setSelectedFriendshipItem] = useState<InventoryItem | null>(null);

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
    return username.replace(/\d{4}$/, '');
  };

  // Create item lookup map for better performance (memoized)
  const itemLookupMap = useMemo(() => {
    const lookupMap = new Map();
    const nameToIdMap = new Map(); // Novo mapa para busca por nome
    
    for (const [storeId, store] of Object.entries(STORES)) {
      for (const item of store.items) {
        lookupMap.set(item.id, { item, storeId });
        // Adiciona mapeamento nome -> ID para itens do motoboy
        nameToIdMap.set(item.name, { item, storeId });
      }
    }
    return { lookupMap, nameToIdMap };
  }, []);

  // Function to get specific ice cream icons based on category
  const getIceCreamIcon = (item: InventoryItem | HistoryItem): string => {
    // Check if item has an explicit icon first
    if (item.originalItem?.icon) {
      return item.originalItem.icon;
    }
    
    const category = item.originalItem?.category;
    if (category === "Sorvetes de Rolo" || category === "Sorvetes Especiais") {
      return "🍨";
    } else if (category === "Açaí") {
      return "🫐";
    } else if (category === "Crepes") {
      return "🥞";
    } else if (category === "Milk-Shakes") {
      return "🥤";
    } else if (category === "Smoothies") {
      return "🥤";
    } else if (category === "Sobremesas") {
      return "🍰";
    }
    return "🍦"; // Default ice cream icon
  };

  // Cache user ID to avoid repeated lookups
  const getUserId = async (username: string): Promise<string | null> => {
    const cacheKey = `userId_${username}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached && cachedUserId) {
      return cachedUserId;
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
          .select('item_id, quantity, sent_by_username, received_at, created_at')
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

      if (inventoryError) {
        console.error('Inventory error:', inventoryError);
        throw inventoryError;
      }

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
          allCustomItems.set(item.id, {
            id: item.id,
            name: item.name,
            description: item.description,
            itemType: item.item_type,
            icon: item.icon,
            isCustom: true,
            effect: null
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
  }, [currentUser, cachedUserId, showCachedDataFirst, cachedData]);

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
        
        return {
          inventoryItem: {
            id: fallbackItem.id,
            name: fallbackItem.name,
            description: fallbackItem.description,
            itemType: fallbackItem.itemType,
            quantity: item.quantity,
            storeId: "custom",
            canUse: true,
            canSend: true,
            isRing: false,
            originalItem: fallbackItem,
            effect: { type: "mood" as const, value: 1, message: `Você usou ${fallbackItem.name}!` }
          },
          historyItem: {
            id: fallbackItem.id,
            name: fallbackItem.name,
            description: fallbackItem.description,
            itemType: fallbackItem.itemType,
            quantity: item.quantity,
            sent_by_username: item.sent_by_username || null,
            received_at: item.received_at || item.created_at,
            storeId: "custom",
            isCustom: true,
            originalItem: fallbackItem
          }
        };
      }
      
      // Pre-computed effects for custom items
      const effectMap = {
        food: { type: "hunger", value: 25, message: `Você comeu ${customItem.name} e se sente satisfeito!` },
        drink: { type: "energy", value: 20, message: `Você bebeu ${customItem.name} e se sente energizado!` },
        object: { type: "mood", value: 15, message: `Você usou ${customItem.name} e se sente muito melhor!` }
      };

      const effect = effectMap[customItem.itemType as keyof typeof effectMap] || null;
      const cleanDescription = (customItem.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2');
      
      return {
        inventoryItem: {
          id: customItem.id,
          name: customItem.name,
          description: cleanDescription,
          itemType: customItem.itemType,
          quantity: item.quantity,
          storeId: "custom",
          canUse: true,
          canSend: true,
          isRing: false,
          originalItem: customItem,
          effect
        },
        historyItem: {
          id: customItem.id,
          name: customItem.name,
          description: cleanDescription,
          itemType: customItem.itemType,
          quantity: item.quantity,
          sent_by_username: item.sent_by_username || null,
          received_at: item.received_at || item.created_at,
          storeId: "custom",
          isCustom: true,
          originalItem: customItem
        }
      };
    }
    
    // Store item processing with cached lookup
    const itemData = itemLookupMap.lookupMap.get(item.item_id) || itemLookupMap.nameToIdMap.get(item.item_id);
    if (itemData) {
      const { item: storeItem, storeId } = itemData;
      const itemType = getItemType(storeId, storeItem.id);
      const canUse = !!storeItem.effect || !!storeItem.effects || (storeItem as any).type === "medicine" || storeId === "sexshop" || (storeId === "jewelry" && !(storeItem as any).relationshipType);
      const isRing = storeId === "jewelry" && !!(storeItem as any).relationshipType;
      
      const effect = storeItem.effect ? {
        type: storeItem.effect.type,
        value: storeItem.effect.value,
        message: storeItem.effect.message || `Efeito de ${storeItem.name}`
      } : storeId === "jewelry" && !(storeItem as any).relationshipType ? {
        type: "mood" as const,
        value: 15,
        message: `Você usou ${storeItem.name} e se sente mais feliz!`
      } : undefined;
      
      const inventoryItem = {
        id: storeItem.id,
        name: storeItem.name,
        description: storeItem.description,
        itemType,
        quantity: item.quantity,
        storeId,
        price: storeItem.price,
        canUse: canUse && !isRing,
        canSend: !isRing && !(storeId === "jewelry" && (storeItem as any).relationshipType === "friendship"),
        isRing,
        relationshipType: (storeItem as any).relationshipType,
        originalItem: storeItem,
        effect
      };

      const historyItem = {
        id: storeItem.id,
        name: storeItem.name,
        description: storeItem.description,
        itemType,
        quantity: item.quantity,
        sent_by_username: item.sent_by_username || null,
        received_at: item.received_at || item.created_at,
        storeId,
        isCustom: false,
        originalItem: storeItem,
        effect
      };

      
      return { inventoryItem, historyItem };
    }

    return null;
  }, [itemLookupMap.lookupMap, itemLookupMap.nameToIdMap]);

  // Load data on component mount with instant cache
  useEffect(() => {
    if (currentUser) {
      // Try cache first, then load fresh data
      const hasCache = showCachedDataFirst();
      if (!hasCache) {
        loadAllData();
      } else {
        // Load fresh data in background se o cache for antigo
        const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
        if (cacheAge > 10000) { // Refresh em background se cache > 10s
          setTimeout(() => loadAllData(true), 100);
        }
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
    try {
      console.log('🍎 Tentando usar item:', item.name, item);
      if (!currentUser) {
        console.log('❌ Usuário não encontrado');
        return;
      }

      // Get the user record from users table by username
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, hunger_percentage, life_percentage, mood, alcoholism_percentage, happiness_percentage')
        .eq('username', currentUser)
        .maybeSingle();

      console.log('👤 User record:', userRecord, 'Error:', userError);

      if (userError || !userRecord) {
        console.log('❌ Erro ao buscar dados do usuário:', userError);
        return;
      }

      // (hooks já desestruturados no topo do componente)

      // Handle jewelry items that increase happiness
      if (item.storeId === "jewelry" && !item.relationshipType) {
        const newHappiness = Math.min(100, (userRecord.happiness_percentage || 100) + 15);
        
        await supabase
          .from('users')
          .update({ happiness_percentage: newHappiness })
          .eq('id', userRecord.id);

        updateStats({ happiness: newHappiness });
        
        toast({
          title: "✨ Item de Joalheria Usado",
          description: `Você usou ${item.name} e se sente mais feliz! (+15 felicidade)`
        });

        // Remove one item from inventory
        if (item.quantity <= 1) {
          await supabase
            .from('inventory')
            .delete()
            .eq('user_id', userRecord.id)
            .eq('item_id', item.id);
        } else {
          await supabase
            .from('inventory')
            .update({ quantity: item.quantity - 1 })
            .eq('user_id', userRecord.id)
            .eq('item_id', item.id);
        }

        await loadAllData(true);
        return;
      }

      // Handle custom items
      if (item.storeId === "custom") {
        let dbUpdateStats: any = {};
        let gameContextStats: any = {};
        let effectMessage = `Você usou ${item.name}`;

        if (item.effect) {
          if (item.effect.type === "multiple" && "effects" in item.effect) {
            // Handle multiple effects for drinks
            for (const effect of item.effect.effects) {
              switch (effect.type) {
                case "hunger":
                  const newHunger = Math.min(100, userRecord.hunger_percentage + effect.value);
                  dbUpdateStats.hunger_percentage = newHunger;
                  gameContextStats.hunger = newHunger;
                  break;
                case "happiness":
                  const newHappiness = Math.min(100, (userRecord.happiness_percentage || 100) + effect.value);
                  dbUpdateStats.happiness_percentage = newHappiness;
                  gameContextStats.happiness = newHappiness;
                  break;
                case "energy":
                  const { data: userData } = await supabase
                    .from('users')
                    .select('energy_percentage')
                    .eq('id', userRecord.id)
                    .single();
                  const newEnergy = Math.min(100, (userData?.energy_percentage || 100) + effect.value);
                  dbUpdateStats.energy_percentage = newEnergy;
                  gameContextStats.energy = newEnergy;
                  break;
              }
            }
            effectMessage = item.effect.message;
          } else {
            // Handle single effects
            switch (item.effect.type) {
              case "health":
                const newHealth = Math.min(100, userRecord.life_percentage + item.effect.value);
                dbUpdateStats.life_percentage = newHealth;
                gameContextStats.health = newHealth;
                effectMessage = item.effect.message;
                break;
              case "hunger":
                const newHunger = Math.min(100, userRecord.hunger_percentage + item.effect.value);
                dbUpdateStats.hunger_percentage = newHunger;
                gameContextStats.hunger = newHunger;
                effectMessage = item.effect.message;
                break;
              case "mood":
                const newMood = Math.min(100, userRecord.mood + item.effect.value);
                dbUpdateStats.mood = newMood;
                gameContextStats.mood = newMood.toString();
                effectMessage = item.effect.message;
                break;
              case "energy":
                const { data: userData } = await supabase
                  .from('users')
                  .select('energy_percentage')
                  .eq('id', userRecord.id)
                  .single();
                const newEnergy = Math.min(100, (userData?.energy_percentage || 100) + item.effect.value);
                dbUpdateStats.energy_percentage = newEnergy;
                gameContextStats.energy = newEnergy;
                effectMessage = item.effect.message;
                break;
            }
          }
        }

        // Update user stats in database
        if (Object.keys(dbUpdateStats).length > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update(dbUpdateStats)
            .eq('id', userRecord.id);
          if (updateError) throw updateError;
        }

        // Update GameContext stats
        if (Object.keys(gameContextStats).length > 0) {
          await updateStats(gameContextStats);
        }

        toast({
          title: "Item usado!",
          description: effectMessage
        });

        // Remove one item from inventory
        if (item.quantity <= 1) {
          await supabase
            .from('inventory')
            .delete()
            .eq('user_id', userRecord.id)
            .eq('item_id', item.id);
        } else {
          await supabase
            .from('inventory')
            .update({ quantity: item.quantity - 1 })
            .eq('user_id', userRecord.id)
            .eq('item_id', item.id);
        }

        await loadAllData(true);
        return;
      }

      // Itens de loja (não custom)
      console.log('🍦 Processando item de loja:', item.name, 'storeId:', item.storeId);
      let dbUpdateStats: any = {};
      let gameContextStats: any = {};
      let effectMessage = item.effect?.message || `Você usou ${item.name}`;

      // Remédio: tenta curar a doença correspondente
      if (item.originalItem?.type === 'medicine') {
        console.log('💊 Item é remédio:', item.name);
        try {
          await (cureDiseaseWithMedicine?.(item.name, userRecord.id));
        } catch {}
      }

      // Aplicar efeitos básicos
      console.log('⚡ Aplicando efeitos básicos. Item effect:', item.effect, 'Item effects:', item.originalItem?.effects);
      
      // Handle single effect
      if (item.effect) {
        console.log('🎯 Item tem efeito single, type:', item.effect.type, 'value:', (item.effect as any).value);
        switch (item.effect.type) {
          case 'health': {
            const newHealth = Math.min(100, (userRecord.life_percentage || 100) + item.effect.value);
            dbUpdateStats.life_percentage = newHealth;
            gameContextStats.health = newHealth;
            break;
          }
          case 'hunger': {
            const newHunger = Math.min(100, (userRecord.hunger_percentage || 0) + item.effect.value);
            dbUpdateStats.hunger_percentage = newHunger;
            gameContextStats.hunger = newHunger;
            break;
          }
          case 'mood': {
            const newMood = Math.min(100, (userRecord.mood || 5) + item.effect.value);
            dbUpdateStats.mood = newMood;
            gameContextStats.mood = newMood.toString();
            break;
          }
          case 'alcoholism': {
            const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + item.effect.value);
            dbUpdateStats.alcoholism_percentage = newAlcoholism;
            gameContextStats.alcoholism = newAlcoholism;
            break;
          }
          case 'energy': {
            if (item.originalItem?.effect?.duration && item.originalItem?.effect?.message) {
              await addTemporaryEffect(item.originalItem.effect.message, item.originalItem.effect.duration, 'other');
            }
            break;
          }
        }
        effectMessage = item.effect.message || effectMessage;
      }
      
      // Handle multiple effects (for ice cream items)
      if (item.originalItem?.effects && Array.isArray(item.originalItem.effects)) {
        console.log('🎯 Item tem múltiplos efeitos:', item.originalItem.effects.length);
        for (const effect of item.originalItem.effects) {
          console.log('🎯 Aplicando efeito:', effect.type, 'value:', effect.value);
          switch (effect.type) {
            case 'health': {
              const newHealth = Math.min(100, (userRecord.life_percentage || 100) + effect.value);
              dbUpdateStats.life_percentage = newHealth;
              gameContextStats.health = newHealth;
              break;
            }
            case 'hunger': {
              const newHunger = Math.min(100, (userRecord.hunger_percentage || 0) + effect.value);
              dbUpdateStats.hunger_percentage = newHunger;
              gameContextStats.hunger = newHunger;
              break;
            }
            case 'mood': {
              const newMood = Math.min(100, (userRecord.mood || 5) + effect.value);
              dbUpdateStats.mood = newMood;
              gameContextStats.mood = newMood.toString();
              break;
            }
            case 'alcoholism': {
              const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + effect.value);
              dbUpdateStats.alcoholism_percentage = newAlcoholism;
              gameContextStats.alcoholism = newAlcoholism;
              break;
            }
            case 'energy': {
              if (effect.duration && effect.message) {
                await addTemporaryEffect(effect.message, effect.duration, 'other');
              }
              break;
            }
          }
          if (effect.message) {
            effectMessage = effect.message;
          }
        }
      }

      // Persistir
      if (Object.keys(dbUpdateStats).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(dbUpdateStats)
          .eq('id', userRecord.id);
        if (updateError) throw updateError;
      }

      if (Object.keys(gameContextStats).length > 0) {
        await updateStats(gameContextStats);
      }

      // Remover 1 unidade do inventário
      if (item.quantity <= 1) {
        await supabase
          .from('inventory')
          .delete()
          .eq('user_id', userRecord.id)
          .eq('item_id', item.id);
      } else {
        await supabase
          .from('inventory')
          .update({ quantity: item.quantity - 1 })
          .eq('user_id', userRecord.id)
          .eq('item_id', item.id);
      }

      // Efeitos temporários com duração (feedback visual/sensação)
      if (item.originalItem?.effect?.duration && item.originalItem?.effect?.message) {
        const tempType = item.itemType === 'drink' ? 'bar' : item.itemType === 'food' ? 'icecream' : 'other';
        await addTemporaryEffect(item.originalItem.effect.message, item.originalItem.effect.duration, tempType as any);
      }

      // Aumentar felicidade e energia para produtos da sorveteria, bebidas e sexshop
      const shouldIncreaseHappinessEnergy = 
        item.storeId === "sexshop" || 
        item.storeId === "icecream" || 
        item.itemType === "drink";
        
      if (shouldIncreaseHappinessEnergy) {
        let happinessIncrease = 10;
        let energyIncrease = 8;
        let happinessType = "doçura";
        
        if (item.storeId === "sexshop") {
          happinessIncrease = 15;
          energyIncrease = 12;
          happinessType = "prazer";
        } else if (item.itemType === "drink") {
          happinessIncrease = 12;
          energyIncrease = 15;
          happinessType = "refrescância";
        }
        
        const newHappiness = Math.min(100, (gameStats.happiness || 0) + happinessIncrease);
        const newEnergy = Math.min(100, (gameStats.energy || 0) + energyIncrease);
        
        // Atualizar no banco
        await supabase
          .from('users')
          .update({ 
            happiness_percentage: newHappiness,
            energy_percentage: newEnergy
          })
          .eq('id', userRecord.id);
          
        // Atualizar no contexto
        await updateStats({ 
          happiness: newHappiness, 
          energy: newEnergy 
        });
        
        await addTemporaryEffect(
          `Você se sente mais feliz e energizado(a) pela ${happinessType}!`, 
          30, 
          'other'
        );
      }

      // Aumentar fome para todos os itens da sorveteria baseado no preço
      if (item.storeId === "icecream") {
        console.log('🍨 Item da sorveteria detectado:', item.name);
        const hungerIncrease = Math.floor((item.price || item.originalItem?.price || 0) / 2); // Preço dividido por 2 para determinar aumento da fome
        console.log('🍽️ Aumento de fome calculado:', hungerIncrease, 'preço:', item.price || item.originalItem?.price);
        const newHunger = Math.min(100, (gameStats.hunger || 0) + hungerIncrease);
        console.log('🥄 Nova fome:', newHunger, 'fome atual:', gameStats.hunger);
        
        // Atualizar no banco
        const hungerUpdateResult = await supabase
          .from('users')
          .update({ hunger_percentage: newHunger })
          .eq('id', userRecord.id);
        console.log('💾 Resultado update banco fome:', hungerUpdateResult);
        
        // Atualizar no contexto
        const contextUpdate = await updateStats({ hunger: newHunger });
        console.log('🎮 Resultado update contexto fome:', contextUpdate);
        
        const category = item.originalItem?.category;
        let foodType = "guloseima";
        
        if (category === "Smoothies" || category === "Milk-Shakes") {
          foodType = "bebida refrescante";
        } else if (category === "Açaí") {
          foodType = "açaí nutritivo";
        } else if (category === "Crepes") {
          foodType = "crepe delicioso";
        } else if (category === "Sobremesas") {
          foodType = "sobremesa divina";
        } else if (category?.includes("Sorvetes")) {
          foodType = "sorvete cremoso";
        }
        
        console.log('✨ Categoria do item:', category, 'Tipo da comida:', foodType);
        
        await addTemporaryEffect(
          `Que ${foodType} delicioso(a)! Sua fome diminuiu significativamente!`, 
          20, 
          'icecream'
        );
      }

      toast({ title: "Item usado!", description: effectMessage });

      await loadAllData(true);
      return;
    } catch (error) {
      console.error('Error using item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível usar o item",
        variant: "destructive"
      });
    }
  };

  const handleSendItem = (item: InventoryItem) => {
    setSelectedItemToSend(item);
    setSendItemModalOpen(true);
  };

  const handleRomanticProposal = (item: InventoryItem) => {
    if (item.originalItem) {
      setSelectedRing(item.originalItem);
      setSendRingModalOpen(true);
    }
  };

  const handleSendFriendshipItem = (item: InventoryItem) => {
    setSelectedFriendshipItem(item);
    setSendFriendshipItemModalOpen(true);
  };

  // Group inventory by category
  const foodItems = inventory.filter(item => item.itemType === "food");
  const drinkItems = inventory.filter(item => item.itemType === "drink");
  const objectItems = inventory.filter(item => item.itemType === "object");

  const renderItems = (items: InventoryItem[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return items.map(item => (
      <Card key={`${item.id}-${item.storeId}`} className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {/* Show custom item icon/image if available */}
            {item.storeId === "custom" && item.originalItem?.icon ? (
              typeof item.originalItem.icon === 'string' && item.originalItem.icon.startsWith('data:') ? (
                <img src={item.originalItem.icon} alt={item.name} className="w-6 h-6 rounded object-cover" width={24} height={24} loading="lazy" decoding="async" />
              ) : (
                <span className="text-lg">{item.originalItem.icon}</span>
              )
            ) : item.storeId === "icecream" ? (
              <span className="text-lg">{getIceCreamIcon(item)}</span>
            ) : (
              <span className="text-lg">{getCategoryIcon(item.itemType, item.name)}</span>
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
          
          {/* Special ring info */}
          {item.isRing && item.relationshipType && (
            <div className="mb-3 p-2 bg-love/10 rounded border border-love/20">
              <p className="text-xs text-love font-medium">
                💍 Anel de {item.relationshipType === 'dating' ? 'Namoro' : item.relationshipType === 'engagement' ? 'Noivado' : item.relationshipType === 'friendship' ? 'Amizade' : 'Casamento'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.relationshipType === 'friendship' 
                  ? 'Use este anel para criar uma amizade épica especial'
                  : 'Use este anel para fazer uma proposta romântica especial'}
              </p>
            </div>
          )}
          
           {item.effect && !item.isRing && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {item.effect.type === "multiple" && "effects" in item.effect ? (
                  "✨ Múltiplos efeitos"
                ) : (
                  <>
                    {getEffectIcon(item.effect.type as any)}
                    +{(item.effect as any).value} {getEffectName(item.effect.type as any)}
                  </>
                )}
              </Badge>
            </div>
          )}
          
          <div className="flex gap-2">
            {item.canUse && (
              <Button
                size="sm"
                onClick={() => handleUseItem(item)}
                className="flex-1"
              >
                {item.itemType === "drink" ? "Beber" : item.itemType === "food" ? "Comer" : "Usar"}
              </Button>
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
              <span className="text-lg">{getCategoryIcon(item.itemType, item.name)}</span>
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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Bolsa</h1>
        <div className="ml-auto">
          <Badge variant="outline">
            {inventory.length} itens
          </Badge>
        </div>
      </div>

      {/* Categorized Inventory */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="food" className="flex items-center gap-2">
              <Utensils size={16} />
              <span className="hidden sm:inline">Comidas</span>
              <Badge variant="secondary" className="text-xs">
                {foodItems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="drink" className="flex items-center gap-2">
              <Wine size={16} />
              <span className="hidden sm:inline">Bebidas</span>
              <Badge variant="secondary" className="text-xs">
                {drinkItems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="object" className="flex items-center gap-2">
              <Pill size={16} />
              <span className="hidden sm:inline">Objetos</span>
              <Badge variant="secondary" className="text-xs">
                {objectItems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History size={16} />
              <span className="hidden sm:inline">Histórico</span>
              <Badge variant="secondary" className="text-xs">
                {historyItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="space-y-3 h-full overflow-y-auto">
            {renderItems(foodItems, "Nenhuma comida na bolsa")}
          </TabsContent>

          <TabsContent value="drink" className="space-y-3 h-full overflow-y-auto">
            {renderItems(drinkItems, "Nenhuma bebida na bolsa")}
          </TabsContent>

          <TabsContent value="object" className="space-y-3 h-full overflow-y-auto">
            {renderItems(objectItems, "Nenhum objeto na bolsa")}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 h-full overflow-y-auto">
            {renderHistory()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-card border-border/50 mt-4">
        <CardContent className="pt-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Use itens para melhorar suas estatísticas
            </p>
            <p className="text-xs text-muted-foreground">
              📤 Envie itens para amigos para fortalecer relacionamentos
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Send Ring Modal */}
      <SendRingModal
        isOpen={sendRingModalOpen}
        onClose={() => setSendRingModalOpen(false)}
        ring={selectedRing}
      />
      
      
      {/* Send Item Modal */}
      <SendItemModal
        isOpen={sendItemModalOpen}
        onClose={() => setSendItemModalOpen(false)}
        item={selectedItemToSend}
        onItemSent={() => {
          loadAllData(true); // Force refresh após enviar item
        }}
      />
      
      {/* Send Friendship Item Modal */}
      <SendFriendshipItemModal
        isOpen={sendFriendshipItemModalOpen}
        onClose={() => setSendFriendshipItemModalOpen(false)}
        item={selectedFriendshipItem}
      />
    </div>
  );
}