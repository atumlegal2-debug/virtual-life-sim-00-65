import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRelationship } from "@/contexts/RelationshipContext";
import { supabase } from "@/integrations/supabase/client";
import { StoreItem } from "@/data/stores";

interface SendRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ring: StoreItem | null;
}

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  isOnline: boolean;
}

export function SendRingModal({ isOpen, onClose, ring }: SendRingModalProps) {
  const { currentUser } = useGame();
  const { sendProposal } = useRelationship();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      // Get users from localStorage
      const localUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Get users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
      }

      // Combine both sources
      const allUsers = [
        ...localUsers.map((user: any) => ({
          id: user.username,
          username: user.username,
          avatar_url: null,
          isOnline: Math.random() > 0.3
        })),
        ...(data || []).map(profile => ({
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar,
          isOnline: Math.random() > 0.3
        }))
      ];

      // Remove duplicates and current user
      const uniqueUsers = allUsers
        .filter((user, index, self) => 
          index === self.findIndex(u => u.username === user.username)
        )
        .filter(user => user.username !== currentUser);

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSendProposal = async () => {
    if (!selectedUser || !ring) return;

    console.log('SendRingModal - selectedUser:', selectedUser);
    console.log('SendRingModal - ring:', ring);
    // Use username instead of ID for consistency
    await sendProposal(selectedUser.username, selectedUser.username, ring);
    onClose();
    setSelectedUser(null);
  };

  const getRelationshipTypeText = (type: string) => {
    switch (type) {
      case 'dating': return 'Namoro';
      case 'engagement': return 'Noivado';
      case 'marriage': return 'Casamento';
      default: return type;
    }
  };

  if (!ring) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="text-love" size={20} />
            Fazer Pedido Romântico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ring Info */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ring.icon || "💍"}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{ring.name}</h3>
                  <p className="text-sm text-muted-foreground">{ring.description}</p>
                  <Badge className="bg-love text-white text-xs mt-1">
                    {getRelationshipTypeText((ring as any).relationshipType || '')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} />
              <span className="text-sm font-medium">Escolha o destinatário:</span>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users.map(user => (
                <Card 
                  key={user.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedUser?.id === user.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'bg-muted/20 hover:bg-muted/40'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt="Profile" />
                          ) : (
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                              {getDisplayName(user.username).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${user.isOnline ? 'bg-success' : 'bg-muted'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {getDisplayName(user.username)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>

                      {selectedUser?.id === user.id && (
                        <Heart className="text-love" size={16} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
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
              onClick={handleSendProposal}
              disabled={!selectedUser}
              className="flex-1 bg-love hover:bg-love/90"
            >
              <Heart size={16} className="mr-2" />
              Enviar Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}