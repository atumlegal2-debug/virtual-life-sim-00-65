import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useToast } from "@/hooks/use-toast";

interface RouletteAppProps {
  onBack: () => void;
}

interface RouletteItem {
  id: string;
  type: 'disease' | 'prize';
  name: string;
  value?: number; // For prizes
  medicine?: string; // For diseases
  description: string;
  color: string;
}

const rouletteItems: RouletteItem[] = [
  // Doenças
  { id: 'disease1', type: 'disease', name: 'Queimadura Solar Arcana', medicine: 'Protetor Solar "Luz de Sombra"', description: 'Uma queimadura mágica que causa desconforto', color: 'from-orange-500 to-red-500' },
  { id: 'disease2', type: 'disease', name: 'Gripe do Vento Gelado', medicine: 'Elixir Refrescante de Gelo', description: 'Um resfriado causado por ventos mágicos', color: 'from-blue-500 to-cyan-500' },
  { id: 'disease3', type: 'disease', name: 'Febre da Lua Cheia', medicine: 'Máscara da Luz Divina', description: 'Febre que surge com a lua cheia', color: 'from-purple-500 to-indigo-500' },
  { id: 'disease4', type: 'disease', name: 'Enjoo do Portal', medicine: 'Essência do Calmante Sereno', description: 'Náusea causada por viagens dimensionais', color: 'from-green-500 to-teal-500' },
  { id: 'disease5', type: 'disease', name: 'Virose do Pó de Fada', medicine: 'Gel Purificador do Clérigo', description: 'Vírus contraído de fadas travessas', color: 'from-pink-500 to-rose-500' },
  { id: 'disease6', type: 'disease', name: 'Dor Fantasma de Batalha', medicine: 'Pomada do Sábio Curador', description: 'Dores de batalhas antigas assombram', color: 'from-gray-500 to-slate-500' },
  { id: 'disease7', type: 'disease', name: 'Irritação de Poeira Mágica', medicine: 'Máscara da Névoa Purificadora', description: 'Alergia à poeira de encantamentos', color: 'from-yellow-500 to-amber-500' },
  { id: 'disease8', type: 'disease', name: 'Pele de Pedra', medicine: 'Pomada da Fênix', description: 'Pele endurecida por maldição', color: 'from-stone-500 to-gray-600' },
  { id: 'disease9', type: 'disease', name: 'Febre de Dragão', medicine: 'Néctar das Sereias', description: 'Febre intensa causada por respiração dracônica', color: 'from-red-600 to-orange-600' },
  
  // Prêmios
  { id: 'prize1', type: 'prize', name: '5 C\'M', value: 5, description: 'Uma pequena quantia de moedas', color: 'from-yellow-400 to-yellow-500' },
  { id: 'prize2', type: 'prize', name: '50 C\'M', value: 50, description: 'Uma boa quantia de moedas', color: 'from-yellow-500 to-yellow-600' },
  { id: 'prize3', type: 'prize', name: '300 C\'M', value: 300, description: 'Uma excelente quantia de moedas', color: 'from-yellow-600 to-amber-500' },
  { id: 'prize4', type: 'prize', name: '1.000 C\'M', value: 1000, description: 'Uma grande fortuna!', color: 'from-amber-500 to-orange-500' },
  { id: 'prize5', type: 'prize', name: '2.000 C\'M', value: 2000, description: 'Um tesouro imenso!', color: 'from-orange-500 to-red-500' },
];

export function RouletteApp({ onBack }: RouletteAppProps) {
  const { addCoins, addDisease, diseases, refreshWallet, gameStats, updateStats } = useGame();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinTime, setLastSpinTime] = useState<Date | null>(null);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<RouletteItem | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Load last spin time from localStorage
    const savedSpinTime = localStorage.getItem('lastRouletteSpinTime');
    if (savedSpinTime) {
      setLastSpinTime(new Date(savedSpinTime));
    }
  }, []);

  useEffect(() => {
    if (lastSpinTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = now.getTime() - lastSpinTime.getTime();
        const hoursLeft = 24 - (timeDiff / (1000 * 60 * 60));
        
        if (hoursLeft > 0) {
          const hours = Math.floor(hoursLeft);
          const minutes = Math.floor((hoursLeft % 1) * 60);
          setTimeUntilNextSpin(`${hours}h ${minutes}m`);
        } else {
          setTimeUntilNextSpin('');
          setLastSpinTime(null);
          localStorage.removeItem('lastRouletteSpinTime');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastSpinTime]);

  const canSpin = !lastSpinTime || timeUntilNextSpin === '';

  const spinRoulette = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    
    // Random rotation between 1440 and 2160 degrees (4-6 full rotations)
    const randomRotation = 1440 + Math.random() * 720;
    setRotation(prev => prev + randomRotation);

    // Select random item
    const randomIndex = Math.floor(Math.random() * rouletteItems.length);
    const selectedItem = rouletteItems[randomIndex];

    setTimeout(async () => {
      setSelectedItem(selectedItem);
      setIsSpinning(false);
      
      // Save spin time
      const now = new Date();
      setLastSpinTime(now);
      localStorage.setItem('lastRouletteSpinTime', now.toISOString());

      // Process result
      if (selectedItem.type === 'disease') {
        addDisease(selectedItem.name, selectedItem.medicine!);
        // Increase disease percentage and reduce health
        const currentDiseasePercent = gameStats.disease || 0;
        const currentHealth = gameStats.health || 100;
        await updateStats({ 
          disease: Math.min(100, currentDiseasePercent + 15),
          health: Math.max(0, currentHealth - 10) // Reduce health when getting sick
        });
        
        // Get the message based on the disease with emojis
        const messages = {
          'Queimadura Solar Arcana': 'Você sofre de Queimadura Solar Arcana ☀️. Compre Protetor Solar "Luz de Sombra" na farmácia para se curar.',
          'Gripe do Vento Gelado': 'Você pegou Gripe do Vento Gelado 🌬️. Use Elixir Refrescante de Gelo para se recuperar.',
          'Febre da Lua Cheia': 'Você está com Febre da Lua Cheia 🌕. Compre Máscara da Luz Divina para filtrar o ar e purificar seu corpo.',
          'Enjoo do Portal': 'Você tem Enjoo do Portal 🌀. Tome Essência do Calmante Sereno para aliviar os sintomas.',
          'Virose do Pó de Fada': 'Você contraiu Virose do Pó de Fada ✨. Lave-se com Gel Purificador do Clérigo para se curar.',
          'Dor Fantasma de Batalha': 'Você sofre de Dor Fantasma de Batalha ⚔️. Passe Pomada do Sábio Curador para melhorar.',
          'Irritação de Poeira Mágica': 'Você está com Irritação de Poeira Mágica 🌫️. Use Máscara da Névoa Purificadora para filtrar o ar e se recuperar.',
          'Pele de Pedra': 'Você desenvolveu Pele de Pedra 🪨. Passe Pomada da Fênix para restaurar a pele.',
          'Febre de Dragão': 'Você está com Febre de Dragão 🐉. Beba Néctar das Sereias para hidratar e refrescar.'
        };
        
        toast({
          title: "😷 Você contraiu uma doença!",
          description: messages[selectedItem.name as keyof typeof messages] || `${selectedItem.name}! Compre ${selectedItem.medicine} para se curar.`,
          variant: "destructive"
        });
      } else {
        await addCoins(selectedItem.value!);
        await refreshWallet(); // Refresh wallet to show updated balance
        toast({
          title: "🎉 Parabéns!",
          description: `Você ganhou ${selectedItem.value} C'M! Verifique sua carteira.`,
        });
      }
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Roleta da Sorte</h1>
      </div>

      {/* Roulette */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Zap className="text-primary" size={20} />
            Gire a Roleta
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Roulette Wheel */}
          <div className="relative mx-auto w-64 h-64">
            <div 
              className={`w-full h-full rounded-full border-4 border-primary relative overflow-hidden transition-transform duration-3000 ease-out ${isSpinning ? 'animate-spin' : ''}`}
              style={{ 
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${rouletteItems.map((item, index) => {
                  const startAngle = (index / rouletteItems.length) * 360;
                  const endAngle = ((index + 1) / rouletteItems.length) * 360;
                  return `${item.color.split(' ')[1]} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`
              }}
            >
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full border-2 border-white z-10"></div>
            </div>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary z-20"></div>
          </div>

          {/* Result Display */}
          {selectedItem && !isSpinning && (
            <div className={`bg-gradient-to-r ${selectedItem.color} text-white p-4 rounded-lg animate-pulse`}>
              <h3 className="font-bold text-lg">{selectedItem.name}</h3>
              <p className="text-sm opacity-90">{selectedItem.description}</p>
            </div>
          )}

          {/* Spin Button */}
          <div className="space-y-2">
            <Button
              onClick={spinRoulette}
              disabled={!canSpin || isSpinning}
              className="w-full h-12 text-lg font-bold"
              size="lg"
            >
              {isSpinning ? (
                <>
                  <Zap className="mr-2 animate-spin" size={20} />
                  Girando...
                </>
              ) : !canSpin ? (
                <>
                  <Clock className="mr-2" size={20} />
                  Próximo giro em {timeUntilNextSpin}
                </>
              ) : (
                <>
                  <Zap className="mr-2" size={20} />
                  Girar Roleta
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {canSpin ? "Você pode girar a roleta uma vez a cada 24 horas" : "Aguarde para girar novamente"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Diseases */}
      {diseases.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              😷 Doenças Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diseases.map((disease, index) => (
              <div key={index} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <h4 className="font-medium text-destructive">{disease.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Remédio necessário: {disease.medicine}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-gradient-card border-border/50 mt-4">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              🎰 A roleta contém doenças e prêmios em C'M
            </p>
            <p className="text-xs text-muted-foreground">
              💊 Compre remédios na loja para curar suas doenças
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}