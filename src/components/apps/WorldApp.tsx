import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Heart, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useFriendship } from "@/contexts/FriendshipContext";
import { useRelationship } from "@/contexts/RelationshipContext";
import { supabase } from "@/integrations/supabase/client";
import { FriendRequestsModal } from "@/components/modals/FriendRequestsModal";
import { UserProfileModal } from "@/components/modals/UserProfileModal";

interface WorldAppProps {
  onBack: () => void;
}

interface User {
  id: string;
  username: string;
  avatar_url?: string;
  mood: string;
  relationship_status: string;
  isOnline: boolean;
}

export function WorldApp({ onBack }: WorldAppProps) {
  const { currentUser } = useGame();
  const { friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, areFriends, hasPendingRequest } = useFriendship();
  const { currentRelationship } = useRelationship();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [friendRequestsModalOpen, setFriendRequestsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);

  // Listen for status changes to update users' online status
  useEffect(() => {
    const handleStatusChange = () => {
      fetchUsers(); // Refresh users to get updated status
    };

    window.addEventListener('statusChanged', handleStatusChange);
    return () => {
      window.removeEventListener('statusChanged', handleStatusChange);
    };
  }, []);

  // Function to hide the 4-digit code from usernames for display
  const getDisplayName = (username: string) => {
    // Remove the last 4 digits if they exist
    return username.replace(/\d{4}$/, '');
  };

  useEffect(() => {
    fetchUsers();
    // Simulate friendship between wonho1234 and wonho1235
    simulateDefaultFriendship();
  }, []);

  const simulateDefaultFriendship = () => {
    const existingRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    
    // Check if friendship already exists
    const friendshipExists = existingRequests.some((req: any) => 
      ((req.requester_id === 'wonho1234' && req.addressee_id === 'wonho1235') ||
       (req.requester_id === 'wonho1235' && req.addressee_id === 'wonho1234')) &&
      req.status === 'accepted'
    );

    if (!friendshipExists) {
      const friendshipRequest = {
        id: crypto.randomUUID(),
        requester_id: 'wonho1234',
        addressee_id: 'wonho1235',
        status: 'accepted',
        created_at: new Date().toISOString(),
        requester_username: 'wonho1234',
        addressee_username: 'wonho1235'
      };
      
      existingRequests.push(friendshipRequest);
      localStorage.setItem('friendRequests', JSON.stringify(existingRequests));
      
      // Force refresh of friends for both users by clearing their cached friends
      localStorage.removeItem('wonho1234_friends');
      localStorage.removeItem('wonho1235_friends');
    }
  };

  const fetchUsers = async () => {
    try {
      // Get users from Supabase only
      
      // Get users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
      }

      // Use only Supabase users with relationship status
      const allUsers = (data || []).map(profile => {
        const onlineStatus = localStorage.getItem(`${profile.username}_onlineStatus`);
        return {
          id: profile.id,
          username: profile.username,
          age: profile.age,
          race: profile.race,
          about: profile.about,
          avatar_url: profile.avatar,
          looking_for: profile.looking_for,
          mood: profile.mood ? profile.mood.toString() : "normal",
          relationship_status: profile.relationship_status || 'single', // Use Supabase status
          isOnline: onlineStatus === 'true' || (onlineStatus === null && Math.random() > 0.3)
        };
      });

      // Filter out current user
      const filteredUsers = allUsers.filter(user => user.username !== currentUser);

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddFriend = async (user: User) => {
    console.log("handleAddFriend called for user:", user);
    console.log("currentUser:", currentUser);
    
    if (currentUser && user.username !== currentUser) {
      // Check if this is responding to a pending request
      const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const pendingRequest = localRequests.find((req: any) => 
        req.requester_username === user.username && 
        req.addressee_username === currentUser &&
        req.status === 'pending'
      );
      
      if (pendingRequest) {
        // This is responding to a pending request, show modal instead
        setSelectedUser(user);
        return;
      }
      
      console.log("Sending friend request...");
      await sendFriendRequest(user.id, user.username);
    } else {
      console.log("Friend request not sent - currentUser:", currentUser, "user.username:", user.username);
    }
  };

  const getButtonState = (user: User) => {
    if (!currentUser || user.username === currentUser) {
      return { text: "Você", disabled: true, variant: "outline" as const };
    }
    
    if (areFriends(user.username)) {
      return { text: "✓ Amigos", disabled: true, variant: "outline" as const };
    }
    
    // Check for pending friend requests
    const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const pendingRequest = localRequests.find((req: any) => 
      ((req.requester_username === currentUser && req.addressee_username === user.username) ||
       (req.requester_username === user.username && req.addressee_username === currentUser)) &&
      req.status === 'pending'
    );
    
    if (pendingRequest) {
      if (pendingRequest.requester_username === currentUser) {
        return { text: "Pedido enviado - Aguarde", disabled: true, variant: "outline" as const };
      } else {
        return { text: "Responder pedido", disabled: false, variant: "secondary" as const };
      }
    }
    
    return { text: "Adicionar Amigo", disabled: false, variant: "default" as const };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "single":
      case "solteiro":
      case "solteira":
      case "solteiro(a)":
        return "bg-muted";
      case "dating":
      case "namorando":
        return "bg-love";
      case "engaged":
      case "noiva":
      case "noivo":
      case "noivo(a)":
        return "bg-warning";
      case "married":
      case "casada":
      case "casado":
      case "casado(a)":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const handleUserClick = (user: User) => {
    setProfileModalUser(user);
    setProfileModalOpen(true);
  };

  if (selectedUser) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Perfil</h1>
        </div>

        {/* User Profile */}
        <Card className="bg-gradient-card border-border/50 mb-6">
          <CardContent className="pt-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary/20">
              {selectedUser.avatar_url ? (
                <AvatarImage src={selectedUser.avatar_url} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-xl">
                  {getDisplayName(selectedUser.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {getDisplayName(selectedUser.username)}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${selectedUser.isOnline ? 'bg-success' : 'bg-muted'}`} />
              <span className="text-sm text-muted-foreground">
                {selectedUser.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <Badge className={`${getStatusColor(selectedUser.relationship_status)} text-white mb-4`}>
              {selectedUser.relationship_status}
            </Badge>

            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Status Atual</p>
              <p className="text-foreground font-medium">
                💭 {selectedUser.mood}
              </p>
            </div>

            <div className="space-y-2">
              {(() => {
                const buttonState = getButtonState(selectedUser);
                return (
                  <Button 
                    onClick={() => handleAddFriend(selectedUser)}
                    className="w-full"
                    disabled={buttonState.disabled}
                    variant={buttonState.variant}
                  >
                    <UserPlus size={16} className="mr-2" />
                    {buttonState.text}
                  </Button>
                );
              })()}
              
              {areFriends(selectedUser.username) && (
                <Button variant="outline" className="w-full">
                  <Heart size={16} className="mr-2" />
                  Amigos desde hoje
                </Button>
              )}
              
              {(() => {
                const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
                const pendingRequest = localRequests.find((req: any) => 
                  req.requester_username === selectedUser.username && 
                  req.addressee_username === currentUser &&
                  req.status === 'pending'
                );
                
                if (pendingRequest) {
                  return (
                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          await acceptFriendRequest(pendingRequest.id);
                          setSelectedUser(null);
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        ✓ Aceitar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          await rejectFriendRequest(pendingRequest.id);
                          setSelectedUser(null);
                        }}
                        className="flex-1 border-red-500/50 text-red-600 hover:bg-red-50"
                      >
                        ✗ Rejeitar
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full" disabled>
            💝 Enviar Item
          </Button>
          <Button variant="outline" className="w-full" disabled>
            💰 Enviar Dinheiro
          </Button>
          <Button variant="outline" className="w-full" disabled>
            💌 Proposta de Relacionamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Mundo</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">
            {users.length} usuários
          </Badge>
          
          {/* Friend Requests Button */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFriendRequestsModalOpen(true)}
              className={friendRequests.length > 0 ? "animate-pulse border-blue-500/50" : ""}
            >
              <Users size={16} />
            </Button>
            {friendRequests.length > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-blue-500">
                {friendRequests.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="flex-1 space-y-3">
        {users.map(user => (
          <Card 
            key={user.id}
            className="bg-gradient-card border-border/50 cursor-pointer hover:shadow-app transition-all"
            onClick={() => handleUserClick(user)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {getDisplayName(user.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${user.isOnline ? 'bg-success' : 'bg-muted'}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{getDisplayName(user.username)}</h3>
                    <Badge 
                      className={`${getStatusColor(user.relationship_status)} text-white text-xs`}
                      variant="secondary"
                    >
                      {user.relationship_status}
                    </Badge>
                    
                    {/* Friendship Status Indicators */}
                    {currentUser && user.id !== currentUser && (
                      <>
                        {areFriends(user.username) && (
                          <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                            ✓ Amigo
                          </Badge>
                        )}
                        {(() => {
                          const localRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
                          const pendingRequest = localRequests.find((req: any) => 
                            ((req.requester_username === currentUser && req.addressee_username === user.username) ||
                             (req.requester_username === user.username && req.addressee_username === currentUser)) &&
                            req.status === 'pending'
                          );
                          
                          if (pendingRequest) {
                            if (pendingRequest.requester_username === currentUser) {
                              return (
                                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600">
                                  <Clock size={10} className="mr-1" />
                                  Enviado
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600 animate-pulse">
                                  <Clock size={10} className="mr-1" />
                                  Responder
                                </Badge>
                              );
                            }
                          }
                          return null;
                        })()}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💭 {user.mood}
                  </p>
                </div>

                {user.relationship_status.toLowerCase().includes('amor') && (
                  <Heart size={16} className="text-love" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-gradient-card border-border/50 mt-4">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              🌍 Toque em qualquer usuário para ver o perfil completo
            </p>
            {friendRequests.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                👋 Você tem {friendRequests.length} pedido{friendRequests.length > 1 ? 's' : ''} de amizade pendente{friendRequests.length > 1 ? 's' : ''}!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={friendRequestsModalOpen}
        onClose={() => setFriendRequestsModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={profileModalUser?.id || ""}
        username={profileModalUser?.username || ""}
      />
    </div>
  );
}