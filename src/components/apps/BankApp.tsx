import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building, DollarSign, History, Send, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankAppProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  transaction_type: string;
  created_at: string;
  sender?: { username: string };
  receiver?: { username: string };
}

interface User {
  id: string;
  username: string;
  wallet_balance: number;
}

export function BankApp({ onBack }: BankAppProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [bankBalance, setBankBalance] = useState(1000000000); // 1 billion CM
  const [currentView, setCurrentView] = useState<"dashboard" | "send" | "history" | "users" | "userLogin">("dashboard");
  const [userPassword, setUserPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-BR').format(amount);
  };

  const handleLogin = () => {
    if (username === "Banco8862") {
      setIsLoggedIn(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema bancário.",
      });
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Verifique o código de acesso.",
        variant: "destructive",
      });
    }
  };

  const handleUserPasswordLogin = () => {
    if (userPassword === "88620787") {
      setCurrentView("users");
      loadUsers();
      toast({
        title: "Acesso autorizado",
        description: "Bem-vindo ao gerenciamento de usuários.",
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Verifique a senha de administrador.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Usuário deletado",
        description: "Usuário foi removido do sistema.",
      });
      
      loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o usuário.",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = (username: string) => {
    return username.length > 4 ? username.slice(0, -4) : username;
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, wallet_balance')
        .order('username');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Since we don't have a transactions table, we'll use orders table to simulate transactions
      // For now, we'll just set an empty array
      setTransactions([]);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
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

    if (amount > bankBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O banco não possui saldo suficiente.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get receiver's current balance and update
      const { data: receiverProfile } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', selectedUser)
        .single();

      if (receiverProfile) {
        const receiverNewBalance = (receiverProfile.wallet_balance || 0) + amount;
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_balance: receiverNewBalance })
          .eq('id', selectedUser);

        if (updateError) throw updateError;
      }

      setBankBalance(prev => prev - amount);
      setSelectedUser("");
      setCustomAmount("");
      
      toast({
        title: "Transferência realizada!",
        description: `${formatMoney(amount)} CM enviados com sucesso.`,
      });

      loadUsers();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao enviar dinheiro:', error);
      toast({
        title: "Erro na transferência",
        description: "Não foi possível completar a transferência.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadUsers();
      loadTransactions();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Banco</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-sm bg-gradient-card border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building size={32} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Login do Banco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Código de Acesso"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === "userLogin") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Acesso Administrativo</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-sm bg-gradient-card border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye size={32} className="text-destructive" />
              </div>
              <CardTitle className="text-lg">Senha de Administrador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Senha de Administrador"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleUserPasswordLogin} className="w-full">
                Acessar
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full"
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === "send") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
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

  if (currentView === "history") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Histórico</h1>
        </div>

        <Card className="bg-gradient-card border-border/50 flex-1">
          <CardHeader>
            <CardTitle className="text-sm">Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhuma transação encontrada</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-background/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {getDisplayName(transaction.sender?.username || 'Banco')} → {getDisplayName(transaction.receiver?.username || '')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-money">
                    {formatMoney(transaction.amount)} CM
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === "users") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Todos os Usuários</h1>
        </div>

        <Card className="bg-gradient-card border-border/50 flex-1">
          <CardHeader>
            <CardTitle className="text-sm">Usuários do Sistema ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 bg-background/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">
                    {getDisplayName(user.username)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {formatMoney(user.wallet_balance || 0)} CM
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteUser(user.id)}
                >
                  Deletar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Banco</h1>
      </div>

      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Saldo do Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Building size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(bankBalance)} CM
              </p>
              <p className="text-xs text-muted-foreground">
                Sistema Bancário
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
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
          Histórico de Transações
        </Button>
      </div>
    </div>
  );
}