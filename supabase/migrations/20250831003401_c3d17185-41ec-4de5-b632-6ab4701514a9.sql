-- Harden decrease_hunger with SECURITY DEFINER and fixed search_path; keep 2 points every 30 minutes
CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    last_decrease_time timestamptz;
    current_time timestamptz := now();
    time_diff_minutes integer;
    users_updated integer := 0;
BEGIN
    -- Ensure settings table exists
    PERFORM 1 FROM public.system_settings LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
      CREATE TABLE public.system_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      -- Enable RLS and block direct access
      ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "System settings are managed by functions only" ON public.system_settings;
      CREATE POLICY "System settings are managed by functions only" ON public.system_settings FOR ALL USING (false) WITH CHECK (false);
BEGIN
    -- Get the last decrease time
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

        -- Update last decrease time
        UPDATE public.system_settings 
        SET value = current_time::text, updated_at = now()
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
$$;