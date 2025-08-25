import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles, Crown } from "lucide-react";
import { StoreItem } from "@/data/stores";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RelationshipProposal {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  ring: StoreItem;
  createdAt: Date;
  type: 'dating' | 'engagement' | 'marriage';
}

interface RelationshipProposalModalProps {
  proposal: RelationshipProposal | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onAccept: (proposal: RelationshipProposal) => void;
  onReject: (proposal: RelationshipProposal) => void;
}

const getRelationshipIcon = (type: string) => {
  switch (type) {
    case "namoro":
      return <Heart className="w-6 h-6 text-pink-500" />;
    case "noivado":
      return <Crown className="w-6 h-6 text-purple-500" />;
    case "casamento":
      return <Sparkles className="w-6 h-6 text-yellow-500" />;
    default:
      return <Heart className="w-6 h-6 text-pink-500" />;
  }
};

const getRelationshipColor = (type: string) => {
  switch (type) {
    case "namoro":
      return "from-pink-500 to-rose-500";
    case "noivado":
      return "from-purple-500 to-indigo-500";
    case "casamento":
      return "from-yellow-500 to-orange-500";
    default:
      return "from-pink-500 to-rose-500";
  }
};

export function RelationshipProposalModal({ 
  proposal, 
  isOpen, 
  onClose, 
  currentUserId,
  onAccept,
  onReject 
}: RelationshipProposalModalProps) {
  const { toast } = useToast();

  if (!proposal) return null;

  const handleAccept = async () => {
    try {
      // Update both users' relationship status in the database
      const relationshipStatus = proposal.ring.relationshipType === "namoro" ? "dating" : 
                               proposal.ring.relationshipType === "noivado" ? "engaged" : "married";

      // For now, we'll just update local state since partner_id and relationship_status
      // don't exist in the users table. This would need proper database schema
      console.log(`Setting relationship between ${currentUserId} and ${proposal.fromUserId}`);

      // Show visual effect
      showVisualEffect(proposal.ring);
      
      onAccept(proposal);
      onClose();
      
      toast({
        title: "Pedido aceito! 💕",
        description: `Agora vocês estão ${proposal.ring.relationshipType === "namoro" ? "namorando" : 
                     proposal.ring.relationshipType === "noivado" ? "noivos" : "casados"}!`
      });
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o pedido",
        variant: "destructive"
      });
    }
  };

  const handleReject = () => {
    onReject(proposal);
    onClose();
    
    toast({
      title: "Pedido recusado",
      description: `Você recusou o pedido de ${proposal.ring.relationshipType} de ${proposal.fromUsername}`
    });
  };

  const showVisualEffect = (ring: StoreItem) => {
    // Create a visual effect element
    const effectElement = document.createElement('div');
    effectElement.className = `fixed inset-0 pointer-events-none z-50`;
    
    if (ring.relationshipType === "namoro") {
      effectElement.innerHTML = `
        <div class="absolute inset-0 bg-pink-500/20 animate-pulse">
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="text-6xl animate-bounce">💕</div>
          </div>
        </div>`;
    } else if (ring.relationshipType === "noivado") {
      effectElement.innerHTML = `
        <div class="absolute inset-0">
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="text-6xl animate-spin-slow">✨</div>
          </div>
        </div>`;
    } else if (ring.relationshipType === "casamento") {
      effectElement.innerHTML = `
        <div class="absolute inset-0 bg-yellow-500/20">
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="text-6xl animate-pulse">💍</div>
          </div>
        </div>`;
    }

    document.body.appendChild(effectElement);
    
    setTimeout(() => {
      document.body.removeChild(effectElement);
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRelationshipColor(proposal.ring.relationshipType!)} flex items-center justify-center animate-pulse`}>
              {getRelationshipIcon(proposal.ring.relationshipType!)}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Pedido de {proposal.ring.relationshipType === "namoro" ? "Namoro" : 
                      proposal.ring.relationshipType === "noivado" ? "Noivado" : "Casamento"} 💕
          </DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <p className="font-medium text-foreground">
              {proposal.fromUsername} enviou um anel para você!
            </p>
            
            <div className="bg-gradient-card border border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">💍</div>
                <div>
                  <h4 className="font-semibold text-foreground">{proposal.ring.name}</h4>
                  {proposal.ring.isMagical && (
                    <Badge variant="secondary" className="text-xs">✨ MÁGICO</Badge>
                  )}
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-md p-3 mb-3">
                <p className="text-sm italic text-center text-foreground">
                  "{proposal.ring.relationshipPhrase}"
                </p>
              </div>
              
              {proposal.ring.visualEffect && (
                <div className="text-xs text-muted-foreground">
                  <strong>Efeito:</strong> {proposal.ring.visualEffect}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="destructive" 
            onClick={handleReject}
            className="flex-1"
          >
            Recusar 💔
          </Button>
          <Button 
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            Aceitar 💕
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}