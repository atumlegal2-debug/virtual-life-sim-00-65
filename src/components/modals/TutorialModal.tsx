import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Smartphone, Copy, Globe, User } from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="text-primary" size={24} />
            Tutorial - Como Criar Conta
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Aviso Principal */}
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/20 dark:to-amber-900/20 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Olá! Notícia Importante sobre o Amino
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                    Para criar uma conta ou fazer login, tenho uma notícia importante: o Amino não permite usar o teclado em sites externos (como Tumblr, Twitter ou qualquer outro). Ele bloqueia essa função.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soluções */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              💡 Mas não se preocupe! Você pode:
            </h3>
            
            <div className="grid gap-3">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs px-2 py-1 mt-1">1</Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={18} className="text-primary" />
                        <h4 className="font-medium">Usar um navegador externo</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Abra este site em um navegador como Chrome, Safari ou Firefox
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs px-2 py-1 mt-1">2</Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone size={18} className="text-secondary" />
                        <h4 className="font-medium">Seguir o tutorial abaixo</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Siga os passos para criar sua conta pelo celular
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Passos do Tutorial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📋 Passo a Passo:</h3>
            
            <div className="space-y-3">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Acesse pelo celular
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Copie e cole o texto necessário (já que digitar direto não é permitido)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                        Escolha um nome de usuário + 4 dígitos
                      </h4>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                        <p>Por exemplo: <code className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-xs">Jungkook1827</code></p>
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>Nome + 4 números únicos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/20 dark:to-purple-900/20 dark:border-purple-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                        Cole as informações e pronto!
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Sua conta estará criada e você já poderá participar do RPG
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Botão para fechar */}
          <div className="pt-4 border-t border-border/30">
            <Button 
              onClick={onClose} 
              className="w-full bg-gradient-primary hover:opacity-90 text-white"
            >
              Entendi, vamos começar!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}