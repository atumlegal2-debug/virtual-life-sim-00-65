-- Update the decrease_hunger function to decrease by 0.5% instead of 0.5 points
CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.users 
  SET hunger_percentage = GREATEST(0, hunger_percentage * 0.995)  -- Decrease by 0.5%
  WHERE hunger_percentage > 0;
END;
$function$