-- Create RPC to update pregnancy in the same transaction as setting current user
CREATE OR REPLACE FUNCTION public.update_user_pregnancy(p_username text, p_percentage numeric)
RETURNS user_pregnancy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.user_pregnancy;
BEGIN
  -- Ensure GUC used by RLS is set within the same transaction
  PERFORM set_config('app.current_user', p_username, true);

  -- Clamp percentage between 0 and 100 and update
  UPDATE public.user_pregnancy up
  SET pregnancy_percentage = LEAST(GREATEST(p_percentage, 0), 100),
      updated_at = NOW()
  WHERE up.user_id = (
    SELECT id FROM public.users WHERE username = p_username
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;