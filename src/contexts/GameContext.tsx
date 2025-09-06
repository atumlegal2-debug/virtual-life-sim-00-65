import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GameStats {
  health: number;
  hunger: number;
  alcoholism: number;
  disease: number;
  mood: string;
  happiness: number;
  energy: number;
}

interface TemporaryEffect {
  id: string;
  message: string;
  duration: number; // in minutes
  expiresAt: number; // timestamp
  type: "icecream" | "bar" | "pizzeria" | "other";
}

interface Disease {
  name: string;
  medicine: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  itemType: "food" | "drink" | "object";
  quantity: number;
  storeId: string;
  canUse: boolean;
  canSend: boolean;
  icon?: string;
  effect?: {
    type: string;
    value: number;
    message: string;
  };
}

interface GameContextType {
  currentUser: string | null;
  gameStats: GameStats;
  money: number;
  coins: number; // Alias for money for backward compatibility
  diseases: Disease[];
  temporaryEffects: TemporaryEffect[];
  inventory: InventoryItem[];
  isLoggedIn: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStats: (stats: Partial<GameStats>) => Promise<void>;
  updateMoney: (amount: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<void>;
  addDisease: (name: string, medicine: string) => Promise<void>;
  cureDisease: (diseaseName: string) => Promise<void>;
  addTemporaryEffect: (message: string, duration: number, type?: "icecream" | "bar" | "pizzeria" | "other") => Promise<void>;
  removeTemporaryEffect: (id: string) => void;
  clearExpiredEffects: () => void;
  refreshWallet: () => Promise<void>;
  checkAndFixDiseaseLevel: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  removeFromInventory: (itemId: string) => Promise<void>;
  cureDiseaseWithMedicine: (medicineName: string, userId: string) => Promise<boolean>;
  cureHungerDisease: () => Promise<void>;
  createPurchaseTransaction: (amount: number, description: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    health: 100,
    hunger: 100,
    alcoholism: 0,
    disease: 0,
    mood: "Sentindo-se bem",
    happiness: 100,
    energy: 100
  });
  const [money, setMoney] = useState(2000); // Initial wallet balance: 2,000 CM
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [temporaryEffects, setTemporaryEffects] = useState<TemporaryEffect[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth integration with user session
  useEffect(() => {
    if (user && session) {
      const username = user.user_metadata?.username;
      if (username) {
        setCurrentUser(username);
        setUserId(user.id);
        setIsLoggedIn(true);
        
        // Load user stats from database
        loadUserStats(user.id);
        
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', username);
      localStorage.setItem('currentUserId', user.id);
      
      // Dispatch custom event for relationship context refresh
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
      
      // Load diseases for this user
        const savedDiseases = localStorage.getItem(`${username}_diseases`);
        if (savedDiseases) {
          try {
            setDiseases(JSON.parse(savedDiseases));
          } catch (error) {
            console.error('Error loading saved diseases:', error);
          }
        }
      }
    } else {
      // User is not authenticated
      const currentUserToLogout = currentUser;
      setCurrentUser(null);
      setUserId(null);
      setIsLoggedIn(false);
      setDiseases([]);
      
      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      // Don't remove user-specific diseases, keep them for when user logs back in
    }
    
    // Check and fix disease percentage if no diseases but disease level > 0
    checkAndFixDiseaseLevel();
  }, [user, session]);

  const loadUserStats = async (authUserId: string) => {
    try {
      // First get the user by auth_user_id to get the correct database ID
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (profile) {
        // Update the userId to use the database ID, not the auth ID
        setUserId(profile.id);
        localStorage.setItem('currentUserId', profile.id);
        
        setGameStats({
          health: profile.life_percentage ?? 100,
          hunger: profile.hunger_percentage ?? 100,
          alcoholism: profile.alcoholism_percentage ?? 0,
          disease: profile.disease_percentage ?? 0,
          mood: profile.mood?.toString() ?? "Sentindo-se bem",
          happiness: profile.happiness_percentage ?? 100,
          energy: profile.energy_percentage ?? 100
        });
        
        console.log('🔄 Stats carregados do banco:', {
          health: profile.life_percentage,
          hunger: profile.hunger_percentage,
          happiness: profile.happiness_percentage,
          energy: profile.energy_percentage,
          alcoholism: profile.alcoholism_percentage,
          disease: profile.disease_percentage
        });
        setMoney(profile.wallet_balance || 2000);
        console.log('GameContext saldo carregado via auth ID:', profile.wallet_balance);
        
        // Load diseases from localStorage (strengthened persistence)
        const savedDiseases = localStorage.getItem(`${profile.username}_diseases`);
        if (savedDiseases) {
          try {
            setDiseases(JSON.parse(savedDiseases));
          } catch (error) {
            console.error('Error parsing user diseases:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Nova função para carregar stats por username
  const loadUserStatsByUsername = async (username: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (profile) {
        setGameStats({
          health: profile.life_percentage ?? 100,
          hunger: profile.hunger_percentage ?? 100,
          alcoholism: profile.alcoholism_percentage ?? 0,
          disease: profile.disease_percentage ?? 0,
          mood: profile.mood?.toString() ?? "Sentindo-se bem",
          happiness: profile.happiness_percentage ?? 100,
          energy: profile.energy_percentage ?? 100
        });
        
        console.log('🔄 Stats carregados do banco (username):', {
          health: profile.life_percentage,
          hunger: profile.hunger_percentage,
          happiness: profile.happiness_percentage,
          energy: profile.energy_percentage,
          alcoholism: profile.alcoholism_percentage,
          disease: profile.disease_percentage
        });
        setMoney(profile.wallet_balance || 2000);
        console.log('GameContext saldo carregado via username:', profile.wallet_balance);
        
        // Load diseases from localStorage (strengthened persistence)
        const savedDiseases = localStorage.getItem(`${username}_diseases`);
        if (savedDiseases) {
          try {
            setDiseases(JSON.parse(savedDiseases));
          } catch (error) {
            console.error('Error parsing user diseases:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user stats by username:', error);
      setMoney(2000); // Fallback to default
    }
  };

  // Handle alcoholism decrease, hunger disease check, happiness/energy decrease, and clear expired effects
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(async () => {
      // Note: Hunger decrease is now handled by the server-side edge function
      // This ensures consistent timing and prevents double decreasing

      // 1) Sincroniza fome do banco (para refletir o edge function)
      let hungerToCheck = gameStats.hunger;
      try {
        if (userId) {
          const { data: userRow } = await supabase
            .from('users')
            .select('hunger_percentage')
            .eq('id', userId)
            .single();
          if (typeof userRow?.hunger_percentage === 'number') {
            hungerToCheck = userRow.hunger_percentage;
            if (userRow.hunger_percentage !== gameStats.hunger) {
              setGameStats(prev => ({ ...prev, hunger: userRow.hunger_percentage as number }));
            }
          }
        }
      } catch (e) {
        console.warn('Falha ao sincronizar fome:', e);
      }

      // 2) Ativa automaticamente Desnutrição quando fome < 50
      if (hungerToCheck <= 49 && !diseases.some(d => d.name === "Desnutrição")) {
        console.log('Aplicando doença de fome (Desnutrição). Fome atual:', hungerToCheck);
        await addDisease("Desnutrição", "Consulta Médica");

        // Notificação na Home
        if (window.location.pathname === '/') {
          const event = new CustomEvent('showHungerAlert');
          window.dispatchEvent(event);
        }
      }
      
      // Check and fix any disease inconsistencies
      checkAndFixDiseaseLevel();

      // 3) Diminui alcoolismo ao longo do tempo
      setGameStats(prev => {
        const currentAlcoholism = prev.alcoholism || 0;
        if (currentAlcoholism > 0) {
          const newAlcoholism = Math.max(0, currentAlcoholism - 2);
          if (userId) {
            supabase
              .from('users')
              .update({ alcoholism_percentage: newAlcoholism })
              .eq('id', userId)
              .then(() => console.log('Alcoholism decreased to:', newAlcoholism));
          }
          return { ...prev, alcoholism: newAlcoholism };
        }
        return prev;
      });

      // 4) Diminui felicidade e energia a cada 20 minutos (2 pontos cada)
      const currentTime = Date.now();
      const lastHappinessDecrease = localStorage.getItem(`${currentUser}_last_happiness_decrease`);
      const lastEnergyDecrease = localStorage.getItem(`${currentUser}_last_energy_decrease`);
      
      // Check happiness decrease (every 20 minutes = 1200000ms)
      if (!lastHappinessDecrease || (currentTime - parseInt(lastHappinessDecrease)) >= 1200000) {
        setGameStats(prev => {
          const newHappiness = Math.max(0, (prev.happiness || 100) - 2);
          if (userId && newHappiness !== prev.happiness) {
            supabase
              .from('users')
              .update({ happiness_percentage: newHappiness })
              .eq('id', userId)
              .then(() => console.log('Happiness decreased to:', newHappiness));
          }
          localStorage.setItem(`${currentUser}_last_happiness_decrease`, currentTime.toString());
          return { ...prev, happiness: newHappiness };
        });
      }
      
      // Check energy decrease (every 20 minutes = 1200000ms)  
      if (!lastEnergyDecrease || (currentTime - parseInt(lastEnergyDecrease)) >= 1200000) {
        setGameStats(prev => {
          const newEnergy = Math.max(0, (prev.energy || 100) - 2);
          if (userId && newEnergy !== prev.energy) {
            supabase
              .from('users')
              .update({ energy_percentage: newEnergy })
              .eq('id', userId)
              .then(() => console.log('Energy decreased to:', newEnergy));
          }
          localStorage.setItem(`${currentUser}_last_energy_decrease`, currentTime.toString());
          return { ...prev, energy: newEnergy };
        });
      }

      // 5) Se não há doenças ativas, zera porcentagem de doença
      if (diseases.length === 0 && gameStats.disease > 0) {
        const newDiseaseLevel = 0;
        setGameStats(prev => ({ ...prev, disease: newDiseaseLevel }));
        if (userId) {
          supabase
            .from('users')
            .update({ disease_percentage: newDiseaseLevel })
            .eq('id', userId);
        }
      }

      // 6) Limpa efeitos temporários expirados
      clearExpiredEffects();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isLoggedIn, userId, diseases.length, gameStats.disease, gameStats.hunger, currentUser]);

  // Auto-cure removed: Desnutrição is only cured after hospital consultation approved by manager


  const login = async (username: string) => {
    setCurrentUser(username);
    setIsLoggedIn(true);
    
    // Save to localStorage for simple persistence
    localStorage.setItem('currentUser', username);
    
    // Dispatch custom event for relationship context refresh  
    window.dispatchEvent(new CustomEvent('userLoggedIn'));
    
    // Get user profile from database by username to get the correct database ID
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (profile) {
      // Use the database ID, not auth ID
      setUserId(profile.id);
      localStorage.setItem('currentUserId', profile.id);
      
      setGameStats({
        health: profile.life_percentage ?? 100,
        hunger: profile.hunger_percentage ?? 100,
        alcoholism: profile.alcoholism_percentage ?? 0,
        disease: profile.disease_percentage ?? 0,
        mood: profile.mood?.toString() ?? "Sentindo-se bem",
        happiness: profile.happiness_percentage ?? 100,
        energy: profile.energy_percentage ?? 100
      });
      
      console.log('🔄 Stats carregados do banco (login):', {
        health: profile.life_percentage,
        hunger: profile.hunger_percentage,
        happiness: profile.happiness_percentage,
        energy: profile.energy_percentage,
        alcoholism: profile.alcoholism_percentage,
        disease: profile.disease_percentage
      });
      setMoney(profile.wallet_balance || 2000); // Default to 2000 if null
      
      // Load diseases from localStorage (using username-based storage)
      const savedDiseases = localStorage.getItem(`${username}_diseases`);
      if (savedDiseases) {
        try {
          setDiseases(JSON.parse(savedDiseases));
        } catch (error) {
          console.error('Error parsing user diseases:', error);
        }
      }
      
      // Check and process pending money transfers
      const transfers = JSON.parse(localStorage.getItem('moneyTransfers') || '[]');
      const userTransfers = transfers.filter((t: any) => t.to === profile.id);
      if (userTransfers.length > 0) {
        const totalReceived = userTransfers.reduce((sum: number, t: any) => sum + t.amount, 0);
        if (totalReceived > 0) {
          await addCoins(totalReceived);
          console.log(`Received ${totalReceived} C'M from transfers`);
          
          // Remove processed transfers
          const remainingTransfers = transfers.filter((t: any) => t.to !== profile.id);
          localStorage.setItem('moneyTransfers', JSON.stringify(remainingTransfers));
        }
      }
      
      // Check and process pending item transfers
      const itemTransfers = JSON.parse(localStorage.getItem('itemTransfers') || '[]');
      const userItemTransfers = itemTransfers.filter((t: any) => t.to === profile.id);
      if (userItemTransfers.length > 0) {
        for (const transfer of userItemTransfers) {
          try {
            // Add item to user's inventory in database
            await supabase
              .from('inventory')
              .upsert({
                user_id: profile.id,
                item_id: transfer.item.id,
                quantity: 1,
                item_data: transfer.item
              }, {
                onConflict: 'user_id,item_id'
              });
            console.log(`Received item: ${transfer.item.name}`);
          } catch (error) {
            console.error('Error processing item transfer:', error);
            // Check if this is a limit exceeded error
            if (error.message && error.message.includes('Limite de 10 itens por tipo atingido')) {
              console.warn(`Inventory limit reached for ${transfer.item.name}`);
            }
          }
        }
        
        // Remove processed item transfers
        const remainingItemTransfers = itemTransfers.filter((t: any) => t.to !== profile.id);
        localStorage.setItem('itemTransfers', JSON.stringify(remainingItemTransfers));
      }
      
      // Load inventory after processing transfers
      await fetchInventory();
      
      // Check and fix disease level after loading profile
      setTimeout(() => checkAndFixDiseaseLevel(), 100);
      
      console.log(`User ${username} logged in successfully with all data loaded`);
    }
  };

  const logout = async () => {
    try {
      // Get current user before clearing localStorage
      const currentUserToLogout = localStorage.getItem('currentUser');
      
      // Always clear local data first (even if Supabase fails)
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userDiseases');
      
      // Clear friends cache for the current user
      if (currentUserToLogout) {
        localStorage.removeItem(`${currentUserToLogout}_friends_cache`);
      }
      
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
      
      // Clear React state immediately (but DON'T reset game stats)
      setCurrentUser(null);
      setIsLoggedIn(false);
      setUserId(null);
      setDiseases([]);
      // Game stats will be properly loaded from database on next login
      
      // Try to sign out from Supabase but don't let it block logout
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (supabaseError) {
        console.log('Supabase signOut failed, but local logout successful:', supabaseError);
      }
      
      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (e) {
      console.error('Erro ao deslogar:', e);
      // Even if everything fails, force clear all local state
      localStorage.clear();
      sessionStorage.clear();
      setIsLoggedIn(false);
      setUserId(null);
      setCurrentUser(null);
      setDiseases([]);
      
      // Force reload as last resort
      window.location.reload();
    }
  };

  const updateStats = async (stats: Partial<GameStats>) => {
    setGameStats(prev => ({ ...prev, ...stats }));
    
    // Sync with database if user is logged in
    if (userId && isLoggedIn) {
      const updateData: any = {};
      if (stats.health !== undefined) updateData.life_percentage = stats.health;
      if (stats.hunger !== undefined) updateData.hunger_percentage = stats.hunger;
      if (stats.alcoholism !== undefined) updateData.alcoholism_percentage = stats.alcoholism;
      if (stats.disease !== undefined) updateData.disease_percentage = stats.disease;
      if (stats.mood !== undefined) updateData.mood = stats.mood;
      if (stats.happiness !== undefined) updateData.happiness_percentage = stats.happiness;
      if (stats.energy !== undefined) updateData.energy_percentage = stats.energy;
      
      if (Object.keys(updateData).length > 0) {
        console.log('Syncing stats to database:', updateData);
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);
      }
    }
  };

  const updateMoney = async (amount: number) => {
    const newAmount = Math.max(0, money + amount);
    setMoney(newAmount);
    
    // Sync with database if user is logged in
    if (userId && isLoggedIn) {
      await supabase
        .from('users')
        .update({ wallet_balance: newAmount })
        .eq('id', userId);
    }
  };

  const addCoins = async (amount: number) => {
    const newAmount = money + amount;
    setMoney(newAmount);
    
    // Sync with database if user is logged in
    if (userId && isLoggedIn) {
      await supabase
        .from('users')
        .update({ wallet_balance: newAmount })
        .eq('id', userId);
    }
  };

  const deductCoins = async (amount: number) => {
    const newAmount = Math.max(0, money - amount);
    setMoney(newAmount);
    
    // Sync with database if user is logged in
    if (userId && isLoggedIn) {
      await supabase
        .from('users')
        .update({ wallet_balance: newAmount })
        .eq('id', userId);
    }
  };

  // New function to create purchase transaction record
  const createPurchaseTransaction = async (amount: number, description: string) => {
    if (!userId || !currentUser || !isLoggedIn) return;
    
    try {
      await supabase
        .from('transactions')
        .insert({
          from_user_id: userId,
          to_user_id: userId, // Self transaction for purchases
          from_username: currentUser,
          to_username: 'Sistema', // Indicate system purchase
          amount: amount,
          transaction_type: 'purchase',
          description: description
        });
    } catch (error) {
      console.error('Error creating purchase transaction:', error);
    }
  };

  const addDisease = async (name: string, medicine: string) => {
    // Check if disease already exists
    if (diseases.some(d => d.name === name)) return;
    
    const newDisease = { name, medicine };
    const updatedDiseases = [...diseases, newDisease];
    setDiseases(updatedDiseases);
    
    // Save diseases to localStorage for persistence with username-specific key
    if (currentUser) {
      localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
    }
    
    // Special handling for hunger-related disease
    if (name === "Desnutrição") {
      // Decrease health when getting hunger disease
      const currentHealth = gameStats.health || 100;
      const newHealth = Math.max(0, currentHealth - 20); // Decrease health by 20 points
      
      // Update both disease and health stats
      await updateStats({ 
        disease: Math.min(100, (gameStats.disease || 0) + 15),
        health: newHealth
      });
    } else {
      // Update disease percentage in database for other diseases
      if (userId && currentUser) {
        await supabase
          .from('users')
          .update({ 
            disease_percentage: Math.min(100, (gameStats.disease || 0) + 15)
          })
          .eq('id', userId);
      }
    }
  };

  const cureDisease = async (diseaseName: string) => {
    const updatedDiseases = diseases.filter(d => d.name !== diseaseName);
    setDiseases(updatedDiseases);
    
    // If curing hunger disease, clear the saved feeling message
    if (diseaseName === "Desnutrição" && currentUser) {
      localStorage.removeItem(`${currentUser}_hunger_disease_feeling`);
    }
    
    // If no diseases left, set disease percentage to 0, otherwise decrease by 15
    const currentHealth = gameStats.health || 100;
    const currentHunger = gameStats.hunger || 0;
    const newDiseasePercent = updatedDiseases.length === 0 ? 0 : Math.max(0, (gameStats.disease || 0) - 15);
    
    // Increase hunger by 60% after treatment
    const newHunger = Math.min(100, currentHunger + 60);
    
    await updateStats({ 
      disease: newDiseasePercent,
      health: Math.min(100, currentHealth + 25), // Restore 25 points of health when cured
      hunger: newHunger // Increase hunger by 60% after treatment
    });
    
    // Save updated diseases to localStorage with username-specific key
    if (currentUser) {
      localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
    }
    
  };

  const addTemporaryEffect = async (message: string, duration: number, type: "icecream" | "bar" | "pizzeria" | "other" = "other") => {
    const newEffect: TemporaryEffect = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      duration,
      expiresAt: Date.now() + (duration * 60000), // Convert minutes to milliseconds
      type
    };
    setTemporaryEffects(prev => [...prev, newEffect]);
    
    // Update mood to show the effect and sync with database
    if (type === "icecream" || type === "pizzeria") {
      setGameStats(prev => ({ ...prev, mood: message }));
      
      // Sync mood with database (convert to number for compatibility)
      if (userId && currentUser) {
        await supabase
          .from('users')
          .update({ mood: 8 }) // Happy mood for effects
          .eq('id', userId);
      }
    }
  };

  const removeTemporaryEffect = (id: string) => {
    setTemporaryEffects(prev => prev.filter(effect => effect.id !== id));
  };

  const clearExpiredEffects = () => {
    const now = Date.now();
    setTemporaryEffects(prev => {
      const activeEffects = prev.filter(effect => effect.expiresAt > now);
      
      // If ice cream or pizzeria effects expired, reset mood
      const expiredMoodEffects = prev.filter(effect => 
        effect.expiresAt <= now && (effect.type === "icecream" || effect.type === "pizzeria")
      );
      
      if (expiredMoodEffects.length > 0) {
        setGameStats(prevStats => ({ 
          ...prevStats, 
          mood: "Sentindo-se bem" 
        }));
        
        // Sync mood reset with database (convert to number for compatibility)
        if (userId && currentUser) {
          supabase
            .from('users')
            .update({ mood: 5 }) // Normal mood
            .eq('id', userId)
            .then(() => {
              console.log('Mood reset synced to database');
            });
        }
      }
      
      return activeEffects;
    });
  };

  // Function to check and fix disease level when no diseases are active
  const checkAndFixDiseaseLevel = async () => {
    if (diseases.length === 0 && gameStats.disease > 0) {
      console.log('Fixing disease level - no diseases but disease percentage is', gameStats.disease);
      
      // Reset disease percentage to 0
      setGameStats(prev => ({ ...prev, disease: 0 }));
      
      // Update database if user is logged in
      if (userId && currentUser) {
        await supabase
          .from('users')
          .update({ disease_percentage: 0 })
          .eq('id', userId);
        console.log('Disease percentage reset to 0 for user:', currentUser);
      }
    }
    
    // Also check if disease percentage is 0 but we have malnutrition disease in the list
    if (gameStats.disease === 0 && diseases.some(d => d.name === "Desnutrição")) {
      console.log('Fixing malnutrition disease - disease percentage is 0 but malnutrition still in list');
      const updatedDiseases = diseases.filter(d => d.name !== "Desnutrição");
      setDiseases(updatedDiseases);
      if (currentUser) {
        localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
      }
    }
  };

  // New function to cure disease with medicine
  const cureDiseaseWithMedicine = async (medicineName: string, userId: string) => {
    // Map medicine names to disease names
    const medicineToDisease: Record<string, string> = {
      "Protetor Solar \"Luz de Sombra\"": "Queimadura Solar Arcana",
      "Elixir Refrescante de Gelo": "Gripe do Vento Gelado", 
      "Máscara da Luz Divina": "Febre da Lua Cheia",
      "Essência do Calmante Sereno": "Enjoo do Portal",
      "Gel Purificador do Clérigo": "Virose do Pó de Fada",
      "Pomada do Sábio Curador": "Dor Fantasma de Batalha", 
      "Máscara da Névoa Purificadora": "Irritação de Poeira Mágica",
      "Pomada da Fênix": "Pele de Pedra",
      "Néctar das Sereias": "Febre de Dragão"
    };

    const diseaseToCure = medicineToDisease[medicineName];
    if (!diseaseToCure) return false;

    // Get user profile to get username for disease storage key
    const { data: userProfile } = await supabase
      .from('users')  
      .select('username')
      .eq('id', userId)
      .single();

    if (!userProfile) return false;

    const username = userProfile.username;
    const savedDiseases = localStorage.getItem(`${username}_diseases`);
    let userDiseases: Disease[] = [];
    
    if (savedDiseases) {
      try {
        userDiseases = JSON.parse(savedDiseases);
      } catch (error) {
        console.error('Error parsing user diseases:', error);
        return false;
      }
    }

    // Check if user has this disease
    const hasDisease = userDiseases.some(d => d.name === diseaseToCure);
    if (!hasDisease) return false;

    // Remove the disease
    const updatedDiseases = userDiseases.filter(d => d.name !== diseaseToCure);
    localStorage.setItem(`${username}_diseases`, JSON.stringify(updatedDiseases));

    // Calculate new disease percentage
    const newDiseasePercent = updatedDiseases.length === 0 ? 0 : Math.max(0, updatedDiseases.length * 15);

    // Update user health in database - restore health when cured
    const { data: currentStats } = await supabase
      .from('users')
      .select('life_percentage, disease_percentage')
      .eq('id', userId)
      .single();

    const currentHealth = currentStats?.life_percentage || 100;
    const newHealth = Math.min(100, currentHealth + 15); // Restore health when cured

    await supabase
      .from('users')
      .update({ 
        disease_percentage: newDiseasePercent,
        life_percentage: newHealth
      })
      .eq('id', userId);

    // If this is the current logged in user, update local state too
    if (currentUser === username) {
      setDiseases(updatedDiseases);
      setGameStats(prev => ({
        ...prev,
        disease: newDiseasePercent,
        health: newHealth
      }));
    }

    console.log(`Disease cured: ${diseaseToCure} with medicine: ${medicineName} for user: ${username}`);
    return true;
  };

  const fetchInventory = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching inventory:', error);
        return;
      }

      const formattedInventory: InventoryItem[] = [];
      
      // Process each inventory item
      for (const item of data || []) {
        const storeItemsData = JSON.parse(localStorage.getItem('storeItems') || '[]');
        const storeItem = storeItemsData.find((s: any) => s.id === item.item_id);
        
        if (storeItem) {
          formattedInventory.push({
            id: storeItem.id,
            name: storeItem.name,
            description: storeItem.description,
            itemType: storeItem.itemType,
            quantity: item.quantity || 1,
            storeId: storeItem.id,
            canUse: storeItem.canUse !== false,
            canSend: storeItem.canSend !== false,
            icon: storeItem.icon,
            effect: storeItem.effect
          });
        }
      }

      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const removeFromInventory = async (itemId: string) => {
    try {
      if (!userId) return;

      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      // Remove one item from inventory by decreasing quantity
      if (item.quantity <= 1) {
        await supabase
          .from('inventory')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId);
      } else {
        await supabase
          .from('inventory')
          .update({ quantity: item.quantity - 1 })
          .eq('user_id', userId)
          .eq('item_id', itemId);
      }

      fetchInventory(); // Refresh inventory
    } catch (error) {
      console.error('Error removing item from inventory:', error);
    }
  };

  const refreshWallet = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Refreshing wallet for:', currentUser);
      const { data: profile } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('username', currentUser)
        .single();

      if (profile) {
        setMoney(profile.wallet_balance || 2000);
        console.log('Wallet refreshed - new balance:', profile.wallet_balance);
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    }
  };

  // Function to cure hunger-related disease when medical consultation is accepted
  const cureHungerDisease = async () => {
    const hungerDisease = diseases.find(d => d.name === "Desnutrição");
    if (!hungerDisease) {
      console.log('No hunger disease found to cure');
      return;
    }

    console.log('Curing hunger disease through medical consultation');
    
    // Force immediate state update before calling cureDisease
    const updatedDiseases = diseases.filter(d => d.name !== "Desnutrição");
    setDiseases(updatedDiseases);
    
    // Update localStorage immediately
    if (currentUser) {
      localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
      console.log('📝 Diseases updated in localStorage:', updatedDiseases);
    }
    
    await cureDisease("Desnutrição");
    
    // Additional health boost since it's a medical treatment
    const currentHealth = gameStats.health || 100;
    const newHealth = Math.min(100, currentHealth + 10);
    
    await updateStats({ 
      health: newHealth 
    });

    // Dispatch custom event to notify all components about disease cure
    window.dispatchEvent(new CustomEvent('diseaseCured', {
      detail: { diseaseName: 'Desnutrição', remainingDiseases: updatedDiseases }
    }));

    console.log('✅ Hunger disease cured and health restored, diseases remaining:', updatedDiseases.length);
  };

  // Auto-save diseases to localStorage whenever they change
  useEffect(() => {
    if (currentUser && diseases.length >= 0) {
      localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(diseases));
    }
  }, [diseases, currentUser]);

  // Auto-save game stats to database whenever they change
  useEffect(() => {
    if (userId && isLoggedIn && currentUser) {
      const saveStatsToDatabase = async () => {
        try {
          await supabase
            .from('users')
            .update({
              life_percentage: gameStats.health,
              hunger_percentage: gameStats.hunger,
              alcoholism_percentage: gameStats.alcoholism,
              disease_percentage: gameStats.disease,
              wallet_balance: money
            })
            .eq('id', userId);
        } catch (error) {
          console.error('Error auto-saving stats:', error);
        }
      };
      
      // Debounce the save to avoid too many database calls
      const timeoutId = setTimeout(saveStatsToDatabase, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [gameStats, money, userId, isLoggedIn, currentUser]);

  // Listen for login state changes to reload friends
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      console.log('User logged in, triggering friends reload:', currentUser);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { username: currentUser } }));
      }, 100);
    }
  }, [isLoggedIn, currentUser]);

  // Realtime: listen for hospital treatment approvals for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('rt-hospital-treatments')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hospital_treatment_requests', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newRow: any = payload.new;
          if (newRow?.status === 'accepted') {
            const type = String(newRow.treatment_type || '');
            const msg = String(newRow.request_message || '');
            if (type.includes('Desnutrição') || msg.includes('Desnutrição')) {
              console.log('Realtime: tratamento aprovado para Desnutrição, curando...');
              // Force immediate cure and sync
              setGameStats(prev => ({ ...prev, disease: 0 }));
              const updatedDiseases = diseases.filter(d => d.name !== "Desnutrição");
              setDiseases(updatedDiseases);
              if (currentUser) {
                localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
              }
              cureHungerDisease();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, cureHungerDisease]);

  // Realtime: sync user stats from DB updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`rt-user-stats-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          const u: any = payload.new;
          const freshStats = {
            health: u.life_percentage ?? 100,
            hunger: u.hunger_percentage ?? 100,
            alcoholism: u.alcoholism_percentage ?? 0,
            happiness: u.happiness_percentage ?? 100,
            energy: u.energy_percentage ?? 100,
            disease: u.disease_percentage ?? 0,
          };
          setGameStats(prev => ({ ...prev, ...freshStats }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <GameContext.Provider value={{
      currentUser,
      gameStats,
      money,
      coins: money, // Alias for backward compatibility
      diseases,
      temporaryEffects,
      inventory,
      isLoggedIn,
      login,
      logout,
      updateStats,
      updateMoney,
      addCoins,
      deductCoins,
      addDisease,
      cureDisease,
      addTemporaryEffect,
      removeTemporaryEffect,
      clearExpiredEffects,
      refreshWallet,
      checkAndFixDiseaseLevel,
      fetchInventory,
      removeFromInventory,
      cureDiseaseWithMedicine,
      cureHungerDisease,
      createPurchaseTransaction,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}