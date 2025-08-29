import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Send, Utensils, Wine, Pill, Heart, History, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORES } from "@/data/stores";
import { useGame } from "@/contexts/GameContext";
import { getItemType, getCategoryIcon, getCategoryName, getEffectIcon, getEffectName, isAlcoholic, getAlcoholLevel } from "@/lib/itemCategories";
import { SendRingModal } from "@/components/modals/SendRingModal";
import { CreateItemModal } from "@/components/modals/CreateItemModal";
import { SendItemModal } from "@/components/modals/SendItemModal";
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

export function BagApp({ onBack }: BagAppProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"food" | "drink" | "object" | "history">("food");
  const [sendRingModalOpen, setSendRingModalOpen] = useState(false);
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
  const [sendItemModalOpen, setSendItemModalOpen] = useState(false);
  const [selectedRing, setSelectedRing] = useState<StoreItem | null>(null);
  const [selectedItemToSend, setSelectedItemToSend] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser, updateStats, gameStats, cureDisease, diseases } = useGame();

  // Cache do user_id para evitar consultas repetidas
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  // Create item lookup map for better performance (memoized)
  const itemLookupMap = useMemo(() => {
    const lookupMap = new Map();
    for (const [storeId, store] of Object.entries(STORES)) {
      for (const item of store.items) {
        lookupMap.set(item.id, { item, storeId });
      }
    }
    return lookupMap;
  }, []);

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

  // Instant data loading with ultra-optimized queries
  const loadAllData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      
      // Get user ID only once and cache it
      let userId = cachedUserId;
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
        setCachedUserId(userId);
      }

      // Load custom items from localStorage (instant)
      const customItems = JSON.parse(localStorage.getItem('customItems') || '{}');

      // Single optimized query for all inventory data
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select('item_id, quantity, sent_by_username, received_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load custom items from DB only once
      const { data: customItemsFromDB } = await supabase
        .from('custom_items')
        .select('id, name, description, item_type, icon');

      // Merge all custom items
      const allCustomItems = { ...customItems };
      if (customItemsFromDB) {
        customItemsFromDB.forEach(item => {
          allCustomItems[item.id] = {
            id: item.id,
            name: item.name,
            description: item.description,
            itemType: item.item_type,
            icon: item.icon,
            isCustom: true,
            effect: null
          };
        });
      }

      // Process all data in one pass
      const formattedInventory: InventoryItem[] = [];
      const formattedHistory: HistoryItem[] = [];
      
      for (const item of inventoryData || []) {
        const processedItem = processInventoryItem(item, allCustomItems);
        
        if (processedItem) {
          formattedInventory.push(processedItem.inventoryItem);
          
          if (item.sent_by_username) {
            formattedHistory.push(processedItem.historyItem);
          }
        }
      }

      // Update all states at once
      setInventory(formattedInventory);
      setHistoryItems(formattedHistory);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  // Optimized item processing
  const processInventoryItem = (item: any, allCustomItems: any) => {
    // Custom item processing
    if (allCustomItems[item.item_id]) {
      const customItem = allCustomItems[item.item_id];
      
      // Pre-computed effects for custom items
      const effectMap = {
        food: { type: "hunger", value: 3, message: `Você comeu ${customItem.name} e se sente um pouco satisfeito!` },
        drink: { type: "hunger", value: 3, message: `Você bebeu ${customItem.name} e se sente um pouco saciado!` },
        object: { type: "mood", value: 5, message: `Você usou ${customItem.name} e se sente ligeiramente melhor!` }
      };

      const effect = effectMap[customItem.itemType as keyof typeof effectMap] || null;
      const cleanDescription = (customItem.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2');
      
      const inventoryItem = {
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
      };

      const historyItem = {
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
      };

      return { inventoryItem, historyItem };
    }
    
    // Store item processing with cached lookup
    const itemData = itemLookupMap.get(item.item_id);
    if (itemData) {
      const { item: storeItem, storeId } = itemData;
      const itemType = getItemType(storeId, storeItem.id);
      const canUse = !!storeItem.effect || (storeItem as any).type === "medicine" || storeId === "sexshop";
      const isRing = storeId === "jewelry" && !!(storeItem as any).relationshipType;
      
      const effect = storeItem.effect ? {
        type: storeItem.effect.type,
        value: storeItem.effect.value,
        message: storeItem.effect.message || `Efeito de ${storeItem.name}`
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
        canSend: !isRing,
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
  };

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);


  const handleUseItem = async (item: InventoryItem) => {
    try {
      if (!currentUser) return;

      // Get the user record from users table by username
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, hunger_percentage, life_percentage, mood, alcoholism_percentage')
        .eq('username', currentUser)
        .maybeSingle();

      if (userError || !userRecord) return;

      // Handle custom items
      if (item.storeId === "custom") {
        let dbUpdateStats: any = {};
        let gameContextStats: any = {};
        let effectMessage = `Você usou ${item.name}`;

        if (item.effect) {
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

        loadAllData();
        return;
      }

      // Check if this is a medicine for a disease
      const diseaseToCure = diseases.find(disease => 
        STORES.pharmacy.items.some(medicine => 
          medicine.name === item.name && (medicine as any).cures === disease.name
        )
      );

      let dbUpdateStats: any = {};
      let gameContextStats: any = {};
      let effectMessage = item.effect?.message || `Você ${item.itemType === "drink" ? "bebeu" : item.itemType === "food" ? "comeu" : "usou"} ${item.name}`;

      // Special handling for sexshop items - they always increase health
      if (item.storeId === "sexshop") {
        const healthIncrease = Math.floor(Math.random() * 16) + 15; // Random between 15-30
        const newHealth = Math.min(100, userRecord.life_percentage + healthIncrease);
        dbUpdateStats.life_percentage = newHealth;
        gameContextStats.health = newHealth;
        effectMessage = `Você se sente rejuvenescido e com mais energia! (+${healthIncrease} vida)`;
      }

      if (diseaseToCure) {
        // This is a medicine - cure the disease
        cureDisease(diseaseToCure.name);
        
        const newHealth = Math.min(100, userRecord.life_percentage + 15);
        const currentDiseasePercent = gameStats.disease || 0;
        const newDiseasePercent = Math.max(0, currentDiseasePercent - 15);
        
        dbUpdateStats.life_percentage = newHealth;
        dbUpdateStats.disease_percentage = newDiseasePercent;
        gameContextStats.health = newHealth;
        gameContextStats.disease = newDiseasePercent;
        
        effectMessage = `Você usou ${item.name} e curou ${diseaseToCure.name}. Saúde restaurada!`;
      } else if (item.effect) {
        // Handle regular item effects
        switch (item.effect.type) {
          case "health":
            const newHealth = Math.min(100, userRecord.life_percentage + item.effect.value);
            dbUpdateStats.life_percentage = newHealth;
            gameContextStats.health = newHealth;
            break;
          case "hunger":
            const newHunger = Math.min(100, userRecord.hunger_percentage + item.effect.value);
            dbUpdateStats.hunger_percentage = newHunger;
            gameContextStats.hunger = newHunger;
            break;
          case "mood":
            const newMood = Math.min(100, userRecord.mood + item.effect.value);
            dbUpdateStats.mood = newMood;
            gameContextStats.mood = newMood.toString();
            break;
          case "alcoholism":
            const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + item.effect.value);
            const newMoodFromAlcohol = Math.max(0, userRecord.mood - 5);
            dbUpdateStats.alcoholism_percentage = newAlcoholism;
            dbUpdateStats.mood = newMoodFromAlcohol;
            gameContextStats.alcoholism = newAlcoholism;
            gameContextStats.mood = newMoodFromAlcohol.toString();
            
            const effectData = {
              id: Math.random().toString(36),
              message: item.effect.message,
              expiresAt: Date.now() + 20 * 60000,
              type: "alcoholism",
              value: item.effect.value
            };
            
            const existingEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
            existingEffects.push(effectData);
            localStorage.setItem('temporaryEffects', JSON.stringify(existingEffects));
            break;
        }
      }

      // Handle food and drink specific effects
      if (item.itemType === "food") {
        let hungerIncrease = 3;
        if (item.price) {
          if (item.price <= 50) hungerIncrease = 20;
          else if (item.price <= 150) hungerIncrease = 40;
          else if (item.price <= 250) hungerIncrease = 60;
          else hungerIncrease = 100;
        }
        const newHunger = Math.min(100, userRecord.hunger_percentage + hungerIncrease);
        dbUpdateStats.hunger_percentage = newHunger;
        gameContextStats.hunger = newHunger;
      }

      if (item.itemType === "drink" && isAlcoholic(item.storeId, item.id)) {
        const alcoholLevel = getAlcoholLevel(item.storeId, item.id);
        const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + alcoholLevel);
        const newMoodFromAlcohol = Math.max(0, userRecord.mood - Math.floor(alcoholLevel / 4));
        
        dbUpdateStats.alcoholism_percentage = newAlcoholism;
        dbUpdateStats.mood = newMoodFromAlcohol;
        gameContextStats.alcoholism = newAlcoholism;
        gameContextStats.mood = newMoodFromAlcohol.toString();
        
        const alcoholEffectData = {
          id: Math.random().toString(36),
          message: `Sentindo os efeitos do álcool...`,
          expiresAt: Date.now() + 30 * 60000,
          type: "alcoholism",
          value: alcoholLevel
        };
        
        const existingEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
        existingEffects.push(alcoholEffectData);
        localStorage.setItem('temporaryEffects', JSON.stringify(existingEffects));
      }

      // Update database
      if (Object.keys(dbUpdateStats).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(dbUpdateStats)
          .eq('username', currentUser);
        if (updateError) throw updateError;
      }

      // Update GameContext
      if (Object.keys(gameContextStats).length > 0) {
        await updateStats(gameContextStats);
      }

      const actionText = item.itemType === "drink" ? "bebeu" : item.itemType === "food" ? "comeu" : "usou";
      toast({
        title: `Item ${actionText}!`,
        description: diseaseToCure ? `Doença curada! ✅ ${effectMessage}` : effectMessage
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

        loadAllData();
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
                <img src={item.originalItem.icon} alt={item.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="text-lg">{item.originalItem.icon}</span>
              )
            ) : (
              <span className="text-lg">{getCategoryIcon(item.itemType)}</span>
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
                💍 Anel de {item.relationshipType === 'dating' ? 'Namoro' : item.relationshipType === 'engagement' ? 'Noivado' : 'Casamento'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use este anel para fazer uma proposta romântica especial
              </p>
            </div>
          )}
          
          {item.effect && !item.isRing && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {getEffectIcon(item.effect.type as any)}
                +{item.effect.value} {getEffectName(item.effect.type as any)}
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
                onClick={() => handleRomanticProposal(item)}
                className="flex-1 bg-love hover:bg-love/90 text-white"
              >
                <Heart size={14} className="mr-1" />
                Fazer pedido romântico
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
                <img src={item.originalItem.icon} alt={item.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="text-lg">{item.originalItem.icon}</span>
              )
            ) : (
              <span className="text-lg">{getCategoryIcon(item.itemType)}</span>
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
        <div className="ml-auto flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setCreateItemModalOpen(true)}
          >
            Minha criação
          </Button>
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
      
      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={createItemModalOpen}
        onClose={() => setCreateItemModalOpen(false)}
      />
      
      {/* Send Item Modal */}
      <SendItemModal
        isOpen={sendItemModalOpen}
        onClose={() => setSendItemModalOpen(false)}
        item={selectedItemToSend}
        onItemSent={() => {
          loadAllData();
        }}
      />
    </div>
  );
}