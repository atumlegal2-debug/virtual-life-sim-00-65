import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Send, Utensils, Wine, Pill, Heart } from "lucide-react";
import { useState, useEffect } from "react";
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

export function BagApp({ onBack }: BagAppProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"food" | "drink" | "object">("food");
  const [sendRingModalOpen, setSendRingModalOpen] = useState(false);
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
  const [sendItemModalOpen, setSendItemModalOpen] = useState(false);
  const [selectedRing, setSelectedRing] = useState<StoreItem | null>(null);
  const [selectedItemToSend, setSelectedItemToSend] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const { currentUser, updateStats, gameStats, cureDisease, diseases } = useGame();

  useEffect(() => {
    if (currentUser) {
      fetchInventory();
    }
  }, [currentUser]);

  const fetchInventory = async () => {
    try {
      if (!currentUser) return;

      // Get the user record from users table by username
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (userError || !userRecord) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userRecord.id);

      if (error) throw error;

      const formattedInventory: InventoryItem[] = [];
      
      // Load custom items from localStorage
      const customItems = JSON.parse(localStorage.getItem('customItems') || '{}');
      
      // Process each inventory item
      for (const item of data || []) {
        // Check if it's a custom item first
        if (customItems[item.item_id]) {
          const customItem = customItems[item.item_id];
          
          // Define effect based on item type - Custom items have fixed small effects
          let effect = null;
          if (customItem.itemType === "food") {
            effect = { type: "hunger", value: 3, message: `Você comeu ${customItem.name} e se sente um pouco satisfeito!` };
          } else if (customItem.itemType === "drink") {
            effect = { type: "hunger", value: 3, message: `Você bebeu ${customItem.name} e se sente um pouco saciado!` };
          } else if (customItem.itemType === "object") {
            effect = { type: "mood", value: 5, message: `Você usou ${customItem.name} e se sente ligeiramente melhor!` };
          }
          
          formattedInventory.push({
            id: customItem.id,
            name: customItem.name,
            description: (customItem.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2'),
            itemType: customItem.itemType,
            quantity: item.quantity,
            storeId: "custom",
            canUse: true, // Custom items can be used
            canSend: true,
            isRing: false,
            originalItem: customItem,
            effect
          });
          continue;
        }
        
        // Find the item in stores
        let storeItem = null;
        let storeId = "";
        
        for (const [key, store] of Object.entries(STORES)) {
          const foundItem = store.items.find(i => i.id === item.item_id);
          if (foundItem) {
            storeItem = foundItem;
            storeId = key;
            break;
          }
        }
        
        if (storeItem) {
          const itemType = getItemType(storeId, storeItem.id);
          const canUse = !!storeItem.effect || (storeItem as any).type === "medicine";
          const isRing = storeId === "jewelry" && !!(storeItem as any).relationshipType;
          
          formattedInventory.push({
            id: storeItem.id,
            name: storeItem.name,
            description: storeItem.description,
            itemType,
            quantity: item.quantity,
            storeId,
            price: storeItem.price, // Add price for hunger calculation
            canUse: canUse && !isRing, // Rings can't be "used" like other items
            canSend: !isRing, // Regular send for non-rings
            isRing,
            relationshipType: (storeItem as any).relationshipType,
            originalItem: storeItem,
            effect: storeItem.effect ? {
              type: storeItem.effect.type,
              value: storeItem.effect.value,
              message: storeItem.effect.message || `Efeito de ${storeItem.name}`
            } : undefined
          });
        }
      }

      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleUseItem = async (item: InventoryItem) => {
    try {
        if (!currentUser) return;

      // Handle custom items
      if (item.storeId === "custom") {
        // Get the user record from users table by username
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('id, hunger_percentage, life_percentage, mood, alcoholism_percentage')
          .eq('username', currentUser)
          .maybeSingle();

        if (userError || !userRecord) return;

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

        fetchInventory(); // Refresh inventory
        return;
      }

      // Get the user record from users table by username
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, hunger_percentage, life_percentage, mood, alcoholism_percentage')
        .eq('username', currentUser)
        .maybeSingle();

      if (userError || !userRecord) return;

      // Check if this is a medicine for a disease
      const diseaseToCure = diseases.find(disease => 
        // Check if this item can cure this disease by matching the 'cures' property
        STORES.pharmacy.items.some(medicine => 
          medicine.name === item.name && (medicine as any).cures === disease.name
        )
      );

      if (diseaseToCure) {
        // This is a medicine - cure the disease
        cureDisease(diseaseToCure.name);
        
        // Update health and decrease disease percentage
        const newHealth = Math.min(100, userRecord.life_percentage + 15);
        const currentDiseasePercent = gameStats.disease || 0;
        const newDiseasePercent = Math.max(0, currentDiseasePercent - 15);
        
        await supabase
          .from('users')
          .update({ 
            life_percentage: newHealth,
            disease_percentage: newDiseasePercent
          })
          .eq('username', currentUser);
        
        await updateStats({ 
          health: newHealth,
          disease: newDiseasePercent
        });
        
        toast({
          title: "Doença curada! ✅",
          description: `Você usou ${item.name} e curou ${diseaseToCure.name}. Saúde restaurada!`
        });
      } else {
        // Regular item effects
        let dbUpdateStats: any = {};
        let gameContextStats: any = {};
        let effectMessage = item.effect?.message || `Você ${item.itemType === "drink" ? "bebeu" : item.itemType === "food" ? "comeu" : "usou"} ${item.name}`;

        if (item.effect) {
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
              // For alcoholic drinks, increase alcoholism level
              const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + item.effect.value);
              const newMoodFromAlcohol = Math.max(0, userRecord.mood - 5);
              dbUpdateStats.alcoholism_percentage = newAlcoholism;
              dbUpdateStats.mood = newMoodFromAlcohol;
              gameContextStats.alcoholism = newAlcoholism;
              gameContextStats.mood = newMoodFromAlcohol.toString();
              
              // Add temporary effect that shows in "Como estou me sentindo" for 20 minutes
              const effectData = {
                id: Math.random().toString(36),
                message: item.effect.message,
                expiresAt: Date.now() + 20 * 60000, // 20 minutes
                type: "alcoholism",
                value: item.effect.value
              };
              
              const existingEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
              existingEffects.push(effectData);
              localStorage.setItem('temporaryEffects', JSON.stringify(existingEffects));
              break;
          }

          // Update user stats in database
          if (Object.keys(dbUpdateStats).length > 0) {
            const { error: updateError } = await supabase
              .from('users')
              .update(dbUpdateStats)
              .eq('username', currentUser);
            if (updateError) throw updateError;
          }

          // Update GameContext stats
          if (Object.keys(gameContextStats).length > 0) {
            await updateStats(gameContextStats);
          }
        }

        // For drinks, check if alcoholic and apply alcohol effects
        if (item.itemType === "drink" && isAlcoholic(item.storeId, item.id)) {
          const alcoholLevel = getAlcoholLevel(item.storeId, item.id);
          const newAlcoholism = Math.min(100, (userRecord.alcoholism_percentage || 0) + alcoholLevel);
          const newMoodFromAlcohol = Math.max(0, userRecord.mood - Math.floor(alcoholLevel / 4));
          
          const alcoholEffectUpdate = {
            alcoholism_percentage: newAlcoholism,
            mood: newMoodFromAlcohol
          };
          
          const { error: alcoholError } = await supabase
            .from('users')
            .update(alcoholEffectUpdate)
            .eq('username', currentUser);
          if (alcoholError) throw alcoholError;
          
          // Update GameContext
          await updateStats({ 
            alcoholism: newAlcoholism, 
            mood: newMoodFromAlcohol.toString() 
          });
          
          // Add temporary effect for alcoholic drinks
          const alcoholEffectData = {
            id: Math.random().toString(36),
            message: `Sentindo os efeitos do álcool...`,
            expiresAt: Date.now() + 30 * 60000, // 30 minutes for alcohol
            type: "alcoholism",
            value: alcoholLevel
          };
          
          const existingEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
          existingEffects.push(alcoholEffectData);
          localStorage.setItem('temporaryEffects', JSON.stringify(existingEffects));
        }

        // For food items, calculate hunger increase based on item source and price
        if (item.itemType === "food") {
          let hungerIncrease = 3; // Default for custom items
          
          // If item has a price (from store), calculate based on price
          if (item.price) {
            if (item.price <= 50) {
              hungerIncrease = 20; // Cheaper items
            } else if (item.price <= 150) {
              hungerIncrease = 40; // Mid-range items
            } else if (item.price <= 250) {
              hungerIncrease = 60; // Expensive items
            } else {
              hungerIncrease = 100; // Most expensive items
            }
          }
          
          const newHunger = Math.min(100, userRecord.hunger_percentage + hungerIncrease);
          
          const { error: hungerError } = await supabase
            .from('users')
            .update({ hunger_percentage: newHunger })
            .eq('username', currentUser);
          if (hungerError) throw hungerError;

          // Update GameContext hunger
          await updateStats({ hunger: newHunger });

          // Add temporary effect for food with special effects
          if (item.effect && (item.effect as any).duration) {
            const effectData = {
              id: Math.random().toString(36),
              message: item.effect.message || `Efeito de ${item.name}`,
              expiresAt: Date.now() + 20 * 60000, // 20 minutes for all effects
              type: item.effect.type,
              value: item.effect.value
            };
            
            const existingEffects = JSON.parse(localStorage.getItem('temporaryEffects') || '[]');
            existingEffects.push(effectData);
            localStorage.setItem('temporaryEffects', JSON.stringify(existingEffects));
          }
        }

        // For drinks that increase hunger, calculate based on price
        if (item.itemType === "drink" && item.effect?.type === "hunger") {
          let hungerIncrease = 3; // Default for custom items
          
          // If item has a price (from store), calculate based on price
          if (item.price) {
            if (item.price <= 50) {
              hungerIncrease = 20; // Cheaper items
            } else if (item.price <= 150) {
              hungerIncrease = 40; // Mid-range items
            } else if (item.price <= 250) {
              hungerIncrease = 60; // Expensive items
            } else {
              hungerIncrease = 100; // Most expensive items
            }
          }
          
          const newHunger = Math.min(100, userRecord.hunger_percentage + hungerIncrease);
          
          const { error: hungerError } = await supabase
            .from('users')
            .update({ hunger_percentage: newHunger })
            .eq('username', currentUser);
          if (hungerError) throw hungerError;

          // Update GameContext hunger
          await updateStats({ hunger: newHunger });
        }

        const actionText = item.itemType === "drink" ? "bebeu" : item.itemType === "food" ? "comeu" : "usou";
        
        toast({
          title: `Item ${actionText}!`,
          description: effectMessage
        });
      }

      // Remove one item from inventory by decreasing quantity
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

      fetchInventory(); // Refresh inventory
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
          <TabsList className="grid w-full grid-cols-3 mb-4">
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
        onItemSent={fetchInventory}
      />
    </div>
  );
}