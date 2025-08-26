import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/contexts/GameContext";
import { supabase } from "@/integrations/supabase/client";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = {
  food: { name: "Comida", price: 30, icon: "🍽️" },
  drink: { name: "Bebida", price: 8, icon: "🍺" },
  object: { name: "Objeto", price: 300, icon: "📦" }
};

const ITEMS = {
  food: ["Cupcake", "Bolo", "Churrasco", "Churros", "Rosquinha", "Pão", "Torrada"],
  drink: ["Suco de Laranja", "Refrigerante", "Café", "Chá", "Milkshake", "Smoothie", "Água Mineral", "Cerveja", "Coquetel", "Chocolate Quente"],
  object: ["Anel", "Colar", "Mochila", "Livro", "Varinha Mágica", "Espada", "Amuleto", "Relógio", "Chave Antiga", "Cajado", "Caderno", "Urso de Pelúcia", "Violão", "Tambor", "Poção Mágica", "Cristal"]
};

const PRESET_ICONS = {
  food: ["🧁", "🎂", "🥩", "🍩", "🍞", "🍰", "🥪"],
  drink: ["🧃", "🥤", "☕", "🍵", "🥛", "🥤", "💧", "🍺", "🍸", "☕"],
  object: ["💍", "📿", "🎒", "📚", "🪄", "⚔️", "🧿", "⌚", "🗝️", "🏒", "📖", "🧸", "🎸", "🥁", "🧪", "💎"]
};

