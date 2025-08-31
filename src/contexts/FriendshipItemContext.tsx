import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "./GameContext";
import { useToast } from "@/hooks/use-toast";

interface FriendshipItemRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  to_user_id: string;
  to_username: string;
  item_data: any;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  processed_at?: string;
}

interface ConnectedSoul {
  id: string;
  user1_id: string;
  user1_username: string;
  user2_id: string;
  user2_username: string;
  item_name: string;
  item_data: any;
  connected_at: string;
  user1_avatar?: string;
  user2_avatar?: string;
}

interface FriendshipItemContextType {
  friendshipRequests: FriendshipItemRequest[];
  connectedSouls: ConnectedSoul[];
  sendFriendshipItem: (toUsername: string, itemData: any) => Promise<void>;
  acceptFriendshipItem: (request: FriendshipItemRequest) => Promise<void>;
  rejectFriendshipItem: (request: FriendshipItemRequest) => Promise<void>;
  removeFriendship: (soulId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const FriendshipItemContext = createContext<FriendshipItemContextType | undefined>(undefined);

export function FriendshipItemProvider({ children }: { children: ReactNode }) {
  const [friendshipRequests, setFriendshipRequests] = useState<FriendshipItemRequest[]>([]);
  const [connectedSouls, setConnectedSouls] = useState<ConnectedSoul[]>([]);
  const { currentUser } = useGame();
  const { toast } = useToast();

  const refreshData = async () => {
    if (!currentUser) return;

    try {
      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (userError || !userData) return;

      // Fetch friendship item requests
      const { data: requests, error: requestsError } = await supabase
        .from('friendship_item_requests')
        .select('*')
        .or(`from_user_id.eq.${userData.id},to_user_id.eq.${userData.id}`)
        .order('created_at', { ascending: false });

      if (!requestsError && requests) {
        setFriendshipRequests(requests as FriendshipItemRequest[]);
      }

      // Fetch connected souls with user avatars
      const { data: souls, error: soulsError } = await supabase
        .from('connected_souls')
        .select('*')
        .or(`user1_id.eq.${userData.id},user2_id.eq.${userData.id}`)
        .order('connected_at', { ascending: false });

      if (!soulsError && souls) {
        // Get user avatars separately 
        const userIds = [...new Set(souls.flatMap(soul => [soul.user1_id, soul.user2_id]))];
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, avatar')
          .in('id', userIds);

        const soulsWithAvatars = souls.map(soul => {
          const user1Data = usersData?.find(u => u.id === soul.user1_id);
          const user2Data = usersData?.find(u => u.id === soul.user2_id);
          return {
            ...soul,
            user1_avatar: user1Data?.avatar,
            user2_avatar: user2Data?.avatar
          };
        });
        
        setConnectedSouls(soulsWithAvatars as ConnectedSoul[]);
      }
    } catch (error) {
      console.error('Error refreshing friendship item data:', error);
    }
  };

  const sendFriendshipItem = async (toUsername: string, itemData: any) => {
    if (!currentUser) return;

    try {
      // Get current user data
      const { data: fromUser, error: fromUserError } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (fromUserError || !fromUser) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Get target user data
      const { data: toUser, error: toUserError } = await supabase
        .from('users')
        .select('id')
        .eq('username', toUsername)
        .maybeSingle();

      if (toUserError || !toUser) {
        toast({
          title: "Erro",
          description: "Usuário destinatário não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Create friendship item request
      const { error: insertError } = await supabase
        .from('friendship_item_requests')
        .insert({
          from_user_id: fromUser.id,
          from_username: currentUser,
          to_user_id: toUser.id,
          to_username: toUsername,
          item_data: itemData,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error sending friendship item:', insertError);
        toast({
          title: "Erro",
          description: "Erro ao enviar item de amizade",
          variant: "destructive"
        });
        return;
      }

      // Remove item from inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('user_id', fromUser.id)
        .eq('item_id', itemData.id)
        .limit(1);

      if (inventoryError) {
        console.error('Error removing item from inventory:', inventoryError);
      }

      toast({
        title: "✨ Item de Amizade Enviado",
        description: `Você enviou ${itemData.name} para ${toUsername.replace(/\d{4}$/, '')}!`
      });

      await refreshData();
    } catch (error) {
      console.error('Error in sendFriendshipItem:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao enviar item",
        variant: "destructive"
      });
    }
  };

  const acceptFriendshipItem = async (request: FriendshipItemRequest) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friendship_item_requests')
        .update({
          status: 'accepted',
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Error accepting friendship item:', updateError);
        toast({
          title: "Erro",
          description: "Erro ao aceitar item de amizade",
          variant: "destructive"
        });
        return;
      }

      // Create connected soul entry
      const { error: soulError } = await supabase
        .from('connected_souls')
        .insert({
          user1_id: request.from_user_id,
          user1_username: request.from_username,
          user2_id: request.to_user_id,
          user2_username: request.to_username,
          item_name: request.item_data.name,
          item_data: request.item_data
        });

      if (soulError) {
        console.error('Error creating connected soul:', soulError);
      }

      toast({
        title: "💝 Item de Amizade Aceito",
        description: `Você e ${request.from_username.replace(/\d{4}$/, '')} agora são almas conectadas!`
      });

      await refreshData();
    } catch (error) {
      console.error('Error in acceptFriendshipItem:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao aceitar item",
        variant: "destructive"
      });
    }
  };

  const rejectFriendshipItem = async (request: FriendshipItemRequest) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friendship_item_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Error rejecting friendship item:', updateError);
        toast({
          title: "Erro",
          description: "Erro ao rejeitar item de amizade",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Item Rejeitado",
        description: "Item de amizade rejeitado"
      });

      await refreshData();
    } catch (error) {
      console.error('Error in rejectFriendshipItem:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao rejeitar item",
        variant: "destructive"
      });
    }
  };

  const removeFriendship = async (soulId: string) => {
    try {
      const { error } = await supabase
        .from('connected_souls')
        .delete()
        .eq('id', soulId);

      if (error) {
        console.error('Error removing friendship:', error);
        toast({
          title: "Erro",
          description: "Erro ao desfazer amizade",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "💔 Amizade Desfeita",
        description: "A amizade foi desfeita com sucesso"
      });

      await refreshData();
    } catch (error) {
      console.error('Error in removeFriendship:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao desfazer amizade",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  return (
    <FriendshipItemContext.Provider
      value={{
        friendshipRequests,
        connectedSouls,
        sendFriendshipItem,
        acceptFriendshipItem,
        rejectFriendshipItem,
        removeFriendship,
        refreshData
      }}
    >
      {children}
    </FriendshipItemContext.Provider>
  );
}

export function useFriendshipItems() {
  const context = useContext(FriendshipItemContext);
  if (!context) {
    throw new Error('useFriendshipItems must be used within a FriendshipItemProvider');
  }
  return context;
}