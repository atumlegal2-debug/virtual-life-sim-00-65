-- Fix search paths for all functions to make them secure
-- Update handle_new_user function 
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

-- Update set_current_user function
CREATE OR REPLACE FUNCTION public.set_current_user(username_value text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.current_user', username_value, true);
END;
$function$;

-- Update update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;