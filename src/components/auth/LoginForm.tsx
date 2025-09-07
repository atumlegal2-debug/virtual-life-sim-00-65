import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Users, ArrowLeft, User, X, HelpCircle, Clipboard } from "lucide-react";
import { TutorialModal } from "@/components/modals/TutorialModal";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
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

  // Function to paste from clipboard
  const handlePasteFromClipboard = async () => {
    setIsPasting(true);
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        toast({
          title: "Recurso não disponível",
          description: "Seu navegador não suporta colar automaticamente. Tente colar manualmente com Ctrl+V.",
          variant: "destructive"
        });
        return;
      }

      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText.trim()) {
        toast({
          title: "Área de transferência vazia",
          description: "Não há nada copiado para colar. Copie um username primeiro.",
          variant: "destructive"
        });
        return;
      }

      // Clean the text (remove spaces, special characters, keep only letters and numbers)
      const cleanText = clipboardText.trim().replace(/[^a-zA-Z0-9]/g, '');
      
      if (cleanText.length === 0) {
        toast({
          title: "Texto inválido",
          description: "O texto copiado não contém caracteres válidos para username.",
          variant: "destructive"
        });
        return;
      }

      setUsername(cleanText);
      
      toast({
        title: "Texto colado!",
        description: `Username "${cleanText}" foi colado automaticamente.`,
      });

    } catch (error) {
      console.error('Error accessing clipboard:', error);
      toast({
        title: "Erro ao colar",
        description: "Não foi possível acessar a área de transferência. Tente colar manualmente com Ctrl+V.",
        variant: "destructive"
      });
    } finally {
      setIsPasting(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5 opacity-50"></div>
        <Card className="w-full max-w-md bg-gradient-card border-border/30 shadow-card backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
          <CardHeader className="text-center relative">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUsersList(false)}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="p-3 bg-gradient-primary rounded-2xl shadow-app">
                <Users size={28} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5 opacity-50"></div>
        <Card className="w-full max-w-md bg-gradient-card border-border/30 shadow-card backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUsersList(false)}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-xl">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Usuários Registrados
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80">
                    Total: {users.length} usuários
                  </CardDescription>
                </div>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5 opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary-glow/10 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <Card className="w-full max-w-md bg-gradient-card border-border/30 shadow-card backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
          <CardHeader className="text-center relative pb-8">
            <div className="mb-6 p-4 bg-gradient-primary rounded-3xl w-fit mx-auto shadow-app">
              <div className="text-3xl font-bold text-white">RPG</div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Real Life Virtual
            </CardTitle>
            <CardDescription className="text-muted-foreground/80 text-base">
              Escolha um perfil para entrar rapidamente
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Saved Profiles */}
            <div className="space-y-2">
              {savedProfiles.map((profile) => (
                <div
                  key={profile.username}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-background/80 to-background/40 rounded-2xl border border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-app backdrop-blur-sm group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-app group-hover:scale-110 transition-transform duration-300">
                      <User size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-lg">{profile.displayName}</p>
                      <p className="text-sm text-muted-foreground/70">
                        Último acesso: {new Date(profile.savedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedProfile(profile.username)}
                      className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                    >
                      <X size={16} />
                    </Button>
                    <Button
                      onClick={() => handleQuickLogin(profile.username)}
                      disabled={isLoading}
                      className="px-6 py-2 bg-gradient-primary hover:opacity-90 text-white font-medium rounded-xl shadow-app transition-all duration-300 hover:scale-105"
                    >
                      {isLoading ? "..." : "Entrar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="border-t border-border/30 pt-6 space-y-3 relative">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 border-primary/30 hover:border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm rounded-xl font-medium transition-all duration-300 hover:shadow-app"
                onClick={() => setShowTutorial(true)}
              >
                <HelpCircle size={18} className="mr-2 text-primary" />
                Como Criar Conta no Amino
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm rounded-xl font-medium transition-all duration-300 hover:shadow-app"
                onClick={() => setShowLoginForm(true)}
              >
                Usar Outro Usuário
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full h-12 hover:bg-primary/10 rounded-xl font-medium transition-all duration-300"
                onClick={() => setShowUsersList(true)}
              >
                <Users size={18} className="mr-2" />
                Ver Todos os Usuários
              </Button>
            </div>
          </CardContent>
        </Card>

        <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5 opacity-50"></div>
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-primary-glow/10 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      <Card className="w-full max-w-md bg-gradient-card border-border/30 shadow-card backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
        <CardHeader className="text-center relative">
          <div className="flex items-center gap-4 mb-6">
            {(showLoginForm && savedProfiles.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLoginForm(false)}
                className="hover:bg-primary/10 transition-colors rounded-xl"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <div className="flex-1">
              <div className="mb-4 p-3 bg-gradient-primary rounded-2xl w-fit mx-auto shadow-app">
                <div className="text-2xl font-bold text-white">RPG</div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                Real Life Virtual
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">
                {isRegistering ? "Crie sua conta para começar" : "Entre em sua conta"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="username" className="text-sm font-semibold text-foreground">
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Lucas1415"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary h-12 rounded-xl backdrop-blur-sm transition-all duration-300 focus:shadow-app pr-20"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 hover:bg-primary/10 rounded-lg"
                    onClick={handlePasteFromClipboard}
                    disabled={isPasting}
                    title="Colar automaticamente"
                  >
                    {isPasting ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Clipboard size={14} className="text-primary hover:text-primary/80" />
                    )}
                  </Button>
                  {username && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 hover:bg-destructive/10 rounded-lg"
                      onClick={() => setUsername("")}
                      title="Limpar campo"
                    >
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground/70">
                  Deve terminar com exatamente 4 dígitos
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto p-1 hover:bg-primary/10 rounded-lg text-primary hover:text-primary/80"
                  onClick={handlePasteFromClipboard}
                  disabled={isPasting}
                >
                  <Clipboard size={12} className="mr-1" />
                  {isPasting ? "Colando..." : "Colar"}
                </Button>
              </div>
            </div>

            {/* Remember Login Checkbox */}
            <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-xl border border-border/20">
              <Checkbox
                id="rememberLogin"
                checked={rememberLogin}
                onCheckedChange={(checked) => setRememberLogin(checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="rememberLogin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar meu login
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-app transition-all duration-300 hover:scale-105" 
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : (isRegistering ? "Criar Conta" : "Entrar")}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full h-12 hover:bg-primary/10 rounded-xl font-medium transition-all duration-300"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Já tem uma conta? Faça login" : "Não tem conta? Registre-se"}
            </Button>

            <div className="border-t border-border/30 pt-6 space-y-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 border-primary/30 hover:border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm rounded-xl font-medium transition-all duration-300 hover:shadow-app"
                onClick={() => setShowTutorial(true)}
              >
                <HelpCircle size={18} className="mr-2 text-primary" />
                Como Criar Conta no Amino
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm rounded-xl font-medium transition-all duration-300 hover:shadow-app"
                onClick={() => setShowUsersList(true)}
              >
                <Users size={18} className="mr-2" />
                Ver Todos os Usuários
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </div>
  );
}