export function CreateItemModal({ isOpen, onClose }: CreateItemModalProps) {
  const [currentStep, setCurrentStep] = useState<"category" | "item" | "upload">("category");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof CATEGORIES | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isCustomItem, setIsCustomItem] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState<string>("");
  const { toast } = useToast();
  const { currentUser, money, deductCoins } = useGame();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  const handleCategorySelect = (category: keyof typeof CATEGORIES) => {
    const categoryPrice = CATEGORIES[category].price;
    
    if (money < categoryPrice) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${categoryPrice} CM para criar um item desta categoria.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedCategory(category);
    setCurrentStep("item");
  };

  const handleItemSelect = (item: string) => {
    setSelectedItem(item);
    setCustomName(item);
    setIsCustomItem(false);
    setCurrentStep("upload");
    
    // Set default icon based on item
    const categoryItems = ITEMS[selectedCategory!];
    const itemIndex = categoryItems.indexOf(item);
    if (itemIndex !== -1) {
      setSelectedIcon(PRESET_ICONS[selectedCategory!][itemIndex]);
    }
  };

  const handleCustomItemSelect = () => {
    setSelectedItem("custom");
    setCustomName("");
    setIsCustomItem(true);
    setSelectedIcon("");
    setCurrentStep("upload");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalize = async () => {
    if (!selectedCategory || !customName) return;

    try {
      // Get user data
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (userError || !userRecord) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Deduct money
      const categoryPrice = CATEGORIES[selectedCategory].price;
      await deductCoins(categoryPrice);

      // Create custom item ID
      const customItemId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          user_id: userRecord.id,
          item_id: customItemId,
          quantity: 1
        });

      if (inventoryError) throw inventoryError;

      // Store custom item data in both Supabase and localStorage
      const customItemData = {
        id: customItemId,
        name: customName,
        description: isCustomItem && customDescription ? customDescription : `Item criado por ${getDisplayName(currentUser)}`,
        item_type: selectedCategory,
        icon: uploadedImage || selectedIcon,
        created_by_user_id: userRecord.id
      };

      // Store in Supabase custom_items table
      const { error: customItemError } = await supabase
        .from('custom_items')
        .insert(customItemData);

      if (customItemError) {
        console.error('Error storing custom item in DB:', customItemError);
        // Continue anyway - we still have it in localStorage
      }

      // Store custom item data in localStorage for backward compatibility
      const customItems = JSON.parse(localStorage.getItem('customItems') || '{}');
      customItems[customItemId] = {
        id: customItemId,
        name: customName,
        description: isCustomItem && customDescription ? customDescription : `Item criado por ${getDisplayName(currentUser)}`,
        itemType: selectedCategory,
        icon: uploadedImage || selectedIcon,
        isCustom: true,
        effect: null
      };
      localStorage.setItem('customItems', JSON.stringify(customItems));

      toast({
        title: "Item criado!",
        description: `${customName} foi adicionado à sua bolsa.`
      });

      // Reset and close
      setCurrentStep("category");
      setSelectedCategory(null);
      setSelectedItem("");
      setCustomName("");
      setSelectedIcon("");
      setUploadedImage("");
      setIsCustomItem(false);
      setCustomDescription("");
      onClose();

    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o item",
        variant: "destructive"
      });
    }
  };

  const resetModal = () => {
    setCurrentStep("category");
    setSelectedCategory(null);
    setSelectedItem("");
    setCustomName("");
    setSelectedIcon("");
    setUploadedImage("");
    setIsCustomItem(false);
    setCustomDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentStep !== "category" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (currentStep === "item") {
                    setCurrentStep("category");
                  } else if (currentStep === "upload") {
                    setCurrentStep("item");
                  }
                }}
              >
                <ArrowLeft size={16} />
              </Button>
            )}
            <DialogTitle>
              {currentStep === "category" && "Minha criação"}
              {currentStep === "item" && `Escolher ${CATEGORIES[selectedCategory!]?.name}`}
              {currentStep === "upload" && "Personalizar Item"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {currentStep === "category" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Escolha uma categoria para criar seu item personalizado
            </p>
            
            <div className="space-y-3">
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <Card 
                  key={key}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleCategorySelect(key as keyof typeof CATEGORIES)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Criar item personalizado
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={money < category.price ? "opacity-50" : ""}>
                        {category.price} CM
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              💰 Seu saldo: <strong>{money} CM</strong>
            </div>
          </div>
        )}

        {currentStep === "item" && selectedCategory && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Escolha o tipo de {CATEGORIES[selectedCategory].name.toLowerCase()}
            </p>
            
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {ITEMS[selectedCategory].map((item, index) => (
                <Button
                  key={item}
                  variant="outline"
                  onClick={() => handleItemSelect(item)}
                  className="justify-start"
                >
                  <span className="text-lg mr-2">{PRESET_ICONS[selectedCategory][index]}</span>
                  {item}
                </Button>
              ))}
              
              {/* Custom creation option */}
              <Button
                variant="outline"
                onClick={() => handleCustomItemSelect()}
                className="justify-start border-dashed border-2 border-accent hover:border-primary/50"
              >
                <span className="text-lg mr-2">✨</span>
                Criar minha própria {CATEGORIES[selectedCategory].name.toLowerCase()}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "upload" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemName">Nome do Item</Label>
              <Input
                id="itemName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={isCustomItem ? "Digite o nome da sua criação personalizada" : "Digite o nome do seu item"}
              />
            </div>

            {isCustomItem && (
              <div>
                <Label htmlFor="itemDescription">Descrição do Item</Label>
                <Input
                  id="itemDescription"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Descreva o que você quer criar (ex: 'Uma pizza de pepperoni deliciosa')"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ✨ Seja criativo! Descreva exatamente o que você imagina
                </p>
              </div>
            )}

            <div>
              <Label>Escolher Ícone</Label>
              <div className="mt-2 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Ícones pré-definidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_ICONS[selectedCategory!].map((icon, index) => (
                      <Button
                        key={index}
                        variant={selectedIcon === icon && !uploadedImage ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedIcon(icon);
                          setUploadedImage("");
                        }}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Ou fazer upload:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <Label
                      htmlFor="imageUpload"
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                    >
                      <Upload size={16} />
                      Upload da Galeria
                    </Label>
                    {uploadedImage && (
                      <div className="w-10 h-10 rounded overflow-hidden border">
                        <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={resetModal} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleFinalize} 
                disabled={!customName || (!selectedIcon && !uploadedImage)}
                className="flex-1"
              >
                Finalizar ({CATEGORIES[selectedCategory!].price} CM)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}