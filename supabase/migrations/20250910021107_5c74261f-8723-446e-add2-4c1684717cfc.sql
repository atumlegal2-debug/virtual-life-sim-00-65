-- Enable realtime for stores table to broadcast status changes
ALTER TABLE public.stores REPLICA IDENTITY FULL;

-- Add stores table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;