-- Add nickname field to users table
ALTER TABLE public.users 
ADD COLUMN nickname TEXT;