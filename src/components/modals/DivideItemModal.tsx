import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFriendship } from "@/contexts/FriendshipContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Heart, Utensils, Wine } from "lucide-react";
import { getCategoryIcon, getEffectIcon, getEffectName } from "@/lib/itemCategories";

interface InventoryItem {
  id: string;
  inventoryId: string;
  name: string;
  description?: string;
  quantity: number;
  itemType: "food" | "drink" | "object";
  storeId?: string;
  effect?: {
    type: string;
    value: number;
  } | {
    type: "multiple";
    effects: Array<{
      type: string;
      value: number;
    }>;
  };
  originalItem?: any;
}

interface DivideItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onDivide: (friendId: string, friendUsername: string, shareAmount: number, remainingAmount: number) => Promise<void>;
}

export function DivideItemModal({ isOpen, onClose, item, onDivide }: DivideItemModalProps) {
  const { friends } = useFriendship();
  const { toast } = useToast();
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [selectedShareAmount, setSelectedShareAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  if (!item) return null;

  // Calculate possible share amounts based on item effects
  const getShareOptions = () => {
    if (!item.effect) return [];

    let maxValue = 0;
    if (item.effect.type === "multiple" && "effects" in item.effect) {
      // For multiple effects, use the first effect value as reference
      maxValue = item.effect.effects[0]?.value || 0;
    } else {
      maxValue = (item.effect as any).value || 0;
    }

    if (maxValue < 10) return [];

    const options = [];
    // Allow sharing 25%, 50%, or 75% of the effect
    const percentages = [0.25, 0.5, 0.75];
    
    for (const percentage of percentages) {
      const shareAmount = Math.floor(maxValue * percentage);
      const remainingAmount = maxValue - shareAmount;
      if (shareAmount > 0 && remainingAmount > 0) {
        options.push({
          shareAmount,
          remainingAmount,
          percentage: Math.round(percentage * 100)
        });
      }
    }

    return options;
  };

  const shareOptions = getShareOptions();

  const handleDivide = async () => {
    if (!selectedFriend || selectedShareAmount === 0) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione um amigo e a quantidade a dividir",
        variant: "destructive"
      });
      return;
    }

    const friend = friends.find(f => f.id === selectedFriend);
    if (!friend) return;

    setIsLoading(true);
    try {
      const selectedOption = shareOptions.find(opt => opt.shareAmount === selectedShareAmount);
      if (!selectedOption) return;

      await onDivide(selectedFriend, friend.username, selectedOption.shareAmount, selectedOption.remainingAmount);
      onClose();
      setSelectedFriend("");
      setSelectedShareAmount(0);
    } catch (error) {
      console.error("Error dividing item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEffectDisplay = () => {
    if (!item.effect) return null;

    if (item.effect.type === "multiple" && "effects" in item.effect) {
      return (
        <div className="flex flex-wrap gap-1">
          {item.effect.effects.map((effect, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {getEffectIcon(effect.type as any)}
              +{effect.value} {getEffectName(effect.type as any)}
            </Badge>
          ))}
        </div>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          {getEffectIcon(item.effect.type as any)}
          +{(item.effect as any).value} {getEffectName(item.effect.type as any)}
        </Badge>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Dividir {item.itemType === "drink" ? "bebida" : "comida"}
          </DialogTitle>
          <DialogDescription>
            Escolha um amigo para dividir este item e quanto compartilhar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">
                  {getCategoryIcon(item.itemType, item.name, item.storeId)}
                </span>
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  {getEffectDisplay()}
                </div>
              </div>
            </CardContent>
          </Card>

          {shareOptions.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Este item não pode ser dividido (efeito muito baixo)
              </p>
            </div>
          )}

          {shareOptions.length > 0 && (
            <>
              {/* Share Amount Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Quanto você quer compartilhar?
                </Label>
                <RadioGroup
                  value={selectedShareAmount.toString()}
                  onValueChange={(value) => setSelectedShareAmount(parseInt(value))}
                >
                  {shareOptions.map((option) => (
                    <div key={option.shareAmount} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.shareAmount.toString()}
                        id={`share-${option.shareAmount}`}
                      />
                      <Label
                        htmlFor={`share-${option.shareAmount}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <span>Dividir +{option.shareAmount} ({option.percentage}%)</span>
                          <span className="text-xs text-muted-foreground">
                            Você fica com +{option.remainingAmount}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Friends Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Escolher amigo
                </Label>
                {friends.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Você precisa ter amigos para dividir itens
                    </p>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedFriend}
                    onValueChange={setSelectedFriend}
                  >
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                          <RadioGroupItem
                            value={friend.id}
                            id={`friend-${friend.id}`}
                          />
                          <Label
                            htmlFor={`friend-${friend.id}`}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={friend.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {friend.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {friend.username.replace(/\d{4}$/, '')}
                            </span>
                            {friend.isOnline && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            {shareOptions.length > 0 && friends.length > 0 && (
              <Button
                onClick={handleDivide}
                disabled={!selectedFriend || selectedShareAmount === 0 || isLoading}
                className="flex-1"
              >
                {isLoading ? "Dividindo..." : "Dividir"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}