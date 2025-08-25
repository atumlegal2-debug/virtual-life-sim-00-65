import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePregnancy } from "@/contexts/PregnancyContext";
import { ArrowLeft, Baby, Hospital, RotateCcw, Zap } from "lucide-react";

interface PregnancyAppProps {
  onBack: () => void;
}

export function PregnancyApp({ onBack }: PregnancyAppProps) {
  const { 
    pregnancyData, 
    isPregnant, 
    canGiveBirth, 
    createPregnancy, 
    updatePregnancy, 
    sendBirthRequest,
    birthRequests,
    resetPregnancy
  } = usePregnancy();
  
  const currentPregnancyPercentage = pregnancyData?.pregnancy_percentage || 0;
  const latestRequest = birthRequests[0];
  
  // Not pregnant - show start pregnancy screen
  if (!isPregnant && currentPregnancyPercentage === 0) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-pink-900 to-purple-900">
        <div className="flex items-center justify-between p-4 bg-pink-900/90 border-b border-pink-700">
          <Button variant="ghost" onClick={onBack} className="text-pink-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-semibold text-white">App de Gravidez</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <Card className="bg-pink-800 border-pink-700">
            <CardHeader className="text-center">
              <Baby className="h-16 w-16 mx-auto text-pink-400 mb-4" />
              <CardTitle className="text-white">Iniciar Gravidez</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pink-300 text-center mb-6">
                Comece sua jornada maternal!
              </p>
              
              <Button
                onClick={createPregnancy}
                className="w-full bg-pink-600 hover:bg-pink-700 mb-3"
              >
                🤰 Iniciar Gravidez
              </Button>
              <p className="text-xs text-pink-300 text-center">
                Sistema integrado com hospital
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pregnant - show pregnancy progress screen
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-900 to-purple-900">
      <div className="flex items-center justify-between p-4 bg-pink-900/90 border-b border-pink-700">
        <Button variant="ghost" onClick={onBack} className="text-pink-300 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold text-white">Minha Gravidez</h1>
        <Button variant="ghost" onClick={resetPregnancy} className="text-pink-300 hover:text-white">
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Current Status */}
        <Card className="bg-pink-800 border-pink-700">
          <CardHeader className="text-center">
            <div className="text-6xl mb-2">🤰</div>
            <CardTitle className="text-white">Gravidez em Progresso</CardTitle>
            <Badge variant="secondary" className="bg-pink-700 text-pink-300">
              {currentPregnancyPercentage.toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-pink-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Progresso</span>
                <span className="text-pink-300">{currentPregnancyPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-pink-900 rounded-full h-3">
                <div 
                  className="bg-pink-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${currentPregnancyPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Birth Request Status */}
        {latestRequest && (
          <Card className="bg-blue-800 border-blue-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Hospital className="h-5 w-5" />
                Status do Hospital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-3 rounded-lg ${
                latestRequest.status === 'pending' 
                  ? 'bg-yellow-700' 
                  : latestRequest.status === 'accepted' 
                  ? 'bg-green-700' 
                  : 'bg-red-700'
              }`}>
                <p className="text-white font-medium">
                  Status: {latestRequest.status === 'pending' ? '⏳ Aguardando' : 
                          latestRequest.status === 'accepted' ? '✅ Aceito' : '❌ Rejeitado'}
                </p>
                {latestRequest.manager_notes && (
                  <p className="text-sm mt-1">
                    Observações: {latestRequest.manager_notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="bg-purple-800 border-purple-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canGiveBirth ? (
              <Button
                onClick={sendBirthRequest}
                disabled={latestRequest?.status === 'pending'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                <Hospital className="h-4 w-4 mr-2" />
                {latestRequest?.status === 'pending' ? 'Aguardando Hospital...' : 'Ir ao Hospital'}
              </Button>
            ) : (
              <Button
                onClick={() => updatePregnancy(Math.min(100, currentPregnancyPercentage + 10))}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Acelerar Progresso (+10%)
              </Button>
            )}
            
            {canGiveBirth && (
              <p className="text-sm text-center text-purple-300">
                💰 Ir ao hospital custa 300 CM
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pregnancy Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6 text-center">
            <Baby className="h-8 w-8 mx-auto text-pink-400 mb-3" />
            <p className="text-sm text-gray-300">
              Acompanhe sua jornada maternal
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {canGiveBirth ? 'Pronta para o parto!' : 'Aguarde o desenvolvimento do bebê'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}