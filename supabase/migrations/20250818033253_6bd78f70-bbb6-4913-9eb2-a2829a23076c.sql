-- Ensure users table has proper relationship with auth.users
-- Add foreign key constraint to link users table with auth.users

-- First, let's make sure we have the correct structure
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, age, race, lookingFor, about)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 25),
    COALESCE(NEW.raw_user_meta_data->>'race', 'Lunari'),
    COALESCE(NEW.raw_user_meta_data->>'lookingFor', 'Todos'),
    COALESCE(NEW.raw_user_meta_data->>'about', 'Jogador do RPG Real Life Virtual')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();