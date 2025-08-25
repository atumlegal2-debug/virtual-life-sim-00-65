-- Add alcoholism_percentage and disease_percentage columns to users table if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS alcoholism_percentage NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS disease_percentage NUMERIC DEFAULT 0.00;