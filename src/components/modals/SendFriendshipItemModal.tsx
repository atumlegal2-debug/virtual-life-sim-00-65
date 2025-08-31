import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Send, X } from "lucide-react";
import { useFriendship } from "@/contexts/FriendshipContext";
import { useFriendshipItems } from "@/contexts/FriendshipItemContext";

interface SendFriendshipItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    description: string;
    icon?: string;
  } | null;
}

export function SendFriendshipItemModal({ isOpen, onClose, item }: SendFriendshipItemModalProps) {
  const { friends } = useFriendship();
  const { sendFriendshipItem } = useFriendshipItems();
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriend(null);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!selectedFriend || !item) return;

    setIsLoading(true);
    try {
      await sendFriendshipItem(selectedFriend, item);
      onClose();
    } catch (error) {
      console.error('Error sending friendship item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Enviar Item de Amizade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Preview */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {item.icon || "💎"}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Friends List */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Selecione um amigo:</h4>
            
            {friends.length === 0 ? (
              <Card className="bg-muted/50 border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Você precisa ter amigos para enviar itens de amizade.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <Card
                    key={friend.id}
                    className={`cursor-pointer transition-colors border ${
                      selectedFriend === friend.username
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    }`}
                    onClick={() => setSelectedFriend(friend.username)}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-bold">
                              {getDisplayName(friend.username).slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {getDisplayName(friend.username)}
                          </span>
                        </div>
                        
                        {selectedFriend === friend.username && (
                          <Badge className="bg-primary text-primary-foreground">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedFriend || isLoading}
            className="flex-1"
          >
            <Send size={16} className="mr-2" />
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}