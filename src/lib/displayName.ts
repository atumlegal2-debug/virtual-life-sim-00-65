import { supabase } from "@/integrations/supabase/client";

interface UserWithNickname {
  username: string;
  nickname?: string | null;
}

// Cache para evitar múltiplas consultas para o mesmo usuário
const nicknameCache = new Map<string, string>();

/**
 * Obtém o nome de exibição do usuário (nickname se disponível, senão username sem dígitos)
 */
export const getDisplayName = async (username: string): Promise<string> => {
  if (!username) return 'Usuário desconhecido';
  
  // Verifica cache primeiro
  if (nicknameCache.has(username)) {
    return nicknameCache.get(username)!;
  }
  
  try {
    // Busca o usuário com nickname
    const { data, error } = await supabase
      .from('users')
      .select('username, nickname')
      .eq('username', username)
      .maybeSingle();
    
    let displayName: string;
    
    if (error || !data) {
      // Fallback: remove últimos 4 dígitos do username
      displayName = username.length > 4 ? username.slice(0, -4) : username;
    } else {
      // Usa nickname se disponível, senão username sem dígitos
      displayName = data.nickname || (username.length > 4 ? username.slice(0, -4) : username);
    }
    
    // Adiciona ao cache
    nicknameCache.set(username, displayName);
    
    return displayName;
  } catch (error) {
    console.error('Error fetching user nickname:', error);
    // Fallback: remove últimos 4 dígitos do username
    const fallbackName = username.length > 4 ? username.slice(0, -4) : username;
    nicknameCache.set(username, fallbackName);
    return fallbackName;
  }
};

/**
 * Versão síncrona que só remove os dígitos (para uso quando não há async disponível)
 */
export const getDisplayNameSync = (username: string): string => {
  if (!username) return 'Usuário desconhecido';
  return username.length > 4 ? username.slice(0, -4) : username;
};

/**
 * Limpa o cache de nicknames (útil quando um usuário atualiza seu nickname)
 */
export const clearNicknameCache = (username?: string) => {
  if (username) {
    nicknameCache.delete(username);
  } else {
    nicknameCache.clear();
  }
};

/**
 * Busca múltiplos usuários com nicknames de uma vez
 */
export const getMultipleDisplayNames = async (usernames: string[]): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  const uncachedUsernames: string[] = [];
  
  // Primeiro, verifica cache
  for (const username of usernames) {
    if (nicknameCache.has(username)) {
      result[username] = nicknameCache.get(username)!;
    } else {
      uncachedUsernames.push(username);
    }
  }
  
  // Busca usuários não cached
  if (uncachedUsernames.length > 0) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, nickname')
        .in('username', uncachedUsernames);
      
      if (!error && data) {
        for (const user of data) {
          const displayName = user.nickname || (user.username.length > 4 ? user.username.slice(0, -4) : user.username);
          result[user.username] = displayName;
          nicknameCache.set(user.username, displayName);
        }
      }
      
      // Para usuários não encontrados, usa fallback
      for (const username of uncachedUsernames) {
        if (!result[username]) {
          const fallbackName = username.length > 4 ? username.slice(0, -4) : username;
          result[username] = fallbackName;
          nicknameCache.set(username, fallbackName);
        }
      }
    } catch (error) {
      console.error('Error fetching multiple nicknames:', error);
      // Fallback para todos os não cached
      for (const username of uncachedUsernames) {
        const fallbackName = username.length > 4 ? username.slice(0, -4) : username;
        result[username] = fallbackName;
        nicknameCache.set(username, fallbackName);
      }
    }
  }
  
  return result;
};