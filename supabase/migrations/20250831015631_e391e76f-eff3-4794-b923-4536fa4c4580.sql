-- Add happiness and energy columns to users table
ALTER TABLE public.users 
ADD COLUMN happiness_percentage numeric DEFAULT 100.00,
ADD COLUMN energy_percentage numeric DEFAULT 100.00;