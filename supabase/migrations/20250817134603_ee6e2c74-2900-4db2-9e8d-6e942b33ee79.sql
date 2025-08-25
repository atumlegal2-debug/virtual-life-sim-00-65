-- Drop the restrictive policy for inventory insertions
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory;

-- Create a more permissive policy that allows authenticated users to insert inventory items
-- This covers both users adding their own items and managers adding items for approved orders
CREATE POLICY "Allow inventory insertions for approved orders" 
ON public.inventory 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);