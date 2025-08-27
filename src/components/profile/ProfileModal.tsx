import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Camera, Clock, Upload, Crop, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  relationship_status: string;
}

interface ActiveEffect {
  id: string;
  item_name: string;
  effect_message: string;
  effect_type: string;
  effect_value: number;
  expires_at: string;
  quantity: number;
}

export function ProfileModal({ isOpen, onClose, userId, username }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [nickname, setNickname] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("single");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
      fetchActiveEffects();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar || "",
          relationship_status: data.relationship_status || "single"
        });
        setAvatarUrl(data.avatar || "");
        setNickname(data.nickname || "");
        setRelationshipStatus(data.relationship_status || "single");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchActiveEffects = async () => {
    try {
      // For now, get effects from localStorage (mock implementation)
      const storedEffects = JSON.parse(localStorage.getItem('activeEffects') || '[]');
      const userEffects = storedEffects
        .filter((effect: any) => effect.userId === userId && effect.expiresAt > Date.now())
        .map((effect: any) => ({
          id: effect.id,
          item_name: effect.itemName,
          effect_message: effect.effectMessage,
          effect_type: effect.effectType,
          effect_value: effect.effectValue,
          expires_at: new Date(effect.expiresAt).toISOString(),
          quantity: effect.quantity
        }));
      
      setActiveEffects(userEffects);
    } catch (error) {
      console.error('Error fetching active effects:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      // Load image for cropping
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        setOriginalImage(img);
        setCropMode(true);
        setCropScale(1);
        setCropX(0);
        setCropY(0);
        // Add small delay to ensure canvas is ready
        setTimeout(() => {
          drawCropPreview(img, 1, 0, 0);
        }, 100);
      };
      img.onerror = (error) => {
        console.error('Error loading image:', error);
        toast({
          title: "Erro ao carregar imagem",
          description: "Não foi possível carregar a imagem selecionada.",
          variant: "destructive"
        });
      };
      img.crossOrigin = 'anonymous'; // Handle CORS issues
      img.src = URL.createObjectURL(file);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const drawCropPreview = (img: HTMLImageElement, scale: number, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200; // Canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Calculate image dimensions to fit in canvas while maintaining aspect ratio
    const imgAspect = img.width / img.height;
    let drawWidth = size * scale;
    let drawHeight = size * scale;

    if (imgAspect > 1) {
      drawHeight = drawWidth / imgAspect;
    } else {
      drawWidth = drawHeight * imgAspect;
    }

    // Center the image and apply offset
    const centerX = size / 2;
    const centerY = size / 2;
    const drawX = centerX - drawWidth / 2 + x;
    const drawY = centerY - drawHeight / 2 + y;

    // Create circular clipping path first
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw image within the circular clip
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();

    // Draw circular border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleCropConfirm = async () => {
    if (!originalImage || !canvasRef.current) return;

    setUploading(true);
    try {
      const canvas = canvasRef.current;
      
      // Create a new canvas for the final cropped image
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Could not get canvas context');

      const finalSize = 300; // Higher resolution for better quality
      finalCanvas.width = finalSize;
      finalCanvas.height = finalSize;

      // Fill with white background
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, finalSize, finalSize);

      // Calculate image dimensions
      const imgAspect = originalImage.width / originalImage.height;
      let drawWidth = finalSize * cropScale;
      let drawHeight = finalSize * cropScale;

      if (imgAspect > 1) {
        drawHeight = drawWidth / imgAspect;
      } else {
        drawWidth = drawHeight * imgAspect;
      }

      // Center and apply offset
      const centerX = finalSize / 2;
      const centerY = finalSize / 2;
      const drawX = centerX - drawWidth / 2 + cropX * (finalSize / 200);
      const drawY = centerY - drawHeight / 2 + cropY * (finalSize / 200);

      // Create circular clipping path
      finalCtx.save();
      finalCtx.beginPath();
      finalCtx.arc(centerX, centerY, finalSize / 2, 0, Math.PI * 2);
      finalCtx.clip();

      // Draw image
      finalCtx.drawImage(originalImage, drawX, drawY, drawWidth, drawHeight);
      finalCtx.restore();

      // Convert to blob with better quality
      const blob = await new Promise<Blob | null>((resolve) => {
        finalCanvas.toBlob(resolve, 'image/jpeg', 0.92);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Create file from blob
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      
      // Upload to Supabase
      const fileName = `${username}/avatar-${Date.now()}.jpg`;
      
      console.log('Uploading avatar:', fileName, file.size, 'bytes');
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      setAvatarUrl(publicUrl);
      setCropMode(false);
      setOriginalImage(null);
      
      toast({
        title: "Foto processada!",
        description: "Sua foto de perfil foi recortada e carregada com sucesso."
      });
    } catch (error) {
      console.error('Error uploading cropped avatar:', error);
      toast({
        title: "Erro no upload",
        description: `Não foi possível carregar a foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Update crop preview when sliders change
  useEffect(() => {
    if (originalImage && cropMode) {
      drawCropPreview(originalImage, cropScale, cropX, cropY);
    }
  }, [cropScale, cropX, cropY, originalImage, cropMode]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          avatar: avatarUrl,
          nickname: nickname,
          relationship_status: relationshipStatus
        })
        .eq('id', userId);

      if (error) throw error;

      // Clear nickname cache when user updates their nickname
      localStorage.removeItem(`nickname_cache_${username}`);

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!"
      });

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-xl">
                    {username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full p-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Upload size={14} />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Clique no ícone para carregar uma foto da galeria
            </p>
          </div>

          {/* Crop Mode */}
          {cropMode && originalImage && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crop size={16} />
                  Recortar Foto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-border rounded-full w-48 h-48"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Zoom</Label>
                    <Slider
                      value={[cropScale]}
                      onValueChange={(value) => setCropScale(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Horizontal</Label>
                      <Slider
                        value={[cropX]}
                        onValueChange={(value) => setCropX(value[0])}
                        min={-100}
                        max={100}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Vertical</Label>
                      <Slider
                        value={[cropY]}
                        onValueChange={(value) => setCropY(value[0])}
                        min={-100}
                        max={100}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCropMode(false);
                      setOriginalImage(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCropConfirm}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? "Processando..." : "Confirmar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nickname Input */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido (opcional)</Label>
            <Input
              id="nickname"
              placeholder="Como você gostaria de ser chamado"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Se preenchido, será exibido no lugar do seu username
            </p>
          </div>

          {/* Avatar URL Input - Only show if no image uploaded */}
          {!avatarUrl && !cropMode && (
            <div className="space-y-2">
              <Label htmlFor="avatar">URL da Foto de Perfil (opcional)</Label>
              <Input
                id="avatar"
                placeholder="https://exemplo.com/sua-foto.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          )}

          {/* Active Effects */}
          {activeEffects.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  🍺 Efeitos Ativos das Bebidas
                  <Badge variant="secondary" className="text-xs">
                    {activeEffects.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeEffects.map((effect) => (
                  <div key={effect.id} className="border border-border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{effect.item_name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {Math.max(0, Math.ceil((new Date(effect.expires_at).getTime() - Date.now()) / 60000))}min
                      </div>
                    </div>
                    <p className="text-sm text-primary italic">
                      "{effect.effect_message}"
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {effect.effect_type === "mood" && "😊"}
                        {effect.effect_type === "alcoholism" && "🍷"}
                        {effect.effect_type === "energy" && "⚡"}
                        {effect.effect_type === "health" && "💊"}
                        {effect.effect_type === "hunger" && "🍽️"}
                        +{effect.effect_value}
                      </Badge>
                      {effect.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {effect.quantity}x
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Relationship Status */}
          <div className="space-y-2">
            <Label htmlFor="relationship">Status de Relacionamento</Label>
            <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="dating">Namorando</SelectItem>
                <SelectItem value="engaged">Noivo(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widowed">Viúvo(a)</SelectItem>
                <SelectItem value="complicated">É complicado</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={saveProfile} 
              disabled={loading || cropMode} 
              className="flex-1"
            >
              {loading ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}