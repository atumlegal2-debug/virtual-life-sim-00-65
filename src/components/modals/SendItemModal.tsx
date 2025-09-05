import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Search, ArrowLeft, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "@/contexts/GameContext";

interface SendItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // The item to send
  onItemSent: () => void; // Callback to refresh inventory
}

interface User {
  id: string;
  username: string;
  avatar?: string;
}

export function SendItemModal({ isOpen, onClose, item, onItemSent }: SendItemModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"quantity" | "users">("quantity");
  const [quantityToSend, setQuantityToSend] = useState(1);
  const { toast } = useToast();
  const { currentUser } = useGame();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentView("quantity");
      setQuantityToSend(1);
      setSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentView === "users") {
      fetchUsers();
    }
  }, [currentView]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        getDisplayName(user.username).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar')
        .neq('username', currentUser) // Exclude current user
        .order('username');

      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendItem = async (toUser: User) => {
    if (!item || !currentUser || quantityToSend <= 0) return;

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

      // Check if user has enough quantity
      if (item.quantity < quantityToSend) {
        toast({
          title: "Erro",
          description: `Você só tem ${item.quantity} ${item.name}(s)`,
          variant: "destructive"
        });
        return;
      }

      // Update sender's inventory (decrease quantity or remove if 0)
      if (item.quantity === quantityToSend) {
        // Remove item completely
        await supabase
          .from('inventory')
          .delete()
          .eq('user_id', currentUserData.id)
          .eq('item_id', item.id);
      } else {
        // Decrease quantity
        await supabase
          .from('inventory')
          .update({ quantity: item.quantity - quantityToSend })
          .eq('user_id', currentUserData.id)
          .eq('item_id', item.id);
      }

      // Check if recipient already has this item
      const { data: existingItem } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('user_id', toUser.id)
        .eq('item_id', item.id)
        .single();

      if (existingItem) {
        // Update existing item quantity and preserve sender info
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: existingItem.quantity + quantityToSend,
            sent_by_username: currentUser,
            sent_by_user_id: currentUserData.id,
            received_at: new Date().toISOString()
          })
          .eq('user_id', toUser.id)
          .eq('item_id', item.id);

        if (updateError?.message?.includes('Limite de 10 itens')) {
          throw new Error(`${toUser.username} já atingiu o limite de 10 itens deste tipo`);
        }
        if (updateError) throw updateError;
      } else {
        // Add new item to recipient's inventory with sender info
        const { error: addError } = await supabase
          .from('inventory')
          .insert({
            user_id: toUser.id,
            item_id: item.id,
            quantity: quantityToSend,
            sent_by_username: currentUser,
            sent_by_user_id: currentUserData.id,
            received_at: new Date().toISOString()
          });

        if (addError) {
          console.error('Error adding item to recipient inventory:', addError);
          if (addError.message?.includes('Limite de 10 itens')) {
            throw new Error(`${toUser.username} já atingiu o limite de 10 itens deste tipo`);
          }
          // If adding to recipient fails, restore item to sender
          if (item.quantity === quantityToSend) {
            await supabase
              .from('inventory')
              .insert({
                user_id: currentUserData.id,
                item_id: item.id,
                quantity: quantityToSend
              });
          } else {
            await supabase
              .from('inventory')
              .update({ quantity: item.quantity })
              .eq('user_id', currentUserData.id)
              .eq('item_id', item.id);
          }
          throw addError;
        }

        // If it's a custom item, store it in Supabase custom_items table too
        if (item.storeId === "custom" && item.originalItem) {
          const { error: customItemError } = await supabase
            .from('custom_items')
            .upsert({
              id: item.id,
              name: item.originalItem.name,
              description: item.originalItem.description,
              item_type: item.originalItem.itemType,
              icon: item.originalItem.icon,
              created_by_user_id: currentUserData.id
            }, { onConflict: 'id' });

          if (customItemError) {
            console.error('Error storing custom item:', customItemError);
          }
        }
      }

      const quantityText = quantityToSend === 1 ? "" : ` (${quantityToSend}x)`;
      toast({
        title: "Item enviado! 📦",
        description: `${item.name}${quantityText} foi enviado para ${getDisplayName(toUser.username)}`
      });

      onItemSent(); // Refresh inventory
      onClose();
    } catch (error) {
      console.error('Error sending item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o item",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setCurrentView("quantity");
    setQuantityToSend(1);
    onClose();
  };

  const handleContinueToUsers = () => {
    if (quantityToSend > 0 && quantityToSend <= (item?.quantity || 1)) {
      setCurrentView("users");
    }
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = quantityToSend + delta;
    if (newQuantity >= 1 && newQuantity <= (item?.quantity || 1)) {
      setQuantityToSend(newQuantity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={currentView === "users" ? () => setCurrentView("quantity") : handleClose}
            >
              <ArrowLeft size={16} />
            </Button>
            <DialogTitle>
              {currentView === "quantity" ? "Quantidade a Enviar" : "Enviar Item"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {item && (
          <div className="mb-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Show custom item icon/image if available */}
                  {item.storeId === "custom" && item.originalItem?.icon ? (
                    typeof item.originalItem.icon === 'string' && item.originalItem.icon.startsWith('data:') ? (
                      <img src={item.originalItem.icon} alt={item.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="text-2xl">{item.originalItem.icon}</span>
                    )
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(item.description || "").replace(/(criado por\s+)(\S*?)(\d{4})(\b)/i, '$1$2')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disponível: {item.quantity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "quantity" ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione a quantidade que deseja enviar:
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantityToSend <= 1}
                >
                  <Minus size={16} />
                </Button>
                
                <div className="text-2xl font-bold min-w-[3rem] text-center">
                  {quantityToSend}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity(1)}
                  disabled={quantityToSend >= (item?.quantity || 1)}
                >
                  <Plus size={16} />
                </Button>
              </div>
              
              <Button
                onClick={handleContinueToUsers}
                className="w-full"
                disabled={quantityToSend <= 0 || quantityToSend > (item?.quantity || 1)}
              >
                Continuar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <p className="text-sm">
                Enviando: <span className="font-medium">{quantityToSend}x {item?.name}</span>
              </p>
            </div>
            
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Procurar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Carregando usuários...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleSendItem(user)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {getDisplayName(user.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{getDisplayName(user.username)}</h3>
                          </div>
                        </div>
                        <Button size="sm">
                          <Send size={14} className="mr-1" />
                          Enviar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}