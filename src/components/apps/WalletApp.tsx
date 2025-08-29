import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft, Coins, Send, History, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WalletAppProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  from_username: string;
  to_username: string;
  amount: number;
  created_at: string;
  transaction_type: string;
  description?: string;
}

export function WalletApp({ onBack }: WalletAppProps) {
  const { currentUser } = useGame();
  const [walletBalance, setWalletBalance] = useState(2000);
  const [currentView, setCurrentView] = useState<"wallet" | "send" | "history">("wallet");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // All transactions including purchases
  const { toast } = useToast();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-BR').format(amount);
  };

  const loadUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      // Use the same method as GameContext - get user by username
      const { data: profile } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('username', currentUser)
        .single();

      if (profile) {
        setWalletBalance(profile.wallet_balance || 2000);
        console.log('WalletApp saldo carregado:', profile.wallet_balance);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setWalletBalance(2000); // Default fallback
    }
  };

  const loadUsers = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, wallet_balance')
        .neq('username', currentUser)
        .order('username');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const sendMoney = async (amount: number) => {
    if (!selectedUser || amount <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e um valor válido.",
        variant: "destructive",
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!currentUser) return;

      // Get sender and receiver info
      const { data: senderProfile } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', currentUser)
        .single();

      const { data: receiverProfile } = await supabase
        .from('users')
        .select('id, username, wallet_balance')
        .eq('id', selectedUser)
        .single();

      if (!senderProfile || !receiverProfile) {
        throw new Error('Usuários não encontrados');
      }

      // Update sender's wallet balance using username
      const senderCurrentBalance = walletBalance - amount;
      const { error: senderError } = await supabase
        .from('users')
        .update({ wallet_balance: senderCurrentBalance })
        .eq('username', currentUser);

      if (senderError) throw senderError;

      // Update receiver's balance
      const receiverNewBalance = (receiverProfile.wallet_balance || 0) + amount;
      const { error: receiverError } = await supabase
        .from('users')
        .update({ wallet_balance: receiverNewBalance })
        .eq('id', selectedUser);

      if (receiverError) throw receiverError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: senderProfile.id,
          to_user_id: receiverProfile.id,
          from_username: senderProfile.username,
          to_username: receiverProfile.username,
          amount: amount,
          transaction_type: 'transfer',
          description: `Transferência de ${formatMoney(amount)} CM`
        });

      if (transactionError) throw transactionError;

      setWalletBalance(prev => prev - amount);
      setSelectedUser("");
      setCustomAmount("");
      
      toast({
        title: "Transferência realizada!",
        description: `${formatMoney(amount)} CM enviados com sucesso.`,
      });

      loadUsers();
    } catch (error) {
      console.error('Erro ao enviar dinheiro:', error);
      toast({
        title: "Erro na transferência",
        description: "Não foi possível completar a transferência.",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    if (!currentUser) return;
    
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (!userProfile) return;

      // Load all transactions (both transfers and purchases)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Separate transfers for the main transactions view
      const transferTransactions = (data || []).filter(t => t.transaction_type === 'transfer');
      setTransactions(transferTransactions);
      
      // Keep all transactions for complete history
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  useEffect(() => {
    loadUserProfile();
    if (currentView === "send") {
      loadUsers();
    } else if (currentView === "history") {
      loadTransactions();
    }
  }, [currentUser, currentView]);

  if (currentView === "history") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("wallet")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Histórico Completo</h1>
        </div>

        <div className="space-y-3 flex-1 overflow-auto">
          {allTransactions.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            allTransactions.map((transaction) => {
              const isTransfer = transaction.transaction_type === 'transfer';
              const isReceived = isTransfer && transaction.to_username === currentUser;
              const isPurchase = transaction.transaction_type === 'purchase';
              const otherUser = isTransfer ? (isReceived ? transaction.from_username : transaction.to_username) : null;
              const displayName = otherUser ? getDisplayName(otherUser) : null;
              
              return (
                <Card key={transaction.id} className="bg-gradient-card border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isReceived ? 'bg-green-500/20' : 
                          isPurchase ? 'bg-blue-500/20' : 'bg-red-500/20'
                        }`}>
                          {isReceived ? (
                            <ArrowDownRight size={20} className="text-green-500" />
                          ) : isPurchase ? (
                            <Coins size={20} className="text-blue-500" />
                          ) : (
                            <ArrowUpRight size={20} className="text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {isReceived ? `Recebido de ${displayName}` : 
                             isPurchase ? (transaction.description || 'Compra') :
                             `Enviado para ${displayName}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        isReceived ? 'text-green-500' : 
                        isPurchase ? 'text-blue-500' : 'text-red-500'
                      }`}>
                        {isReceived ? '+' : '-'}{formatMoney(transaction.amount)} CM
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (currentView === "send") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("wallet")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Enviar Dinheiro</h1>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Selecionar Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant={selectedUser === user.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedUser(user.id)}
                >
                  {getDisplayName(user.username)} - {formatMoney(user.wallet_balance || 0)} CM
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedUser && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Valor a Enviar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => sendMoney(amount)}
                    >
                      {formatMoney(amount)} CM
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Valor personalizado"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <Button
                    onClick={() => sendMoney(Number(customAmount))}
                    disabled={!customAmount || Number(customAmount) <= 0}
                  >
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Carteira</h1>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Saldo Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-money/20 rounded-full flex items-center justify-center">
              <Coins size={24} className="text-money" />
            </div>
            <div>
              <p className="text-2xl font-bold text-money">
                {formatMoney(walletBalance)} CM
              </p>
              <p className="text-xs text-muted-foreground">
                Moeda Comum
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setCurrentView("send")}
          >
            <Send size={16} className="mr-2" />
            Enviar Dinheiro
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setCurrentView("history")}
          >
            <History size={16} className="mr-2" />
            Histórico Completo
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 Dica
            </p>
            <p className="text-xs text-muted-foreground">
              Use suas moedas para comprar itens nas lojas e melhorar sua experiência no jogo!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}