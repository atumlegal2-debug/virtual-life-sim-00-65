import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// Types used across the app (kept broad to avoid coupling)
export type GameStats = {
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
  disease: number;
  alcoholism: number;
};

export type GameUser = {
  id: string;
  username: string;
  avatar?: string | null;
  wallet_balance?: number | null;
};

export type GameContextType = {
  // State
  currentUser: string; // username
  currentUserId: string | null;
  gameStats: GameStats;
  diseases: any[];
  inventory: any[];
  money: number; // alias of wallet_balance
  coins: number; // same as money

  // Actions (only what other components expect)
  updateStats: (partial: Partial<GameStats>) => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateMoney: (value: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<boolean>;
  addDisease: (name: string) => void;
  cureDisease: (name?: string) => void;
  cureDiseaseWithMedicine: (medicine: string) => void;
  addTemporaryEffect: (effect: any) => void;
  removeFromInventory: (itemId: string) => void;
  createPurchaseTransaction: (args: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const defaultStats: GameStats = {
  health: 100,
  hunger: 100,
  happiness: 100,
  energy: 100,
  disease: 0,
  alcoholism: 0,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState<GameUser | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>(defaultStats);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [money, setMoney] = useState<number>(2000);
  const usernameRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const coins = money; // alias

  // Load username from localStorage established by AuthContext
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored && stored !== usernameRef.current) {
      usernameRef.current = stored;
      void loadUserByUsername(stored);
    }
  }, []);

  // Helper: maps DB row -> Game state
  function applyUserRow(row: any) {
    if (!row) return;
    const user: GameUser = {
      id: row.id,
      username: row.username,
      avatar: row.avatar ?? null,
      wallet_balance: row.wallet_balance ?? 0,
    };
    setCurrentUser(user);

    const stats: GameStats = {
      health: Number(row.life_percentage ?? 100),
      hunger: Number(row.hunger_percentage ?? 100),
      happiness: Number(row.happiness_percentage ?? 100),
      energy: Number(row.energy_percentage ?? 100),
      disease: Number(row.disease_percentage ?? 0),
      alcoholism: Number(row.alcoholism_percentage ?? 0),
    };
    setGameStats(stats);

    setMoney(Number(row.wallet_balance ?? 0));
  }

  async function loadUserByUsername(username: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        applyUserRow(data);
        subscribeToUserRealtime(data.id);
      }
    } catch (e) {
      console.error("Erro ao carregar usuário por username:", e);
    }
  }

  function subscribeToUserRealtime(userId: string) {
    // Cleanup previous
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }

    const channel = supabase
      .channel("users-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` },
        (payload) => {
          const newRow: any = (payload as any).new ?? (payload as any).record;
          applyUserRow(newRow);
        }
      )
      .subscribe((status) => {
        console.log("Realtime users status:", status);
      });

    channelRef.current = channel;
  }

  const updateStats: GameContextType["updateStats"] = async (partial) => {
    if (!currentUser) return;
    const updates: any = {};
    if (partial.health !== undefined) updates.life_percentage = partial.health;
    if (partial.hunger !== undefined) updates.hunger_percentage = partial.hunger;
    if (partial.happiness !== undefined) updates.happiness_percentage = partial.happiness;
    if (partial.energy !== undefined) updates.energy_percentage = partial.energy;
    if (partial.disease !== undefined) updates.disease_percentage = partial.disease;
    if (partial.alcoholism !== undefined) updates.alcoholism_percentage = partial.alcoholism;

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", currentUser.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) applyUserRow(data);
    } catch (e) {
      console.error("Erro ao atualizar stats:", e);
    }
  };

  const refreshWallet = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (data) setMoney(Number(data.wallet_balance ?? 0));
  };

  const updateMoney = async (value: number) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ wallet_balance: value })
        .eq("id", currentUser.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) applyUserRow(data);
    } catch (e) {
      console.error("Erro ao atualizar dinheiro:", e);
    }
  };

  const addCoins = async (amount: number) => {
    await updateMoney(money + amount);
  };

  const deductCoins = async (amount: number) => {
    if (money < amount) return false;
    await updateMoney(money - amount);
    return true;
  };

  const addDisease = (name: string) => {
    setDiseases((prev) => Array.from(new Set([...(prev || []), name])));
  };

  const cureDisease = (name?: string) => {
    if (!name) setDiseases([]);
    else setDiseases((prev) => (prev || []).filter((d: any) => d !== name));
  };

  const cureDiseaseWithMedicine = (medicine: string) => {
    // Simple helper: cures all for now
    cureDisease();
  };

  const addTemporaryEffect = (_effect: any) => {
    // Stub: Effects system can be implemented later; keep API compatible
    console.log("Temporary effect added", _effect);
  };

  const removeFromInventory = (itemId: string) => {
    setInventory((prev) => (prev || []).filter((i: any) => i?.id !== itemId));
  };

  const createPurchaseTransaction = async (_args: any) => {
    // Stub for compatibility
    console.log("createPurchaseTransaction called", _args);
  };

  const refreshUser = async () => {
    if (currentUser) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (data) applyUserRow(data);
    } else if (usernameRef.current) {
      await loadUserByUsername(usernameRef.current);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const value = useMemo<GameContextType>(() => (
    {
      currentUser,
      gameStats,
      diseases,
      inventory,
      money,
      coins,
      updateStats,
      refreshWallet,
      updateMoney,
      addCoins,
      deductCoins,
      addDisease,
      cureDisease,
      cureDiseaseWithMedicine,
      addTemporaryEffect,
      removeFromInventory,
      createPurchaseTransaction,
      refreshUser,
      logout,
    }
  ), [currentUser, gameStats, diseases, inventory, money]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
