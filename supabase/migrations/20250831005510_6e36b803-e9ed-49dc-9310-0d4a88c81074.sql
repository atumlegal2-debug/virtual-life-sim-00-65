-- Fix the decrease_hunger function to use proper timestamp format
CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    last_decrease_time timestamptz;
    current_time timestamptz := now();
    time_diff_minutes integer;
    users_updated integer := 0;
BEGIN
    -- Get the last decrease time from system_settings
    SELECT value::timestamptz INTO last_decrease_time
    FROM public.system_settings 
    WHERE key = 'last_hunger_decrease'
    LIMIT 1;

    -- Initialize if missing
    IF last_decrease_time IS NULL THEN
        INSERT INTO public.system_settings (key, value)
        VALUES ('last_hunger_decrease', current_time::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        last_decrease_time := current_time - interval '31 minutes'; -- Force first run
    END IF;

    -- Calculate elapsed minutes
    time_diff_minutes := EXTRACT(EPOCH FROM (current_time - last_decrease_time)) / 60;

    IF time_diff_minutes >= 30 THEN
        -- Decrease hunger by 2 points, min 0
        UPDATE public.users 
        SET hunger_percentage = GREATEST(0, COALESCE(hunger_percentage, 100) - 2)
        WHERE hunger_percentage > 0;

        GET DIAGNOSTICS users_updated = ROW_COUNT;

        -- Update last decrease time with proper format
        UPDATE public.system_settings 
        SET value = to_char(current_time, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), 
            updated_at = current_time
        WHERE key = 'last_hunger_decrease';

        RETURN jsonb_build_object(
            'decreased', true,
            'users_updated', users_updated,
            'message', 'Hunger decreased by 2 points',
            'last_decrease_at', current_time
        );
    ELSE
        RETURN jsonb_build_object(
            'decreased', false,
            'message', 'Less than 30 minutes since last decrease',
            'next_decrease_in_seconds', (30 * 60) - (time_diff_minutes * 60)
        );
    END IF;
END;
$function$;