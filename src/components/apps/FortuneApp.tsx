import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Cookie, Gift, Sparkles, Star } from "lucide-react";

interface FortuneAppProps {
  onBack: () => void;
}

export function FortuneApp({ onBack }: FortuneAppProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-yellow-900 via-orange-900 to-amber-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-yellow-900/90 border-b border-yellow-700">
        <Button variant="ghost" onClick={onBack} className="text-yellow-300 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cookie className="text-yellow-400" size={20} />
          Biscoito da Sorte
        </h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm bg-yellow-800/80 border-yellow-600 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Cookie className="text-white" size={32} />
            </div>
            <CardTitle className="text-white text-xl">
              Biscoito da Sorte
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-yellow-300">
              <Sparkles size={16} />
              <span className="text-sm">Em Desenvolvimento</span>
              <Sparkles size={16} />
            </div>
            
            <div className="space-y-3">
              <p className="text-yellow-200 text-sm">
                Estamos preparando mensagens especiais e surpresas para você!
              </p>
              
              <div className="flex items-center justify-center gap-1">
                <Star className="text-yellow-400 animate-pulse" size={12} />
                <Gift className="text-yellow-400 animate-pulse" size={16} />
                <Star className="text-yellow-400 animate-pulse" size={12} />
              </div>
              
              <div className="bg-yellow-900/50 rounded-lg p-3 border border-yellow-700">
                <p className="text-yellow-300 text-xs italic">
                  "A sorte favorece os que aguardam..."
                </p>
              </div>
              
              <p className="text-yellow-300 text-xs">
                Em breve você poderá quebrar seus biscoitos da sorte!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-yellow-400 text-xs">
          🥠 Prepare-se para descobrir seu destino
        </p>
      </div>
    </div>
  );
}