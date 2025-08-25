-- Atualizar todos os usuários existentes para terem pelo menos 2000 CM de saldo inicial
UPDATE public.users 
SET wallet_balance = 2000 
WHERE wallet_balance IS NULL OR wallet_balance < 2000;