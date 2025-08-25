-- Limpar dados inconsistentes: usuários que existem na tabela users mas não em auth.users
DELETE FROM public.users 
WHERE auth_user_id IS NULL OR auth_user_id NOT IN (
  SELECT id FROM auth.users
);

-- Garantir que todos os usuários tenham uma ligação com auth.users
-- Atualizar a estrutura para evitar problemas futuros
ALTER TABLE public.users 
ALTER COLUMN auth_user_id SET NOT NULL;