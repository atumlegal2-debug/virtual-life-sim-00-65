-- Update the decrease_hunger function to decrease 1 point every 10 minutes
CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  control_record hunger_control%ROWTYPE;
  should_decrease boolean := false;
  users_updated integer := 0;
BEGIN
  -- Get the control record
  SELECT * INTO control_record 
  FROM hunger_control 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Check if 10 minutes have passed since last decrease
  IF control_record.last_decrease_at IS NULL OR 
     control_record.last_decrease_at < (now() - INTERVAL '10 minutes') THEN
    should_decrease := true;
  END IF;
  
  -- Only decrease hunger if 10 minutes have passed
  IF should_decrease THEN
    -- Update hunger for all users (decrease by 1 point)
    UPDATE users 
    SET hunger_percentage = GREATEST(0, hunger_percentage - 1)
    WHERE hunger_percentage > 0;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    -- Update the control record
    UPDATE hunger_control 
    SET last_decrease_at = now(), updated_at = now()
    WHERE id = control_record.id;
    
    RETURN jsonb_build_object(
      'decreased', true,
      'users_updated', users_updated,
      'last_decrease_at', now()
    );
  ELSE
    RETURN jsonb_build_object(
      'decreased', false,
      'message', 'Less than 10 minutes since last decrease',
      'last_decrease_at', control_record.last_decrease_at,
      'next_decrease_in_seconds', EXTRACT(EPOCH FROM (control_record.last_decrease_at + INTERVAL '10 minutes' - now()))
    );
  END IF;
END;
$function$;