-- Enable realtime for users table to track alcoholism changes
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add the table to realtime publication (may already exist, will ignore error)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;