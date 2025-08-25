-- Remove foreign key constraint that references auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

-- Make auth_user_id nullable since we're not using real Supabase auth
ALTER TABLE public.users ALTER COLUMN auth_user_id DROP NOT NULL;