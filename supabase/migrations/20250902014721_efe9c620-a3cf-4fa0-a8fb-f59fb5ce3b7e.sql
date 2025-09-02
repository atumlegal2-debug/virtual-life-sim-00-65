-- Fix security issues for happiness and energy decrease functions

-- Update functions to include proper search_path
CREATE OR REPLACE FUNCTION decrease_happiness()
RETURNS JSON AS $$
DECLARE
  last_decrease_time TIMESTAMP;
  current_time TIMESTAMP := NOW();
  time_diff_minutes INTEGER;
  users_count INTEGER := 0;
  decrease_interval_minutes INTEGER := 20; -- 20 minutes between decreases
BEGIN
  -- Get the last happiness decrease time from a control table
  SELECT last_happiness_decrease INTO last_decrease_time
  FROM public.stat_decrease_control 
  WHERE id = 1;
  
  -- If no record exists, create one and initialize
  IF last_decrease_time IS NULL THEN
    INSERT INTO public.stat_decrease_control (id, last_happiness_decrease) 
    VALUES (1, current_time)
    ON CONFLICT (id) DO UPDATE SET last_happiness_decrease = current_time;
    last_decrease_time := current_time;
  END IF;
  
  -- Calculate time difference in minutes
  time_diff_minutes := EXTRACT(EPOCH FROM (current_time - last_decrease_time)) / 60;
  
  -- Only proceed if 20 minutes have passed
  IF time_diff_minutes >= decrease_interval_minutes THEN
    -- Update happiness for all users (decrease by 1, minimum 0)
    UPDATE public.users 
    SET happiness = GREATEST(0, COALESCE(happiness, 100) - 1)
    WHERE happiness IS NULL OR happiness > 0;
    
    GET DIAGNOSTICS users_count = ROW_COUNT;
    
    -- Update the last decrease time
    UPDATE public.stat_decrease_control 
    SET last_happiness_decrease = current_time 
    WHERE id = 1;
    
    RETURN JSON_BUILD_OBJECT(
      'decreased', true,
      'users_updated', users_count,
      'message', 'Happiness decreased by 1 for all users'
    );
  ELSE
    -- Not enough time has passed
    RETURN JSON_BUILD_OBJECT(
      'decreased', false,
      'users_updated', 0,
      'message', 'Not enough time passed since last happiness decrease',
      'next_decrease_in_seconds', (decrease_interval_minutes - time_diff_minutes) * 60
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION decrease_energy()
RETURNS JSON AS $$
DECLARE
  last_decrease_time TIMESTAMP;
  current_time TIMESTAMP := NOW();
  time_diff_minutes INTEGER;
  users_count INTEGER := 0;
  decrease_interval_minutes INTEGER := 20; -- 20 minutes between decreases
BEGIN
  -- Get the last energy decrease time from a control table
  SELECT last_energy_decrease INTO last_decrease_time
  FROM public.stat_decrease_control 
  WHERE id = 1;
  
  -- If no record exists, create one and initialize
  IF last_decrease_time IS NULL THEN
    INSERT INTO public.stat_decrease_control (id, last_energy_decrease) 
    VALUES (1, current_time)
    ON CONFLICT (id) DO UPDATE SET last_energy_decrease = current_time;
    last_decrease_time := current_time;
  END IF;
  
  -- Calculate time difference in minutes
  time_diff_minutes := EXTRACT(EPOCH FROM (current_time - last_decrease_time)) / 60;
  
  -- Only proceed if 20 minutes have passed
  IF time_diff_minutes >= decrease_interval_minutes THEN
    -- Update energy for all users (decrease by 1, minimum 0)
    UPDATE public.users 
    SET energy = GREATEST(0, COALESCE(energy, 100) - 1)
    WHERE energy IS NULL OR energy > 0;
    
    GET DIAGNOSTICS users_count = ROW_COUNT;
    
    -- Update the last decrease time
    UPDATE public.stat_decrease_control 
    SET last_energy_decrease = current_time 
    WHERE id = 1;
    
    RETURN JSON_BUILD_OBJECT(
      'decreased', true,
      'users_updated', users_count,
      'message', 'Energy decreased by 1 for all users'
    );
  ELSE
    -- Not enough time has passed
    RETURN JSON_BUILD_OBJECT(
      'decreased', false,
      'users_updated', 0,
      'message', 'Not enough time passed since last energy decrease',
      'next_decrease_in_seconds', (decrease_interval_minutes - time_diff_minutes) * 60
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Enable RLS on stat_decrease_control table
ALTER TABLE public.stat_decrease_control ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for stat_decrease_control (only service role can access)
CREATE POLICY "Service role can manage stat_decrease_control" ON public.stat_decrease_control
FOR ALL USING (false); -- Only service role can access this table