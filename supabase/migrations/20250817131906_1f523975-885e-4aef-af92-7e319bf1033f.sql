-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can create user profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can delete user profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can update user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Create new policies for the custom auth system
-- Since this is a custom auth system without Supabase auth, allow public access for basic operations
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert for user creation" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for user data" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for user management" ON public.users FOR DELETE USING (true);