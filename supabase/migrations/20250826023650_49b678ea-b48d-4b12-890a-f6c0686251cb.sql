-- Update the handle_new_user function to extract only the last 4 digits for user_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    alcoholism_percentage,
    disease_percentage,
    relationship_status,
    user_code
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user' || EXTRACT(EPOCH FROM NOW())::text),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 25),
    COALESCE(NEW.raw_user_meta_data ->> 'race', 'Lunari'),
    COALESCE(NEW.raw_user_meta_data ->> 'lookingFor', 'Todos'),
    COALESCE(NEW.raw_user_meta_data ->> 'about', 'Jogador do RPG Real Life Virtual'),
    2000.00, -- Saldo inicial
    100.00,  -- Vida inicial
    100.00,  -- Fome inicial  
    100.00,  -- Humor inicial
    0.00,    -- Alcoolismo inicial
    0.00,    -- Doença inicial
    'single', -- Status de relacionamento inicial
    -- Extract last 4 digits from username for user_code
    RIGHT(COALESCE(NEW.raw_user_meta_data ->> 'username', '0000'), 4)
  );
  RETURN NEW;
END;
$function$;