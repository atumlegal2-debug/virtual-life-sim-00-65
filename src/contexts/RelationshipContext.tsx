import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StoreItem } from "@/data/stores";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RelationshipProposal {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  ring: StoreItem;
  createdAt: Date;
  type: 'dating' | 'engagement' | 'marriage';
}

interface UserRelationship {
  id: string;
  partnerId: string;
  partnerUsername: string;
  type: 'dating' | 'engagement' | 'marriage';
  startDate: Date;
}

interface RelationshipContextType {
  proposals: RelationshipProposal[];
  currentRelationship: UserRelationship | null;
  sendProposal: (toUserId: string, toUsername: string, ring: StoreItem) => Promise<void>;
  acceptProposal: (proposal: RelationshipProposal) => void;
  rejectProposal: (proposal: RelationshipProposal) => void;
  getProposalsForUser: (userId: string) => RelationshipProposal[];
  markProposalsAsViewed: (userId: string) => void;
  endRelationship: () => Promise<void>;
  upgradeRelationship: (newType: 'engagement' | 'marriage', ring: StoreItem) => Promise<void>;
  refreshData: () => Promise<void>;
}

const RelationshipContext = createContext<RelationshipContextType | undefined>(undefined);

export function RelationshipProvider({ children }: { children: ReactNode }) {
  const [proposals, setProposals] = useState<RelationshipProposal[]>([]);
  const [currentRelationship, setCurrentRelationship] = useState<UserRelationship | null>(null);
  const { toast } = useToast();

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    return username.replace(/\d{4}$/, '');
  };

  const refreshData = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      await loadRelationships();
      await fetchProposals();
    }
  };

  const loadRelationships = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
      .or(`user1_username.eq.${getDisplayName(currentUser)},user2_username.eq.${getDisplayName(currentUser)}`);

      if (error) {
        console.error('Error loading relationships:', error);
        return;
      }

      if (data && data.length > 0) {
        const relationship = data[0];
        const isUser1 = relationship.user1_username === getDisplayName(currentUser);
        
        const partnerUsername = isUser1 ? relationship.user2_username : relationship.user1_username;
        const partnerId = isUser1 ? relationship.user2_id : relationship.user1_id;
        
        const userRelationship: UserRelationship = {
          id: relationship.id,
          partnerId: partnerId,
          partnerUsername: partnerUsername,
          type: relationship.relationship_type as 'dating' | 'engagement' | 'marriage',
          startDate: new Date(relationship.started_at)
        };
        
        setCurrentRelationship(userRelationship);
        localStorage.setItem('currentRelationship', JSON.stringify(userRelationship));
      } else {
        // No relationship found, clear local storage
        setCurrentRelationship(null);
        localStorage.removeItem('currentRelationship');
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const fetchProposals = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    try {
      // Get current user's proposals from Supabase
      const { data, error } = await supabase
        .from('proposal_requests')
        .select('*')
        .eq('to_username', getDisplayName(currentUser))
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching proposals:', error);
        return;
      }

      // Convert Supabase proposals to our format
      const supabaseProposals: RelationshipProposal[] = (data || []).map(p => ({
        id: p.id,
        fromUserId: p.from_username + (p.from_username.length === 4 ? '' : '1234'), // Add suffix if needed
        fromUsername: p.from_username,
        toUserId: currentUser,
        ring: p.ring_data as unknown as StoreItem,
        createdAt: new Date(p.created_at),
        type: p.proposal_type as 'dating' | 'engagement' | 'marriage'
      }));

      setProposals(supabaseProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const sendProposal = async (toUserId: string, toUsername: string, ring: StoreItem) => {
    const fromUser = localStorage.getItem('currentUser');
    if (!fromUser) return;
    
    const fromUsername = getDisplayName(fromUser) || 'Unknown';
    const displayToUsername = getDisplayName(toUserId);
    
    try {
      // Get sender's user record
      const { data: fromUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('username', fromUser)
        .single();
      
      // Get receiver's user record
      const { data: toUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('username', toUserId)
        .single();
      
      if (!fromUserRecord || !toUserRecord) {
        console.error('Could not find user records');
        return;
      }
      
      // Store proposal in Supabase
      const { error } = await supabase
        .from('proposal_requests')
        .insert({
          from_user_id: fromUserRecord.id,
          from_username: fromUsername,
          to_user_id: toUserRecord.id,
          to_username: displayToUsername,
          ring_data: ring as any,
          proposal_type: ring.relationshipType as 'dating' | 'engagement' | 'marriage'
        });
      
      if (error) {
        console.error('Error storing proposal:', error);
        return;
      }
      
      // Also keep local copy for immediate feedback
      const newProposal: RelationshipProposal = {
        id: Date.now().toString(),
        fromUserId: fromUser,
        fromUsername,
        toUserId,
        ring,
        createdAt: new Date(),
        type: ring.relationshipType as 'dating' | 'engagement' | 'marriage'
      };
      
      const updatedProposals = [...proposals, newProposal];
      setProposals(updatedProposals);
      localStorage.setItem('relationshipProposals', JSON.stringify(updatedProposals));
      
      toast({
        title: "Proposta enviada! 💕",
        description: `Seu pedido de ${ring.relationshipType} foi enviado para ${displayToUsername}`
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a proposta",
        variant: "destructive"
      });
    }
  };

  const acceptProposal = async (proposal: RelationshipProposal) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      // Get both users' records using the correct username format
      const { data: currentUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      // Use from_username + numbers format for the sender
      const senderUsername = proposal.fromUsername + (proposal.fromUsername.length === 4 ? '' : '2809');
      const { data: fromUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('username', senderUsername)
        .single();

      if (!currentUserRecord || !fromUserRecord) {
        console.error('Could not find user records', { currentUser, senderUsername });
        toast({
          title: "Erro",
          description: "Não foi possível encontrar os usuários",
          variant: "destructive"
        });
        return;
      }

      // Update proposal status in Supabase first to mark it as processed
      const { error: proposalUpdateError } = await supabase
        .from('proposal_requests')
        .update({ 
          status: 'accepted',
          processed_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (proposalUpdateError) {
        console.error('Error updating proposal status:', proposalUpdateError);
        return;
      }

      // Create relationship record in Supabase
      const { error: relationshipError } = await supabase
        .from('relationships')
        .insert({
          user1_id: fromUserRecord.id,
          user1_username: proposal.fromUsername,
          user2_id: currentUserRecord.id,
          user2_username: getDisplayName(currentUser),
          relationship_type: proposal.type
        });

      if (relationshipError) {
        console.error('Error creating relationship:', relationshipError);
        return;
      }

      // Update both users' relationship status
      const statusMap = {
        'dating': 'dating',
        'engagement': 'engaged', 
        'marriage': 'married'
      };
      
      const status = statusMap[proposal.type];

      // Update current user
      await supabase
        .from('users')
        .update({ relationship_status: status })
        .eq('username', currentUser);

      // Update sender (use the correct username format with digits)
      const senderUsernameForUpdate = proposal.fromUsername.length === 4 ? proposal.fromUsername + '1234' : proposal.fromUsername + '0000';
      await supabase
        .from('users')
        .update({ relationship_status: status })
        .eq('username', senderUsernameForUpdate);

      // Create new relationship locally
      const newRelationship: UserRelationship = {
        id: Date.now().toString(),
        partnerId: proposal.fromUserId,
        partnerUsername: proposal.fromUsername,
        type: proposal.type,
        startDate: new Date()
      };

      setCurrentRelationship(newRelationship);
      localStorage.setItem('currentRelationship', JSON.stringify(newRelationship));

      // Remove proposal from local state immediately for instant UI feedback
      const updatedProposals = proposals.filter(p => p.id !== proposal.id);
      setProposals(updatedProposals);
      
      // Refresh proposals from database to ensure sync (this will show only pending ones)
      fetchProposals();

      toast({
        title: "Proposta aceita! 💕",
        description: `Agora vocês estão ${proposal.type === 'dating' ? 'namorando' : proposal.type === 'engagement' ? 'noivos' : 'casados'}!`
      });
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a proposta",
        variant: "destructive"
      });
    }
  };

  const rejectProposal = async (proposal: RelationshipProposal) => {
    try {
      // Update proposal status in Supabase
      const { error } = await supabase
        .from('proposal_requests')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) {
        console.error('Error updating proposal status:', error);
        return;
      }

      // Remove proposal from local state immediately for instant UI feedback
      const updatedProposals = proposals.filter(p => p.id !== proposal.id);
      setProposals(updatedProposals);
      
      // Refresh proposals from database to ensure sync (this will show only pending ones)
      fetchProposals();

      toast({
        title: "Proposta rejeitada",
        description: `Proposta de ${proposal.fromUsername} foi rejeitada`
      });
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a proposta",
        variant: "destructive"
      });
    }
  };

  const endRelationship = async () => {
    if (currentRelationship) {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      try {
        // Update relationship status in Supabase to ended
        const { error: relationshipError } = await supabase
          .from('relationships')
          .delete()
          .or(`user1_username.eq.${getDisplayName(currentUser)},user2_username.eq.${getDisplayName(currentUser)}`);

        if (relationshipError) {
          console.error('Error deleting relationship:', relationshipError);
        }

        // Update both users' relationship status to single
        await supabase
          .from('users')
          .update({ relationship_status: 'single' })
          .eq('username', currentUser);

        // Also update partner's status
        await supabase
          .from('users')
          .update({ relationship_status: 'single' })
          .eq('username', currentRelationship.partnerId);

        setCurrentRelationship(null);
        localStorage.removeItem('currentRelationship');

        const actionText = currentRelationship.type === 'marriage' ? 'divorciou' : 'terminou o relacionamento';
        toast({
          title: "Relacionamento terminado 💔",
          description: `Você ${actionText} com ${currentRelationship.partnerUsername}`
        });
      } catch (error) {
        console.error('Error ending relationship:', error);
        toast({
          title: "Erro",
          description: "Não foi possível terminar o relacionamento",
          variant: "destructive"
        });
      }
    }
  };

  const upgradeRelationship = async (newType: 'engagement' | 'marriage', ring: StoreItem) => {
    if (currentRelationship) {
      const updatedRelationship = {
        ...currentRelationship,
        type: newType
      };
      
      setCurrentRelationship(updatedRelationship);
      localStorage.setItem('currentRelationship', JSON.stringify(updatedRelationship));

      // Update user's relationship status in localStorage as well for World app
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUsers = registeredUsers.map((user: any) => {
          if (user.username === currentUser) {
            return {
              ...user,
              relationship_status: newType === 'engagement' ? 'engaged' : 'married'
            };
          }
          return user;
        });
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

        // Also update in Supabase
        try {
          const statusMap = {
            'engagement': 'engaged',
            'marriage': 'married'
          };
          
          await supabase
            .from('users')
            .update({ relationship_status: statusMap[newType] })
            .eq('username', currentUser);

          // Update relationship type in Supabase
          await supabase
            .from('relationships')
            .update({ relationship_type: newType })
            .or(`user1_username.eq.${getDisplayName(currentUser)},user2_username.eq.${getDisplayName(currentUser)}`);
        } catch (error) {
          console.error('Error updating relationship status in Supabase:', error);
        }
      }

      toast({
        title: "Relacionamento atualizado! 💕",
        description: `Agora vocês estão ${newType === 'engagement' ? 'noivos' : 'casados'}!`
      });
    }
  };

  const getProposalsForUser = (userId: string) => {
    return proposals.filter(p => p.toUserId === userId);
  };

  const markProposalsAsViewed = (userId: string) => {
    // This function can be used to mark proposals as viewed
    // For now, it's just a placeholder as the notification logic is handled in the HomeScreen
    console.log(`Marked proposals as viewed for user: ${userId}`);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };
    
    // Listen for storage changes and auth changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for user login through our custom event
    window.addEventListener('userLoggedIn', handleStorageChange);
    
    refreshData();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleStorageChange);
    };
  }, []);

  return (
    <RelationshipContext.Provider value={{
      proposals,
      currentRelationship,
      sendProposal,
      acceptProposal,
      rejectProposal,
      getProposalsForUser,
      markProposalsAsViewed,
      endRelationship,
      upgradeRelationship,
      refreshData
    }}>
      {children}
    </RelationshipContext.Provider>
  );
}

export function useRelationship() {
  const context = useContext(RelationshipContext);
  if (context === undefined) {
    throw new Error('useRelationship must be used within a RelationshipProvider');
  }
  return context;
}