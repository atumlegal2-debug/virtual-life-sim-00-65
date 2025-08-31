-- Update all existing users to have happiness and energy at 100
UPDATE public.users 
SET happiness_percentage = 100.00, 
    energy_percentage = 100.00 
WHERE happiness_percentage IS NULL OR energy_percentage IS NULL;