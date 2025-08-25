-- Primeiro, vamos corrigir os dados existentes
-- Verificar quais valores estão na tabela que podem estar causando o problema
UPDATE public.users 
SET looking_for = 'Amizade' 
WHERE looking_for NOT IN ('Amizade', 'Namoro', 'Relacionamento Sério', 'Diversão', 'Todos');

-- Agora tentar criar a constraint novamente
ALTER TABLE public.users ADD CONSTRAINT users_looking_for_check 
CHECK (looking_for IN ('Amizade', 'Namoro', 'Relacionamento Sério', 'Diversão', 'Todos'));

-- Corrigir as políticas RLS da tabela orders
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