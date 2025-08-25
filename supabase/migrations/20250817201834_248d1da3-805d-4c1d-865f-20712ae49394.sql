-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;  
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create more permissive policies since we're not using Supabase auth
CREATE POLICY "Anyone can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars');