-- RPCs para corrigir RLS sem autenticação, executando a lógica no servidor
-- Cria/insere gravidez para um username
CREATE OR REPLACE FUNCTION public.create_user_pregnancy(
  p_username text,
  p_percentage numeric DEFAULT 1.0
)
RETURNS public.user_pregnancy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_row public.user_pregnancy;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE username = p_username;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for username %', p_username USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_pregnancy (user_id, pregnancy_percentage)
  VALUES (v_user_id, COALESCE(p_percentage, 1.0))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Busca gravidez associada ao username
CREATE OR REPLACE FUNCTION public.get_user_pregnancy(
  p_username text
)
RETURNS public.user_pregnancy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_pregnancy;
BEGIN
  SELECT up.*
  INTO v_row
  FROM public.user_pregnancy up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.username = p_username
  ORDER BY up.created_at DESC
  LIMIT 1;

  RETURN v_row;
END;
$$;