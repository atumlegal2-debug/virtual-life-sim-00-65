import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Baby, Heart, Sparkles } from "lucide-react";

interface MeyBabyAppProps {
  onBack: () => void;
}

export function MeyBabyApp({ onBack }: MeyBabyAppProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-900 via-purple-900 to-pink-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-pink-900/90 border-b border-pink-700">
        <Button variant="ghost" onClick={onBack} className="text-pink-300 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Baby className="text-pink-400" size={20} />
          Mey Baby
        </h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm bg-pink-800/80 border-pink-600 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <Baby className="text-white" size={32} />
            </div>
            <CardTitle className="text-white text-xl">
              Mey Baby
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-pink-300">
              <Sparkles size={16} />
              <span className="text-sm">Em Desenvolvimento</span>
              <Sparkles size={16} />
            </div>
            
            <div className="space-y-3">
              <p className="text-pink-200 text-sm">
                Este app está sendo criado com muito carinho para oferecer uma experiência única.
              </p>
              
              <div className="flex items-center justify-center gap-1">
                <Heart className="text-pink-400 animate-pulse" size={12} />
                <Heart className="text-pink-400 animate-pulse" size={14} />
                <Heart className="text-pink-400 animate-pulse" size={16} />
                <Heart className="text-pink-400 animate-pulse" size={14} />
                <Heart className="text-pink-400 animate-pulse" size={12} />
              </div>
              
              <p className="text-pink-300 text-xs">
                Em breve estará disponível!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-pink-400 text-xs">
          💝 Aguarde as novidades que estão por vir
        </p>
      </div>
    </div>
  );
}