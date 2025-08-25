import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Gift, DollarSign, Send } from "lucide-react";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useFriendship } from "@/contexts/FriendshipContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface FriendsAppProps {
  onBack: () => void;
}

export function FriendsApp({ onBack }: FriendsAppProps) {
  const { friends } = useFriendship();
  const { coins, deductCoins, inventory, removeFromInventory } = useGame();
  const { toast } = useToast();
  
  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };
  
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [sendMoneyModal, setSendMoneyModal] = useState(false);
  const [sendItemModal, setSendItemModal] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState("");
  const [selectedItem, setSelectedItem] = useState("");

  const handleSendMoney = async () => {
    const amount = parseInt(moneyAmount);
    if (!amount || amount <= 0 || amount > coins) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFriend) return;

    deductCoins(amount);
    
    // Store the money transfer in localStorage for the recipient
    const transfers = JSON.parse(localStorage.getItem('moneyTransfers') || '[]');
    transfers.push({
      id: crypto.randomUUID(),
      from: localStorage.getItem('currentUser'),
      to: selectedFriend.id,
      amount: amount,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('moneyTransfers', JSON.stringify(transfers));

    toast({
      title: "Dinheiro enviado! 💰",
      description: `${amount} C'M enviados para ${getDisplayName(selectedFriend.username)}`
    });

    setSendMoneyModal(false);
    setMoneyAmount("");
    setSelectedFriend(null);
  };

  const handleSendItem = async () => {
    if (!selectedItem || !selectedFriend) return;

    const itemInInventory = inventory.find(item => item.id === selectedItem);
    if (!itemInInventory) {
      toast({
        title: "Erro",
        description: "Item não encontrado no inventário",
        variant: "destructive"
      });
      return;
    }

    removeFromInventory(selectedItem);

    // Store the item transfer in localStorage for the recipient
    const itemTransfers = JSON.parse(localStorage.getItem('itemTransfers') || '[]');
    itemTransfers.push({
      id: crypto.randomUUID(),
      from: localStorage.getItem('currentUser'),
      to: selectedFriend.id,
      item: itemInInventory,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('itemTransfers', JSON.stringify(itemTransfers));

    toast({
      title: "Item enviado! 📦",
      description: `${itemInInventory.name} enviado para ${getDisplayName(selectedFriend.username)}`
    });

    setSendItemModal(false);
    setSelectedItem("");
    setSelectedFriend(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Amigos</h1>
        <Badge variant="outline" className="ml-auto">
          {friends.length} amigo{friends.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Friends List */}
      <div className="flex-1 space-y-3">
        {friends.length > 0 ? (
          friends.map(friend => (
            <Card key={friend.id} className="bg-gradient-card border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      {friend.avatar_url ? (
                        <AvatarImage src={friend.avatar_url} alt="Profile" />
                      ) : (
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {getDisplayName(friend.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${friend.isOnline ? 'bg-success' : 'bg-muted'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{getDisplayName(friend.username)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {friend.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </p>
                  </div>

                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                    ✓ Amigo
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFriend(friend);
                      setSendMoneyModal(true);
                    }}
                  >
                    <DollarSign size={14} className="mr-2" />
                    Enviar C'M
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFriend(friend);
                      setSendItemModal(true);
                    }}
                  >
                    <Gift size={14} className="mr-2" />
                    Enviar Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-6xl">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum amigo</h3>
                <p className="text-sm text-muted-foreground">
                  Vá ao Mundo para encontrar e adicionar amigos!
                </p>
              </div>
              <Button variant="outline" disabled>
                <Users size={16} className="mr-2" />
                Encontrar amigos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-card border-border/50 mt-4">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              💰 Envie dinheiro (C'M) para seus amigos
            </p>
            <p className="text-xs text-muted-foreground">
              🎁 Compartilhe itens da sua bolsa com eles
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Send Money Modal */}
      <Dialog open={sendMoneyModal} onOpenChange={setSendMoneyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Dinheiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Para: {getDisplayName(selectedFriend?.username || '')}</Label>
            </div>
            <div>
              <Label htmlFor="amount">Quantidade (C'M)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Digite a quantidade"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                max={coins}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Saldo disponível: {coins} C'M
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMoney} 
                className="flex-1"
                disabled={!moneyAmount || parseInt(moneyAmount) <= 0 || parseInt(moneyAmount) > coins}
              >
                <Send size={16} className="mr-2" />
                Enviar
              </Button>
              <Button variant="outline" onClick={() => setSendMoneyModal(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Item Modal */}
      <Dialog open={sendItemModal} onOpenChange={setSendItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Para: {getDisplayName(selectedFriend?.username || '')}</Label>
            </div>
            <div>
              <Label htmlFor="item">Selecionar Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um item da bolsa" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.length > 0 ? (
                    inventory.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.icon} {item.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-items" disabled>
                      Nenhum item na bolsa
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSendItem} 
                className="flex-1"
                disabled={!selectedItem || selectedItem === "no-items" || inventory.length === 0}
              >
                <Send size={16} className="mr-2" />
                Enviar
              </Button>
              <Button variant="outline" onClick={() => setSendItemModal(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}