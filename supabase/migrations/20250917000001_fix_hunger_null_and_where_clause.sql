-- Ensure hunger decrease applies to users with NULL hunger and initialize existing NULLs

-- One-off data fix: set NULL hunger to 100 so it starts decrementing
UPDATE public.users
SET hunger_percentage = 100
WHERE hunger_percentage IS NULL;

-- Redefine decrease_hunger to include NULLs in WHERE clause
DROP FUNCTION IF EXISTS public.decrease_hunger();

CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    hunger_control_record RECORD;
    users_updated_count INTEGER := 0;
    should_decrease BOOLEAN := false;
    next_decrease_seconds INTEGER;
BEGIN
    -- Get or create hunger control record
    SELECT * INTO hunger_control_record 
    FROM hunger_control 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If no record exists, create one
    IF hunger_control_record IS NULL THEN
        INSERT INTO hunger_control (last_decrease_at) 
        VALUES (now()) 
        RETURNING * INTO hunger_control_record;
        should_decrease := true;
    ELSE
        -- Check if 10 minutes have passed since last decrease (600 seconds)
        IF EXTRACT(EPOCH FROM (now() - hunger_control_record.last_decrease_at)) >= 600 THEN
            should_decrease := true;
        END IF;
    END IF;
    
    -- Calculate seconds until next decrease
    next_decrease_seconds := GREATEST(0, 600 - EXTRACT(EPOCH FROM (now() - hunger_control_record.last_decrease_at))::INTEGER);
    
    IF should_decrease THEN
        -- Decrease hunger by 1 for all users (NULLs treated as 100)
        UPDATE public.users 
        SET 
            hunger_percentage = GREATEST(0, COALESCE(hunger_percentage, 100) - 1),
            updated_at = now()
        WHERE COALESCE(hunger_percentage, 100) > 0;
        
        GET DIAGNOSTICS users_updated_count = ROW_COUNT;
        
        -- Update the control record
        UPDATE hunger_control 
        SET 
            last_decrease_at = now(),
            updated_at = now()
        WHERE id = hunger_control_record.id;
        
        -- Create hunger-related disease entries when applicable
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_diseases') THEN
            INSERT INTO user_diseases (user_id, disease_name, medicine_name, created_at)
            SELECT 
                u.id,
                'Desnutrição',
                'Consulta Médica',
                now()
            FROM users u
            WHERE u.hunger_percentage <= 49 
            AND NOT EXISTS (
                SELECT 1 FROM user_diseases ud 
                WHERE ud.user_id = u.id 
                AND ud.disease_name = 'Desnutrição'
                AND ud.cured_at IS NULL
            );
        END IF;
        
        RETURN json_build_object(
            'decreased', true,
            'users_updated', users_updated_count,
            'message', 'Hunger decreased successfully',
            'next_decrease_in_seconds', 600
        );
    ELSE
        RETURN json_build_object(
            'decreased', false,
            'users_updated', 0,
            'message', 'Too early to decrease hunger',
            'next_decrease_in_seconds', next_decrease_seconds
        );
    END IF;
END;
$function$;

