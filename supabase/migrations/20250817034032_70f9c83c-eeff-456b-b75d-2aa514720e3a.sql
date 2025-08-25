-- Atualizar políticas RLS para permitir criação de usuários sem autenticação Supabase
-- Já que o sistema usa autenticação customizada por username

-- Remover políticas existentes que dependem de auth.uid()
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- Criar novas políticas mais permissivas para o sistema customizado
CREATE POLICY "Anyone can create user profiles" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update user profiles" 
ON public.users 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete user profiles" 
ON public.users 
FOR DELETE 
USING (true);

-- Manter a política de visualização como está (já permite visualizar todos)
-- Policy "Users can view all profiles" já existe e está correta