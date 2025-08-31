-- Update the decrease_hunger function to decrease 2 points every 30 minutes
CREATE OR REPLACE FUNCTION decrease_hunger()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    last_decrease_time timestamp with time zone;
    current_time timestamp with time zone := now();
    time_diff_minutes integer;
    users_updated integer := 0;
BEGIN
    -- Get the last decrease time from a system table or use a simple approach
    SELECT value::timestamp with time zone INTO last_decrease_time
    FROM system_settings 
    WHERE key = 'last_hunger_decrease'
    LIMIT 1;
    
    -- If no previous decrease time, create the record
    IF last_decrease_time IS NULL THEN
        INSERT INTO system_settings (key, value) 
        VALUES ('last_hunger_decrease', current_time::text)
        ON CONFLICT (key) DO UPDATE SET value = current_time::text;
        last_decrease_time := current_time - interval '31 minutes'; -- Force first run
    END IF;
    
    -- Calculate time difference in minutes
    time_diff_minutes := EXTRACT(EPOCH FROM (current_time - last_decrease_time)) / 60;
    
    -- Only decrease if 30 minutes have passed
    IF time_diff_minutes >= 30 THEN
        -- Decrease hunger by 2 for all users, minimum 0
        UPDATE users 
        SET hunger_percentage = GREATEST(0, COALESCE(hunger_percentage, 100) - 2)
        WHERE hunger_percentage > 0;
        
        GET DIAGNOSTICS users_updated = ROW_COUNT;
        
        -- Update last decrease time
        UPDATE system_settings 
        SET value = current_time::text 
        WHERE key = 'last_hunger_decrease';
        
        RETURN jsonb_build_object(
            'decreased', true,
            'users_updated', users_updated,
            'message', 'Hunger decreased by 2 points'
        );
    ELSE
        RETURN jsonb_build_object(
            'decreased', false,
            'message', 'Less than 30 minutes since last decrease',
            'next_decrease_in_seconds', (30 * 60) - (time_diff_minutes * 60)
        );
    END IF;
END;
$$;

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for system_settings (only functions can access)
CREATE POLICY "System settings are managed by functions only" 
ON system_settings 
FOR ALL 
USING (false) 
WITH CHECK (false);