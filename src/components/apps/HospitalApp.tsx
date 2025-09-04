import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatBar } from "@/components/ui/stat-bar";
import { useGame } from "@/contexts/GameContext";
import { ArrowLeft, Heart, Thermometer, Stethoscope, Pill, Baby, Check, X, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HospitalAppProps {
  onBack: () => void;
}

interface TreatmentRequest {
  id: string;
  user_id: string;
  username: string;
  treatment_type: string;
  treatment_cost: number;
  request_message: string;
  status: "pending" | "accepted" | "rejected";
  manager_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

interface BirthRequest {
  id: string;
  user_id: string;
  username: string;
  request_message: string;
  status: "pending" | "accepted" | "rejected";
  manager_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export function HospitalApp({ onBack }: HospitalAppProps) {
  const { gameStats, updateStats, diseases, coins, deductCoins, currentUser } = useGame();
  const { toast } = useToast();
  const [hasConsultation, setHasConsultation] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [birthRequests, setBirthRequests] = useState<BirthRequest[]>([]);

  // Load birth requests when component mounts
  useEffect(() => {
    if (currentUser) {
      loadBirthRequests();
    }
  }, [currentUser]);

  // Real-time subscription for treatment approvals
  useEffect(() => {
    if (!currentUser) return;

    const setupRealtimeSubscription = async () => {
      // Get user profile to get user_id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (!profile) return;

      const channel = supabase
        .channel('treatment-approvals')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'hospital_treatment_requests',
            filter: `user_id=eq.${profile.id}`
          },
          (payload) => {
            const newRecord = payload.new as any;
            if (newRecord.status === 'accepted') {
              applyTreatmentEffect(newRecord);
            }
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtimeSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [currentUser]);

  const loadBirthRequests = async () => {
    if (!currentUser) return;

    try {
      // Get user profile to get user_id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('hospital_birth_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching birth requests:', error);
        return;
      }

      setBirthRequests(data?.map(item => ({
        ...item,
        status: item.status as "pending" | "accepted" | "rejected"
      })) || []);
    } catch (error) {
      console.error('Error loading birth requests:', error);
    }
  };

  const applyTreatmentEffect = (treatmentRecord: any) => {
    let healthIncrease = 0;
    
    // Determine health increase based on treatment type
    if (treatmentRecord.treatment_type === "Check-up Básico") {
      healthIncrease = 10;
    } else if (treatmentRecord.treatment_type === "Consulta Especializada") {
      healthIncrease = 25;
    } else if (treatmentRecord.treatment_type === "Cirurgia") {
      healthIncrease = 50;
    } else if (treatmentRecord.treatment_type.includes("Cura para")) {
      // Disease treatment also increases health
      healthIncrease = 15;
    }

    if (healthIncrease > 0) {
      // Update health in GameContext
      const newHealth = Math.min(100, gameStats.health + healthIncrease);
      updateStats({ health: newHealth });
      
      toast({
        title: "Tratamento Aplicado!",
        description: `Sua saúde aumentou em ${healthIncrease} pontos!`,
        duration: 5000,
      });
    }
  };

  const handleConsultation = async () => {
    try {
      setHasConsultation(true);
      
      toast({
        title: "Consulta realizada!",
        description: "Agora você pode escolher seus tratamentos médicos.",
      });
    } catch (error) {
      console.error('Error during consultation:', error);
      toast({
        title: "Erro",
        description: "Erro durante a consulta",
        variant: "destructive"
      });
    }
  };

  const handleTreatmentRequest = async (treatmentType: string, cost: number) => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não logado",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get user profile to get user_id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (!profile) {
        toast({
          title: "Erro",
          description: "Perfil do usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('hospital_treatment_requests')
        .insert({
          user_id: profile.id,
          username: currentUser,
          treatment_type: treatmentType,
          treatment_cost: cost,
          request_message: `Solicitação de ${treatmentType}`,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating treatment request:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a solicitação",
          variant: "destructive"
        });
        return;
      }

      setSelectedTreatment(treatmentType);
      
      toast({
        title: "Solicitação enviada!",
        description: `Sua solicitação de ${treatmentType} foi enviada aos médicos.`,
      });

      // Remove selected treatment after 3 seconds
      setTimeout(() => setSelectedTreatment(null), 3000);
    } catch (error) {
      console.error('Error creating treatment request:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiseaseTreatment = async (disease: any) => {
    const cost = 150;
    
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não logado",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get user profile to get user_id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('username', currentUser)
        .single();

      if (!profile) {
        toast({
          title: "Erro",
          description: "Perfil do usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('hospital_treatment_requests')
        .insert({
          user_id: profile.id,
          username: currentUser,
          treatment_type: `Cura para ${disease.name}`,
          treatment_cost: cost,
          request_message: `Solicitação de cura para ${disease.name} - Remédio: ${disease.medicine}`,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating disease treatment request:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a solicitação",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Solicitação enviada!",
        description: `Sua solicitação de cura para ${disease.name} foi enviada aos médicos.`,
      });
    } catch (error) {
      console.error('Error creating disease treatment request:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-red-900 to-pink-900">
      <div className="flex items-center justify-between p-4 bg-red-900/90 border-b border-red-700">
        <Button variant="ghost" onClick={onBack} className="text-red-300 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold text-white">Hospital</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Current Health Status */}
        <Card className="bg-red-800 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Heart className="h-5 w-5" />
              Estado de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatBar
              label="Saúde"
              value={gameStats.health}
              maxValue={100}
              color="health"
            />
            <div className="flex justify-between text-sm">
              <span className="text-red-300">Dinheiro disponível:</span>
              <span className="text-white font-medium">{coins.toLocaleString()} C'M</span>
            </div>
          </CardContent>
        </Card>

        {/* Birth Requests Section */}
        {birthRequests.length > 0 && (
          <Card className="bg-pink-800 border-pink-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Solicitações de Parto ({birthRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {birthRequests.map((request) => (
                <div key={request.id} className="bg-pink-700 border border-pink-600 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white text-sm">
                      Solicitação #{request.id.slice(0, 8)}
                    </h4>
                    <Badge 
                      variant={
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'accepted' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {request.status === 'pending' && (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando
                        </>
                      )}
                      {request.status === 'accepted' && (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Aprovado
                        </>
                      )}
                      {request.status === 'rejected' && (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Rejeitado
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-pink-300 mb-2">
                    {request.request_message}
                  </p>
                  {request.manager_notes && (
                    <div className="bg-pink-600 rounded p-2 mt-2">
                      <p className="text-xs text-pink-200">
                        <strong>Observações médicas:</strong> {request.manager_notes}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-pink-400 mt-2">
                    Enviado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                  </p>
                  {request.processed_at && (
                    <p className="text-xs text-pink-400">
                      Processado em: {new Date(request.processed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Consultation Step */}
        {!hasConsultation ? (
          <Card className="bg-blue-800 border-blue-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Consulta Médica
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-blue-300">
                Para acessar os tratamentos, você precisa primeiro fazer uma consulta médica.
              </p>
              <Button
                onClick={handleConsultation}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Heart className="h-4 w-4 mr-2" />
                Fazer Consulta Gratuita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Treatment Options (only after consultation) */}
            <Card className="bg-blue-800 border-blue-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Tratamentos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleTreatmentRequest("Check-up Básico", 50)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  variant={selectedTreatment === "Check-up Básico" ? "default" : "outline"}
                >
                  <Thermometer className="h-4 w-4 mr-2" />
                  Solicitar Check-up Básico - 50 C'M (+10 Saúde)
                </Button>
                
                <Button
                  onClick={() => handleTreatmentRequest("Consulta Especializada", 100)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  variant={selectedTreatment === "Consulta Especializada" ? "default" : "outline"}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Solicitar Consulta Especializada - 100 C'M (+25 Saúde)
                </Button>
                
                <Button
                  onClick={() => handleTreatmentRequest("Cirurgia", 300)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  variant={selectedTreatment === "Cirurgia" ? "default" : "outline"}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Solicitar Cirurgia - 300 C'M (+50 Saúde)
                </Button>
                
                <p className="text-xs text-blue-300 text-center mt-2">
                  As solicitações serão enviadas aos médicos para aprovação
                </p>
              </CardContent>
            </Card>

            {/* Disease Treatment (only after consultation) */}
            {diseases.length > 0 && (
              <Card className="bg-yellow-800 border-yellow-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Doenças Ativas ({diseases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diseases.map((disease, index) => (
                    <div key={index} className="bg-yellow-700 border border-yellow-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-white">{disease.name}</h4>
                        <Badge variant="destructive" className="text-xs">
                          Doente
                        </Badge>
                      </div>
                      <p className="text-sm text-yellow-300 mb-3">
                        Remédio necessário: {disease.medicine}
                      </p>
                      <Button
                        onClick={() => handleDiseaseTreatment(disease)}
                        disabled={isLoading}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                      >
                        <Pill className="h-4 w-4 mr-2" />
                        Solicitar Cura - 150 C'M
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Hospital Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6 text-center">
            <Heart className="h-8 w-8 mx-auto text-red-400 mb-3" />
            <p className="text-sm text-gray-300">
              Hospital Municipal - Atendimento 24h
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cuidando da sua saúde com qualidade
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}