import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to main page
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isLogin ? await signIn(username) : await signUp(username);
      
      if (result.error) {
        toast({
          title: isLogin ? "Erro no login" : "Erro no cadastro",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: isLogin ? "Login realizado!" : "Cadastro realizado!",
          description: isLogin ? "Bem-vindo de volta!" : "Conta criada com sucesso!"
        });
        // Navigation will be handled by useEffect when user state updates
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {isLogin ? "Login" : "Cadastro"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta no RPG Real Life"}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: wonho1234"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use letras seguidas de exatamente 4 números (ex: wonho1234)
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : (isLogin ? "Entrar" : "Cadastrar")}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Se você não tem conta, cadastre-se com um nome como "wonho1234". 
              Para fazer login, use o mesmo nome que você cadastrou.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}