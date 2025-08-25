-- Create trigger to handle new user registration
-- This will automatically create a profile in the users table when someone signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    username, 
    email, 
    age, 
    race, 
    looking_for, 
    about,
    wallet_balance,
    life_percentage,
    hunger_percentage,
    mood,
    user_code
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 25),
    COALESCE(NEW.raw_user_meta_data->>'race', 'Lunari'),
    COALESCE(NEW.raw_user_meta_data->>'lookingFor', 'Todos'),
    COALESCE(NEW.raw_user_meta_data->>'about', 'Jogador do RPG Real Life Virtual'),
    2000, -- Default wallet balance
    100,  -- Default life percentage
    100,  -- Default hunger percentage  
    5,    -- Default mood
    LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0') -- Random 4-digit code
  );
  RETURN NEW;
END;
$$;

-- Create trigger to execute the function when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also add auth_user_id column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;