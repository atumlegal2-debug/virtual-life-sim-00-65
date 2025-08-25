import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X } from "lucide-react";
import { useFriendship } from "@/contexts/FriendshipContext";

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useFriendship();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <UserPlus size={32} className="text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Pedidos de Amizade 👋
          </DialogTitle>
          <DialogDescription className="text-center">
            {friendRequests.length === 0 
              ? "Nenhum pedido de amizade pendente"
              : `${friendRequests.length} pedido${friendRequests.length > 1 ? 's' : ''} pendente${friendRequests.length > 1 ? 's' : ''}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {friendRequests.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="text-muted-foreground space-y-2">
                  <div className="text-4xl">🤷‍♂️</div>
                  <p className="text-sm">Nenhum pedido no momento</p>
                  <p className="text-xs">Quando alguém quiser ser seu amigo, os pedidos aparecerão aqui!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            friendRequests.map((request) => (
              <Card key={request.id} className="bg-gradient-card border-border/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {getDisplayName(request.requester_username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{getDisplayName(request.requester_username)}</h4>
                      <p className="text-xs text-muted-foreground">
                        Quer ser seu amigo
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Check size={16} className="mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectFriendRequest(request.id)}
                      className="flex-1"
                    >
                      <X size={16} className="mr-1" />
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}