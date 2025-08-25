import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FriendshipRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  addressee_id: string;
  addressee_username?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  isOnline: boolean;
}

interface FriendshipContextType {
  friendRequests: FriendshipRequest[];
  friends: Friend[];
  sendFriendRequest: (addresseeId: string, addresseeUsername: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  areFriends: (userId: string) => boolean;
  hasPendingRequest: (userId: string) => boolean;
}

const FriendshipContext = createContext<FriendshipContextType | undefined>(undefined);

export function FriendshipProvider({ children }: { children: ReactNode }) {
  const [friendRequests, setFriendRequests] = useState<FriendshipRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const { toast } = useToast();

  const fetchFriendRequests = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Get current user's ID from users table using full username  
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      let supabaseRequests: FriendshipRequest[] = [];

      // Try to fetch from Supabase first (if user exists in DB)
      if (userData) {
        const { data: requests, error } = await supabase
          .from('friend_requests')
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            created_at,
            requester:users!friend_requests_requester_id_fkey(username)
          `)
          .eq('addressee_id', userData.id)
          .eq('status', 'pending');

        if (!error && requests) {
          supabaseRequests = requests.map(request => ({
            id: request.id,
            requester_id: request.requester_id,
            requester_username: request.requester?.username || 'Unknown',
            addressee_id: request.addressee_id,
            status: request.status as "pending" | "accepted" | "rejected",
            created_at: request.created_at
          }));
        }
      }

      // Always check localStorage for additional requests
      const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const localFriendRequests: FriendshipRequest[] = localRequests
        .filter((req: any) => {
          // Check if this request is for the current user
          const isForCurrentUser = req.addressee_username === currentUser || 
                                   (userData && req.addressee_id === userData.id);
          const isPending = req.status === 'pending';
          return isForCurrentUser && isPending;
        })
        .map((req: any) => ({
          id: req.id,
          requester_id: req.requester_id,
          requester_username: req.requester_username || 'Unknown',
          addressee_id: req.addressee_id,
          status: req.status as "pending" | "accepted" | "rejected",
          created_at: req.created_at
        }));

      // Combine Supabase and localStorage requests, removing duplicates
      const allRequests = [...supabaseRequests, ...localFriendRequests];
      const uniqueRequests = allRequests.filter((request, index, self) => 
        index === self.findIndex(r => r.id === request.id)
      );

      setFriendRequests(uniqueRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      
      // Fallback: only use localStorage
      const currentUser = localStorage.getItem('currentUser');
      const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      
      const userLocalRequests: FriendshipRequest[] = localRequests
        .filter((req: any) => 
          req.addressee_username === currentUser && req.status === 'pending'
        )
        .map((req: any) => ({
          id: req.id,
          requester_id: req.requester_id,
          requester_username: req.requester_username || 'Unknown',
          addressee_id: req.addressee_id,
          status: req.status as "pending" | "accepted" | "rejected",
          created_at: req.created_at
        }));
        
      setFriendRequests(userLocalRequests);
    }
  };

  const fetchFriends = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Get current user's ID from users table using full username
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      let supabaseFriends: Friend[] = [];

      if (userData) {
        // Fetch accepted friend requests from Supabase
        const { data: friendships, error } = await supabase
          .from('friend_requests')
          .select(`
            id,
            requester_id,
            addressee_id,
            requester:users!friend_requests_requester_id_fkey(username),
            addressee:users!friend_requests_addressee_id_fkey(username)
          `)
          .or(`requester_id.eq.${userData.id},addressee_id.eq.${userData.id}`)
          .eq('status', 'accepted');

        if (!error && friendships) {
          supabaseFriends = friendships.map(friendship => {
            const isRequester = friendship.requester_id === userData.id;
            const friendId = isRequester ? friendship.addressee_id : friendship.requester_id;
            const friendUsername = isRequester ? friendship.addressee?.username : friendship.requester?.username;
            
            return {
              id: friendId,
              username: friendUsername || 'Unknown',
              avatar_url: null,
              isOnline: Math.random() > 0.3 // Demo random status
            };
          });
        }
      }

      // Also check localStorage for accepted friendships
      const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const localFriends: Friend[] = localRequests
        .filter((req: any) => {
          const isInvolved = req.requester_username === currentUser || 
                            req.addressee_username === currentUser ||
                            (userData && (req.requester_id === userData.id || req.addressee_id === userData.id));
          const isAccepted = req.status === 'accepted';
          return isInvolved && isAccepted;
        })
        .map((req: any) => {
          const isRequester = req.requester_username === currentUser || 
                             (userData && req.requester_id === userData.id);
          const friendUsername = isRequester ? req.addressee_username : req.requester_username;
          const friendId = isRequester ? req.addressee_id : req.requester_id;
          
          return {
            id: friendId,
            username: friendUsername || 'Unknown',
            avatar_url: null,
            isOnline: Math.random() > 0.3
          };
        });

      // Combine and deduplicate friends
      const allFriends = [...supabaseFriends, ...localFriends];
      const uniqueFriends = allFriends.filter((friend, index, self) => 
        index === self.findIndex(f => f.id === friend.id || f.username === friend.username)
      );

      setFriends(uniqueFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      
      // Fallback: only use localStorage
      const currentUser = localStorage.getItem('currentUser');
      const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      
      const localFriends: Friend[] = localRequests
        .filter((req: any) => 
          (req.requester_username === currentUser || req.addressee_username === currentUser) &&
          req.status === 'accepted'
        )
        .map((req: any) => {
          const isRequester = req.requester_username === currentUser;
          const friendUsername = isRequester ? req.addressee_username : req.requester_username;
          const friendId = isRequester ? req.addressee_id : req.requester_id;
          
          return {
            id: friendId,
            username: friendUsername || 'Unknown',
            avatar_url: null,
            isOnline: Math.random() > 0.3
          };
        });
        
      setFriends(localFriends);
    }
  };

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };

  const sendFriendRequest = async (addresseeId: string, addresseeUsername: string) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Get current user's data from users table using full username
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .maybeSingle();

      if (!userData) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado no sistema",
          variant: "destructive"
        });
        return;
      }

      // Try to insert friend request into Supabase
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: userData.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        
        // Fallback to localStorage for friend requests
        const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
        
        // Check if request already exists
        const requestExists = localRequests.some((req: any) => 
          req.requester_id === userData.id && req.addressee_id === addresseeId
        );
        
        if (requestExists) {
          toast({
            title: "Pedido já enviado",
            description: `Você já enviou um pedido para ${getDisplayName(addresseeUsername)}`,
            variant: "destructive"
          });
          return;
        }
        
        // Add to localStorage
        const newRequest = {
          id: crypto.randomUUID(),
          requester_id: userData.id,
          addressee_id: addresseeId,
          status: 'pending',
          created_at: new Date().toISOString(),
          requester_username: currentUser,
          addressee_username: addresseeUsername
        };
        
        localRequests.push(newRequest);
        localStorage.setItem('friendRequests', JSON.stringify(localRequests));
        
        toast({
          title: "Pedido enviado! 👋",
          description: `Pedido de amizade enviado para ${getDisplayName(addresseeUsername)}`
        });
        
        await fetchFriendRequests();
        return;
      }

      toast({
        title: "Pedido enviado! 👋",
        description: `Pedido de amizade enviado para ${getDisplayName(addresseeUsername)}`
      });
      
      // Trigger a refresh of requests
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido de amizade",
        variant: "destructive"
      });
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Attempt Supabase update (will be ignored if no matching row)
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
    } catch (error) {
      console.error('Error accepting friend request (Supabase):', error);
    }

    // Always update localStorage mirror to ensure UI updates
    const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const updatedRequests = localRequests.map((req: any) =>
      req.id === requestId ? { ...req, status: 'accepted' } : req
    );
    localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

    await fetchFriendRequests();
    await fetchFriends();

    toast({
      title: "Amizade aceita! 🤝",
      description: "Agora vocês são amigos!"
    });
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      // Attempt Supabase update (will be ignored if no matching row)
      await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
    } catch (error) {
      console.error('Error rejecting friend request (Supabase):', error);
    }

    // Always update localStorage mirror to ensure UI updates
    const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const updatedRequests = localRequests.map((req: any) => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    );
    localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

    await fetchFriendRequests();

    toast({
      title: "Pedido recusado",
      description: "Pedido de amizade foi recusado"
    });
  };

  const areFriends = (userId: string) => {
    return friends.some(friend => friend.id === userId || friend.username === userId);
  };

  const hasPendingRequest = (userId: string) => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
    // Check in the local state for pending requests (both sent and received)
    return friendRequests.some(request => 
      request.requester_id === userId || request.addressee_id === userId ||
      request.requester_username === userId || request.addressee_username === userId
    );
  };

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  return (
    <FriendshipContext.Provider value={{
      friendRequests,
      friends,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      fetchFriendRequests,
      fetchFriends,
      areFriends,
      hasPendingRequest
    }}>
      {children}
    </FriendshipContext.Provider>
  );
}

export function useFriendship() {
  const context = useContext(FriendshipContext);
  if (context === undefined) {
    throw new Error('useFriendship must be used within a FriendshipProvider');
  }
  return context;
}