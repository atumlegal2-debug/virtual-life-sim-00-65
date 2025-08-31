import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Cookie, Gift, Sparkles, Star, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FortuneAppProps {
  onBack: () => void;
}

const fortuneMessages = [
  // Frases Boas
  "A sorte não sorri para quem espera, mas para quem persegue seus objetivos com coragem.",
  "Uma grande alegria inesperada está prestes a iluminar o seu dia.",
  "Seu coração generoso e sua mente sábia guiarão você para o sucesso.",
  "Um período de grande prosperidade e abundância está chegando até você.",
  "Acredite na magia dos novos começos. Algo maravilhoso está por vir.",
  "Sua capacidade de enxergar o bom nas pessoas abrirá portas importantes.",
  "A aventura que você tanto deseja está mais perto do que imagina.",
  "Sua perseverança em um projeto recente será recompensada em breve.",
  "A harmonia que você busca em sua vida pessoal está ao seu alcance.",
  "Boas notícias de uma pessoa distante chegarão em breve.",
  
  // Frases Engraçadas
  "O homem que acabou de comer seu biscoito da sorte é muito mais gostoso.",
  "Cuidado! As calorias deste biscoito são falsas, mas a fome por outro é real.",
  "Esta frase será incrivelmente precisa. (A parte de dentro está em branco).",
  "Alguém muito charmoso está olhando para você... é o seu reflexo na tela do celular.",
  "Você terá uma longa e próspera vida... de contratempos cômicos.",
  "A resposta que você busca está em outra galáxia. Boa sorte com a viagem.",
  "Seu futuro é brilhante! Provavelmente porque você esqueceu de pagar a conta de luz.",
  "Esta noite, você será abençoado com um sono profundo... e roncados altos.",
  "Você encontrará grande felicidade em uma pequena quantia: o troco do pão.",
  "A pessoa ao seu lado está com mais fome de biscoito do que você.",
  
  // Frases Suaves (Sugestivas)
  "A única sorte que você terá hoje é uma encontro ardente.",
  "Sua noite será recompensada com muito prazer.",
  "Alguém vai te implorar por uma noite de paixão.",
  "A próxima coisa molhadinha que você encontrar será de pura diversão.",
  "Sua noite promete surpresas quentes e muito carinho.",
  "Você não precisa de estrelas para ter sorte, só de um encontro especial.",
  "A previsão é de uma noite de muito calor... humano.",
  "A sorte está ao seu lado, e a paixão à sua frente.",
  "Alguém vai te pedir para abrir seu coração... e outros segredos.",
  "Seu destino é ser amado(a) intensamente esta noite."
];

export function FortuneApp({ onBack }: FortuneAppProps) {
  const { toast } = useToast();
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [lastOpenTime, setLastOpenTime] = useState<Date | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Load last open time and message from localStorage
    const savedOpenTime = localStorage.getItem('lastFortuneOpenTime');
    const savedMessage = localStorage.getItem('currentFortuneMessage');
    if (savedOpenTime) {
      setLastOpenTime(new Date(savedOpenTime));
    }
    if (savedMessage) {
      setCurrentMessage(savedMessage);
    }
  }, []);

  useEffect(() => {
    if (lastOpenTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const lastOpenDate = new Date(lastOpenTime);
        
        // Compare dates - must be different days to allow opening
        const isSameDay = now.toDateString() === lastOpenDate.toDateString();
        
        if (isSameDay) {
          // Calculate time until next day (midnight)
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          const timeLeft = tomorrow.getTime() - now.getTime();
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilNext(`${hours}h ${minutes}m`);
        } else {
          setTimeUntilNext('');
          setLastOpenTime(null);
          setCurrentMessage(null);
          localStorage.removeItem('lastFortuneOpenTime');
          localStorage.removeItem('currentFortuneMessage');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastOpenTime]);

  const canOpen = () => {
    if (!lastOpenTime) return true;
    
    const now = new Date();
    const lastOpenDate = new Date(lastOpenTime);
    
    // Can only open if it's a different day
    return now.toDateString() !== lastOpenDate.toDateString();
  };

  const openFortuneCookie = () => {
    if (!canOpen() || isOpening) return;

    setIsOpening(true);
    
    setTimeout(() => {
      // Select random message
      const randomIndex = Math.floor(Math.random() * fortuneMessages.length);
      const selectedMessage = fortuneMessages[randomIndex];
      
      setCurrentMessage(selectedMessage);
      setIsOpening(false);
      
      // Save open time and message
      const now = new Date();
      setLastOpenTime(now);
      localStorage.setItem('lastFortuneOpenTime', now.toISOString());
      localStorage.setItem('currentFortuneMessage', selectedMessage);
      
      toast({
        title: "🥠 Biscoito aberto!",
        description: "Sua mensagem da sorte foi revelada!",
      });
    }, 2000);
  };
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
            {/* Fortune Message Display */}
            {currentMessage ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-yellow-900/80 to-orange-900/80 rounded-lg p-4 border border-yellow-600">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="text-yellow-400" size={16} />
                    <span className="text-yellow-300 text-sm font-medium">Sua Sorte</span>
                    <Sparkles className="text-yellow-400" size={16} />
                  </div>
                  <p className="text-white text-sm leading-relaxed italic">
                    "{currentMessage}"
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-1">
                  <Star className="text-yellow-400" size={12} />
                  <Gift className="text-yellow-400" size={16} />
                  <Star className="text-yellow-400" size={12} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-yellow-300">
                  <Sparkles size={16} />
                  <span className="text-sm">Descubra seu destino</span>
                  <Sparkles size={16} />
                </div>
                
                <p className="text-yellow-200 text-sm">
                  Abra seu biscoito da sorte e descubra uma mensagem especial!
                </p>
                
                <div className="flex items-center justify-center gap-1">
                  <Star className="text-yellow-400 animate-pulse" size={12} />
                  <Cookie className="text-yellow-400 animate-pulse" size={16} />
                  <Star className="text-yellow-400 animate-pulse" size={12} />
                </div>
              </div>
            )}
            
            {/* Action Button */}
            <div className="space-y-2">
              <Button
                onClick={openFortuneCookie}
                disabled={!canOpen() || isOpening}
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                size="lg"
              >
                {isOpening ? (
                  <>
                    <Cookie className="mr-2 animate-spin" size={20} />
                    Abrindo...
                  </>
                ) : !canOpen() ? (
                  <>
                    <Clock className="mr-2" size={20} />
                    Próximo biscoito em {timeUntilNext}
                  </>
                ) : (
                  <>
                    <Cookie className="mr-2" size={20} />
                    Abrir Biscoito
                  </>
                )}
              </Button>
              
              <p className="text-xs text-yellow-300">
                {canOpen() ? "Você pode abrir um biscoito por dia" : "Aguarde até amanhã para abrir outro biscoito"}
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