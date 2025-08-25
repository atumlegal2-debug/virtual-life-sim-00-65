import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Search, ArrowLeft } from "lucide-react";
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
  const { toast } = useToast();
  const { currentUser } = useGame();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

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
    if (!item || !currentUser) return;

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

      // Remove item from sender's inventory
      await supabase
        .from('inventory')
        .delete()
        .eq('user_id', currentUserData.id)
        .eq('item_id', item.id);

      // Add item to recipient's inventory
      const { error: addError } = await supabase
        .from('inventory')
        .insert({
          user_id: toUser.id,
          item_id: item.id,
          quantity: 1
        });

      if (addError) {
        // If adding to recipient fails, restore item to sender
        await supabase
          .from('inventory')
          .insert({
            user_id: currentUserData.id,
            item_id: item.id,
            quantity: 1
          });
        throw addError;
      }

      toast({
        title: "Item enviado! 📦",
        description: `${item.name} foi enviado para ${getDisplayName(toUser.username)}`
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <ArrowLeft size={16} />
            </Button>
            <DialogTitle>Enviar Item</DialogTitle>
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
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}