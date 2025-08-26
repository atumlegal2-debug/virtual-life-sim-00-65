-- Função para criar automaticamente um usuário na tabela users quando alguém se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user' || EXTRACT(EPOCH FROM NOW())::text) -- User code igual ao username
  );
  RETURN NEW;
END;
$$;

-- Trigger que executa a função sempre que um novo usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();