-- Desabilitar confirmação de email para permitir login imediato
-- Configurar auto-confirmação para novos usuários
UPDATE auth.config 
SET enable_signup = true, 
    enable_confirmations = false;