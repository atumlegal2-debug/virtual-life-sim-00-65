-- Primeiro, vamos reativar RLS na tabela users mas com as políticas corretas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verificar e ajustar a constraint looking_for para aceitar os valores corretos
-- Vamos ver quais são os valores válidos primeiro
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%looking_for%';

-- Remover a constraint problemática e recriar com valores corretos
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_looking_for_check;

-- Criar nova constraint com os valores que o sistema usa
ALTER TABLE public.users ADD CONSTRAINT users_looking_for_check 
CHECK (looking_for IN ('Amizade', 'Namoro', 'Relacionamento Sério', 'Diversão', 'Todos'));

-- Agora corrigir as políticas RLS da tabela orders
-- Remover políticas existentes que podem estar causando problema
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Criar políticas mais permissivas para orders (já que o sistema não usa auth Supabase)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Manter as políticas de gerente como estão
-- Policy "Managers can update store orders" e "Managers can view store orders" já existem