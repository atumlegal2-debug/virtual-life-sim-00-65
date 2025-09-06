import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (username: string) => Promise<{ error?: any }>;
  signIn: (username: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.user_metadata);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set currentUser in localStorage when user is authenticated
        if (session?.user) {
          const username = session.user.user_metadata?.username;
          if (username) {
            localStorage.setItem('currentUser', username);
            console.log('Current user set in localStorage:', username);
          }
        } else {
          localStorage.removeItem('currentUser');
          console.log('Current user removed from localStorage');
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.user_metadata);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set currentUser in localStorage for existing session
      if (session?.user) {
        const username = session.user.user_metadata?.username;
        if (username) {
          localStorage.setItem('currentUser', username);
          console.log('Current user set from existing session:', username);
        }
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateUsername = (username: string): boolean => {
    const regex = /^[a-zA-Z]+\d{4}$/; // Remove redundant 'i' flag since pattern already includes both cases
    return regex.test(username);
  };

  const checkUserExists = async (username: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('users')
        .select('username')
        .ilike('username', username)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return false;
    }
  };

  const signUp = async (username: string) => {
    if (!validateUsername(username)) {
      return { error: { message: "O username deve terminar com exatamente 4 dígitos (ex: Lucas1415)" } };
    }

    try {
      const userExists = await checkUserExists(username);
      if (userExists) {
        return { error: { message: "Este username já está em uso. Tente outro." } };
      }

      // Create fake email from username with valid domain
      const email = `${username.toLowerCase()}@rpglife.com`;
      const password = username; // Use username as password for simplicity

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username,
            age: 25,
            race: "Lunari",
            lookingFor: "Todos",
            about: "Jogador do RPG Real Life Virtual"
          }
        }
      });

      if (error) {
        console.error('Erro no signup:', error);
        return { error };
      }

      console.log('Resultado do signup:', data);

      // Se o usuário foi criado mas não está confirmado, confirmar automaticamente
      if (data.user && !data.session) {
        console.log('Usuário criado mas não confirmado. Confirmando automaticamente...');
        
        try {
          // Chamar edge function para confirmar o usuário
          const { data: fnData, error: fnError } = await supabase.functions.invoke('auto-confirm-user', {
            body: { email }
          });

          if (!fnError) {
            console.log('Usuário confirmado automaticamente. Fazendo login...');
            
            // Tentar fazer login após confirmação
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (loginError) {
              console.log('Erro no login após confirmação:', loginError);
              return { error: { message: "Conta criada! Tente fazer login em alguns segundos." } };
            }
          } else {
            console.log('Falha ao confirmar usuário automaticamente', fnError);
            return { error: { message: "Conta criada! Tente fazer login em alguns segundos." } };
          }
        } catch (confirmError) {
          console.log('Erro ao confirmar usuário:', confirmError);
          return { error: { message: "Conta criada! Tente fazer login em alguns segundos." } };
        }
      }

      return {};
    } catch (error) {
      console.error('Erro no registro:', error);
      return { error };
    }
  };

  const signIn = async (username: string) => {
    if (!validateUsername(username)) {
      return { error: { message: "O username deve terminar com exatamente 4 dígitos (ex: Lucas1415)" } };
    }

    try {
      // Clean up any stale auth state to avoid limbo
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
      try { await supabase.auth.signOut({ scope: 'global' } as any); } catch {}

      const email = `${username.toLowerCase()}@rpglife.com`;
      const password = username;

      console.log('Tentando login com:', { email });

      // Tentar login diretamente (não bloqueie por inexistência prévia no banco)
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Resultado do login:', { data, error });

      // Se o email não estiver confirmado, tenta confirmar automaticamente e refazer o login
      if (error) {
        const msg = String((error as any)?.message || '').toLowerCase();
        const needsConfirm = ((error as any)?.code === 'email_not_confirmed')
          || msg.includes('email not confirmed')
          || msg.includes('não confirmado')
          || msg.includes('nao confirmado')
          || msg.includes('unconfirmed')
          || msg.includes('confirme')
          || msg.includes('confirmar');

        if (needsConfirm) {
          console.log('Email possivelmente não confirmado. Tentando confirmar automaticamente...');
          const { error: fnError } = await supabase.functions.invoke('auto-confirm-user', {
            body: { email }
          });

          if (!fnError) {
            const retry = await supabase.auth.signInWithPassword({ email, password });
            data = retry.data;
            error = retry.error;
            console.log('Resultado do login (após confirmação):', { data, error });
          } else {
            console.error('Falha ao confirmar automaticamente:', fnError);
          }
        }
      }

      if (error) {
        console.error('Erro de login:', error);
        return { error };
      }

      // Garante que exista um registro correspondente na tabela public.users
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (!existing) {
          const authUser = data?.user;
          await supabase.from('users').insert({
            auth_user_id: authUser?.id,
            username,
            email,
            age: 25,
            race: 'Lunari',
            looking_for: 'Todos',
            about: 'Jogador do RPG Real Life Virtual',
            wallet_balance: 2000.00,
            life_percentage: 100.00,
            hunger_percentage: 100.00,
            happiness_percentage: 100.00,
            energy_percentage: 100.00,
            mood: 100.00,
            alcoholism_percentage: 0.00,
            disease_percentage: 0.00,
            relationship_status: 'single',
            user_code: username.slice(-4), // Extract last 4 digits
          } as any);
          console.log('Criado registro em public.users para', username);
        }
      } catch (ensureErr) {
        console.warn('Falha ao garantir registro em public.users:', ensureErr);
      }

      return {};
    } catch (error) {
      console.error('Erro no login:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear user session but preserve saved profiles
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userDiseases');
      // Note: We intentionally keep 'savedProfiles' for quick login
      
      // Clear all Supabase auth tokens and sessions
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      try {
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
      
      // Force clear the React state immediately
      setSession(null);
      setUser(null);
      
      // Try to sign out from Supabase but don't let errors block logout
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (supabaseError) {
        console.log('Supabase signOut failed, but local logout successful:', supabaseError);
      }
      
      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Erro no logout:', error);
      // Even if everything fails, force clear local state but preserve saved profiles
      const savedProfiles = localStorage.getItem('savedProfiles');
      localStorage.clear();
      if (savedProfiles) {
        localStorage.setItem('savedProfiles', savedProfiles);
      }
      sessionStorage.clear();
      setSession(null);
      setUser(null);
      
      // Force reload as last resort
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}