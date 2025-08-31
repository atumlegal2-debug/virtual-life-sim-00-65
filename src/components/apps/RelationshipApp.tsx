import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Users, Gift, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRelationship } from "@/contexts/RelationshipContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RelationshipAppProps {
  onBack: () => void;
}

export function RelationshipApp({ onBack }: RelationshipAppProps) {
  const { currentUser, deductCoins, coins, createPurchaseTransaction } = useGame();
  const { 
    proposals, 
    currentRelationship, 
    getProposalsForUser, 
    acceptProposal, 
    rejectProposal,
    endRelationship 
  } = useRelationship();
  
  const [selectedTab, setSelectedTab] = useState<'status' | 'proposals' | 'connected'>('status');
  
  const userProposals = currentUser ? proposals.filter(p => p.toUserId === currentUser) : [];

  const getRelationshipTypeText = (type: string) => {
    switch (type) {
      case 'dating': return 'Namorando';
      case 'engagement': return 'Noivos';
      case 'marriage': return 'Casados';
      default: return type;
    }
  };

  const getEndRelationshipText = (type: string) => {
    switch (type) {
      case 'dating': return 'Terminar namoro';
      case 'engagement': return 'Terminar noivado';
      case 'marriage': return 'Divórcio';
      default: return 'Terminar relacionamento';
    }
  };

  const getEndConfirmationText = (type: string) => {
    switch (type) {
      case 'dating': return 'Tem certeza que deseja terminar o namoro?';
      case 'engagement': return 'Tem certeza que deseja terminar o noivado?';
      case 'marriage': return 'Tem certeza que deseja se divorciar?';
      default: return 'Tem certeza disso?';
    }
  };

  const handleEndRelationship = async () => {
    if (currentRelationship?.type === 'marriage') {
      if (coins < 5000) {
        // Show insufficient funds toast or modal
        return;
      }
      deductCoins(5000);
      await createPurchaseTransaction(5000, "Taxa de divórcio");
    }
    await endRelationship();
  };

  const canAffordDivorce = currentRelationship?.type === 'marriage' ? coins >= 5000 : true;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Relacionamentos</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedTab === 'status' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('status')}
          className="flex-1"
          size="sm"
        >
          <Heart size={14} />
          <span className="ml-1 text-xs">Status</span>
        </Button>
        <Button
          variant={selectedTab === 'connected' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('connected')}
          className="flex-1"
          size="sm"
        >
          <Users size={14} />
          <span className="ml-1 text-xs">Almas Conectadas</span>
        </Button>
        <Button
          variant={selectedTab === 'proposals' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('proposals')}
          className="flex-1 relative"
          size="sm"
        >
          <Gift size={14} />
          <span className="ml-1 text-xs">Pedidos</span>
          {userProposals.length > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-red-500 animate-pulse">
              {userProposals.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {selectedTab === 'status' && (
          <div className="space-y-4">
            {currentRelationship ? (
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="text-love" size={20} />
                    Seu Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-3">
                    <Badge className="bg-love text-white text-sm px-4 py-2">
                      {getRelationshipTypeText(currentRelationship.type)}
                    </Badge>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Relacionamento com</p>
                      <p className="text-lg font-semibold text-foreground">
                        {currentRelationship.partnerUsername}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Desde</p>
                      <p className="text-sm text-foreground">
                        {new Date(currentRelationship.startDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* End Relationship Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={currentRelationship.type === 'marriage' && !canAffordDivorce}
                      >
                        {currentRelationship.type === 'marriage' && !canAffordDivorce ? (
                          <>
                            <AlertTriangle size={16} className="mr-2" />
                            Insuficiente (5.000 CM)
                          </>
                        ) : (
                          getEndRelationshipText(currentRelationship.type)
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {currentRelationship.type === 'marriage' ? 'Confirmar Divórcio' : 'Confirmar Término'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {getEndConfirmationText(currentRelationship.type)}
                          {currentRelationship.type === 'marriage' && (
                            <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20">
                              <p className="text-sm text-warning">
                                💰 O divórcio custará 5.000 CM
                              </p>
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Não</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEndRelationship} className="bg-destructive hover:bg-destructive/90">
                          Sim
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="text-6xl">💔</div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Solteiro(a)</h3>
                    <p className="text-sm text-muted-foreground">
                      Você não está em um relacionamento no momento.
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    <Heart size={16} className="mr-2" />
                    Encontrar alguém especial
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    💕 Use o Mundo para encontrar outros usuários e enviar propostas de relacionamento
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💍 Compre anéis na loja para fazer propostas especiais
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'connected' && (
          <div className="space-y-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="text-6xl">🤝</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Almas Conectadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Em breve você poderá conectar almas com seus amigos especiais!
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Info Card */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    👥 Use itens de amizade da joalheria para criar laços especiais
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💎 Anéis, pulseiras, colares e relógios de amizade disponíveis em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'proposals' && (
          <div className="space-y-4">
            {userProposals.length > 0 ? (
              userProposals.map(proposal => (
                <Card key={proposal.id} className="bg-gradient-card border-border/50">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-bold">
                            {proposal.fromUsername.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{proposal.fromUsername}</h3>
                          <p className="text-sm text-muted-foreground">
                            Pedido de {getRelationshipTypeText(proposal.type)}
                          </p>
                        </div>
                        <Badge className="bg-love text-white">
                          {getRelationshipTypeText(proposal.type)}
                        </Badge>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{proposal.ring.icon || "💍"}</span>
                          <div>
                            <p className="font-medium text-foreground">{proposal.ring.name}</p>
                            <p className="text-sm text-muted-foreground">{proposal.ring.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptProposal(proposal)}
                          className="flex-1 bg-success hover:bg-success/90"
                        >
                          <Heart size={16} className="mr-2" />
                          Aceitar
                        </Button>
                        <Button
                          onClick={() => rejectProposal(proposal)}
                          variant="outline"
                          className="flex-1"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="text-6xl">💌</div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pedido</h3>
                    <p className="text-sm text-muted-foreground">
                      Você não possui pedidos de relacionamento pendentes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}