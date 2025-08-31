import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Users, ArrowLeft, User, X } from "lucide-react";

interface User {
  id: string;
  username: string;
  created_at: string;
}

interface SavedProfile {
  username: string;
  displayName: string;
  savedAt: string;
}

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Load saved profiles on component mount
  useEffect(() => {
    const profiles = localStorage.getItem('savedProfiles');
    if (profiles) {
      try {
        setSavedProfiles(JSON.parse(profiles));
      } catch (error) {
        console.error('Error parsing saved profiles:', error);
        localStorage.removeItem('savedProfiles');
      }
    }
    
    // Legacy support - convert old remembered username
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername && !profiles) {
      const profile: SavedProfile = {
        username: savedUsername,
        displayName: getDisplayName(savedUsername),
        savedAt: new Date().toISOString()
      };
      const newProfiles = [profile];
      localStorage.setItem('savedProfiles', JSON.stringify(newProfiles));
      localStorage.removeItem('rememberedUsername');
      setSavedProfiles(newProfiles);
    }
  }, []);

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };

  // Function to save profile when "remember me" is checked
  const saveProfile = (username: string) => {
    const profile: SavedProfile = {
      username,
      displayName: getDisplayName(username),
      savedAt: new Date().toISOString()
    };
    
    const existingProfiles = [...savedProfiles];
    const existingIndex = existingProfiles.findIndex(p => p.username === username);
    
    if (existingIndex >= 0) {
      existingProfiles[existingIndex] = profile;
    } else {
      existingProfiles.unshift(profile); // Add to beginning
    }
    
    // Keep only last 5 profiles
    const limitedProfiles = existingProfiles.slice(0, 5);
    
    localStorage.setItem('savedProfiles', JSON.stringify(limitedProfiles));
    setSavedProfiles(limitedProfiles);
  };

  // Function to remove a saved profile
  const removeSavedProfile = (username: string) => {
    const updatedProfiles = savedProfiles.filter(p => p.username !== username);
    localStorage.setItem('savedProfiles', JSON.stringify(updatedProfiles));
    setSavedProfiles(updatedProfiles);
  };

  // Function to handle quick login from saved profile
  const handleQuickLogin = async (username: string) => {
    setIsLoading(true);
    
    try {
      const result = await signIn(username);
      
      if (result.error) {
        toast({
          title: "Erro no login",
          description: result.error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update profile timestamp
      saveProfile(username);
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo de volta, ${getDisplayName(username)}!`
      });

    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validar formato do username
    const usernameRegex = /^[a-zA-Z]+\d{4}$/;
    if (!usernameRegex.test(username)) {
      toast({
        title: "Formato inválido",
        description: "O username deve terminar com exatamente 4 dígitos (ex: Lucas1415)",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      let result;
      
      if (isRegistering) {
        result = await signUp(username);
        
        if (result.error) {
          toast({
            title: "Erro ao criar conta",
            description: result.error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Save profile if remember me is checked
        if (rememberLogin) {
          saveProfile(username);
        }
        
        toast({
          title: "Conta criada e login realizado!",
          description: `Bem-vindo ao RPG Real Life Virtual, ${username.slice(0, -4)}!`
        });

      } else {
        result = await signIn(username);
        
        if (result.error) {
          toast({
            title: "Erro no login",
            description: result.error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Save or remove profile based on "remember me" checkbox
        if (rememberLogin) {
          saveProfile(username);
        }
        
        toast({
          title: "Login realizado!",
          description: `Bem-vindo de volta, ${username.slice(0, -4)}!`
        });
      }

    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: supabaseUsers, error } = await supabase
        .from('users')
        .select('id, username, created_at')
        .order('created_at', { ascending: false });
      
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
      }
      
      setUsers(supabaseUsers || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAdminAccess = () => {
    if (adminPassword === "88620787") {
      loadUsers();
      setShowUsersList(true);
      setAdminPassword("");
    } else {
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador está incorreta.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      if (!confirm(`Tem certeza que deseja deletar o usuário "${username}"? Esta ação não pode ser desfeita.`)) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('purge-users', {
        body: { mode: 'single', userId, adminPassword: '88620787' }
      });

      if (error) throw error;
      if ((data as any)?.success !== true) throw new Error('Falha na exclusão');

      setUsers(users.filter(user => user.id !== userId));

      toast({
        title: "Usuário deletado",
        description: `A conta de ${username} foi removida com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o usuário. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllUsers = async () => {
    try {
      if (!confirm(`Tem certeza que deseja deletar TODOS os ${users.length} usuários? Esta ação não pode ser desfeita.`)) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('purge-users', {
        body: { mode: 'all', adminPassword: '88620787' }
      });

      if (error) throw error;
      if ((data as any)?.success !== true) throw new Error('Falha na exclusão');

      setUsers([]);

      toast({
        title: "Todos os usuários foram deletados",
        description: "Todas as contas de usuários foram removidas com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao deletar todos os usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar todos os usuários. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Tela de senha de administrador
  if (showUsersList && users.length === 0 && !isLoadingUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUsersList(false)}
              >
                <ArrowLeft size={20} />
              </Button>
              <Users size={32} className="text-primary" />
            </div>
            <CardTitle className="text-lg">Acesso Administrativo</CardTitle>
            <CardDescription>
              Digite a senha para ver todos os usuários
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha de administrador"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
                className="bg-input border-border/50 focus:border-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <Button onClick={handleAdminAccess} className="w-full">
              Acessar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de lista de usuários
  if (showUsersList && users.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUsersList(false)}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <CardTitle className="text-lg">Usuários Registrados</CardTitle>
                <CardDescription>
                  Total: {users.length} usuários
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Delete All Users Button */}
              <Button
                variant="destructive"
                onClick={handleDeleteAllUsers}
                className="w-full"
              >
                Deletar Todos os Usuários ({users.length})
              </Button>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{getDisplayName(user.username)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="text-xs"
                    >
                      Deletar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main screen - show saved profiles if any, otherwise show login form
  if (!showLoginForm && !showUsersList && savedProfiles.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              RPG Real Life Virtual
            </CardTitle>
            <CardDescription>
              Escolha um perfil para entrar rapidamente
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Saved Profiles */}
            <div className="space-y-2">
              {savedProfiles.map((profile) => (
                <div
                  key={profile.username}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/20 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{profile.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {new Date(profile.savedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedProfile(profile.username)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X size={14} />
                    </Button>
                    <Button
                      onClick={() => handleQuickLogin(profile.username)}
                      disabled={isLoading}
                      className="px-4"
                    >
                      {isLoading ? "..." : "Entrar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="border-t border-border/50 pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowLoginForm(true)}
              >
                Usar Outro Usuário
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowUsersList(true)}
              >
                <Users size={16} className="mr-2" />
                Ver Todos os Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50">
        <CardHeader className="text-center">
          <div className="flex items-center gap-3 mb-4">
            {(showLoginForm && savedProfiles.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLoginForm(false)}
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                RPG Real Life Virtual
              </CardTitle>
              <CardDescription>
                {isRegistering ? "Crie sua conta para começar" : "Entre em sua conta"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Lucas1415"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border/50 focus:border-primary pr-10"
                  required
                />
                {username && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                    onClick={() => setUsername("")}
                  >
                    <span className="text-muted-foreground hover:text-foreground">✕</span>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Deve terminar com exatamente 4 dígitos
              </p>
            </div>

            {/* Remember Login Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberLogin"
                checked={rememberLogin}
                onCheckedChange={(checked) => setRememberLogin(checked === true)}
              />
              <label
                htmlFor="rememberLogin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar meu login
              </label>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Carregando..." : (isRegistering ? "Criar Conta" : "Entrar")}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Já tem uma conta? Faça login" : "Não tem conta? Registre-se"}
            </Button>

            <div className="border-t border-border/50 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowUsersList(true)}
              >
                <Users size={16} className="mr-2" />
                Ver Todos os Usuários
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}