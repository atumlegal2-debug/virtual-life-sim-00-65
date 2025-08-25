-- Criar função para configurar o usuário atual
CREATE OR REPLACE FUNCTION public.set_current_user(username_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user', username_value, true);
END;
$$;