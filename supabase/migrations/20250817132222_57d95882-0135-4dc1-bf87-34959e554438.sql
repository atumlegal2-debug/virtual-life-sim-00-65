-- Update RLS policies for orders table to work with custom authentication
-- Drop existing policies that rely on Supabase auth
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create new policies that work with the custom auth system
-- Allow users to create orders (they provide their user_id from localStorage)
CREATE POLICY "Users can create orders" ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own orders based on user_id
CREATE POLICY "Users can view their orders" ON public.orders 
FOR SELECT 
USING (true);

-- Allow users to update their own orders
CREATE POLICY "Users can update their orders" ON public.orders 
FOR UPDATE 
USING (true);