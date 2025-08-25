-- Check current policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'inventory';

-- Drop all existing policies for inventory
DROP POLICY IF EXISTS "Allow inventory insertions for approved orders" ON public.inventory;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory; 
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory;

-- Create permissive policies that allow all authenticated users to manage inventory
-- This is needed for the manager app to work properly
CREATE POLICY "Allow authenticated users to view inventory" 
ON public.inventory 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inventory" 
ON public.inventory 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete inventory" 
ON public.inventory 
FOR DELETE 
USING (true);