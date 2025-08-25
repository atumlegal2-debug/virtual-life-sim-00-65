import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GameStats {
  health: number;
  hunger: number;
  alcoholism: number;
  disease: number;
  mood: string;
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
    mood: "Sentindo-se bem"
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
      }
    } else {
      // User is not authenticated
      setCurrentUser(null);
      setUserId(null);
      setIsLoggedIn(false);
      
      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userDiseases');
    }
    
    // Load saved diseases if user is logged in
    const savedDiseases = localStorage.getItem('userDiseases');
    if (savedDiseases && isLoggedIn) {
      try {
        setDiseases(JSON.parse(savedDiseases));
      } catch (error) {
        console.error('Error loading saved diseases:', error);
      }
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
          health: profile.life_percentage || 100,
          hunger: profile.hunger_percentage || 100,
          alcoholism: profile.alcoholism_percentage || 0,
          disease: profile.disease_percentage || 0,
          mood: profile.mood?.toString() || "Sentindo-se bem"
        });
        setMoney(profile.wallet_balance || 2000);
        console.log('GameContext saldo carregado via auth ID:', profile.wallet_balance);
        
        // Load diseases from localStorage for now (using username-based storage)
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
          health: profile.life_percentage || 100,
          hunger: profile.hunger_percentage || 100,
          alcoholism: profile.alcoholism_percentage || 0,
          disease: profile.disease_percentage || 0,
          mood: profile.mood?.toString() || "Sentindo-se bem"
        });
        setMoney(profile.wallet_balance || 2000);
        console.log('GameContext saldo carregado via username:', profile.wallet_balance);
        
        // Load diseases from localStorage for now (using username-based storage)
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

  // Handle alcoholism decrease and clear expired effects
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(async () => {
      // Note: Hunger decrease is now handled by the server-side edge function
      // This ensures consistent timing and prevents double decreasing
      
      // Decrease alcoholism over time (faster decrease)
      setGameStats(prev => {
        const currentAlcoholism = prev.alcoholism || 0;
        if (currentAlcoholism > 0) {
          const newAlcoholism = Math.max(0, currentAlcoholism - 2); // Decrease by 2 every minute
          
          // Update database if user is logged in
          if (userId) {
            supabase
              .from('users')
              .update({ alcoholism_percentage: newAlcoholism })
              .eq('id', userId)
              .then(() => {
                console.log('Alcoholism decreased to:', newAlcoholism);
              });
          }
          
          return { ...prev, alcoholism: newAlcoholism };
        }
        return prev;
      });
      
      // Reset disease percentage to 0 if no diseases are active
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
      
      // Clear expired effects
      clearExpiredEffects();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isLoggedIn, userId, diseases.length, gameStats.disease]);

  const login = async (username: string) => {
    setCurrentUser(username);
    setIsLoggedIn(true);
    
    // Save to localStorage for simple persistence
    localStorage.setItem('currentUser', username);
    
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
        health: profile.life_percentage || 100,
        hunger: profile.hunger_percentage || 100,
        alcoholism: profile.alcoholism_percentage || 0,
        disease: profile.disease_percentage || 0,
        mood: profile.mood?.toString() || "Sentindo-se bem"
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
      
      // Always clear local data first
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userDiseases');
      
      // Clear friends cache for the current user
      if (currentUserToLogout) {
        localStorage.removeItem(`${currentUserToLogout}_friends_cache`);
      }
      
      setCurrentUser(null);
      setIsLoggedIn(false);
      setUserId(null);
      setDiseases([]);
      setGameStats({
        health: 100,
        hunger: 100,
        alcoholism: 0,
        disease: 0,
        mood: "Sentindo-se bem"
      });
      
      // Check if there's an active session before trying to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Only try to sign out if there's an active session
        await supabase.auth.signOut();
      }
      
    } catch (e) {
      console.error('Erro ao deslogar do Supabase:', e);
      // Even if Supabase logout fails, ensure we're logged out locally
      setIsLoggedIn(false);
      setUserId(null);
      setCurrentUser(null);
      setDiseases([]);
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

  const addDisease = async (name: string, medicine: string) => {
    // Check if disease already exists
    if (diseases.some(d => d.name === name)) return;
    
    const newDisease = { name, medicine };
    const updatedDiseases = [...diseases, newDisease];
    setDiseases(updatedDiseases);
    
    // Save diseases to localStorage for persistence
    localStorage.setItem('userDiseases', JSON.stringify(updatedDiseases));
    
    // Also save with user ID for cross-device access
    if (currentUser) {
      localStorage.setItem(`${currentUser}_diseases`, JSON.stringify(updatedDiseases));
    }
    
    // Update disease percentage in database
    if (userId && currentUser) {
      await supabase
        .from('users')
        .update({ 
          disease_percentage: Math.min(100, (gameStats.disease || 0) + 15)
        })
        .eq('id', userId);
    }
  };

  const cureDisease = async (diseaseName: string) => {
    const updatedDiseases = diseases.filter(d => d.name !== diseaseName);
    setDiseases(updatedDiseases);
    
    // If no diseases left, set disease percentage to 0, otherwise decrease by 15
    const currentHealth = gameStats.health || 100;
    const newDiseasePercent = updatedDiseases.length === 0 ? 0 : Math.max(0, (gameStats.disease || 0) - 15);
    
    await updateStats({ 
      disease: newDiseasePercent,
      health: Math.min(100, currentHealth + 15) // Restore health when cured
    });
    
    // Save updated diseases to localStorage
    localStorage.setItem('userDiseases', JSON.stringify(updatedDiseases));
    
    // Also save with user ID for cross-device access
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
      removeFromInventory
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