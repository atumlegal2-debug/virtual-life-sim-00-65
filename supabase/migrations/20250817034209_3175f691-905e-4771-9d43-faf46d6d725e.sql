-- Verificar se o problema é RLS desabilitando temporariamente
-- Isso é apenas para debug - depois reativaremos com políticas corretas

-- Desabilitar RLS temporariamente na tabela users para debug
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Também verificar se existem usuários
SELECT count(*) as total_users FROM public.users;