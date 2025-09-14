-- Add is_open column to stores table to track if store is open or closed
ALTER TABLE public.stores 
ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX idx_stores_is_open ON public.stores(is_open);

-- Enable realtime for stores table so changes are reflected immediately
ALTER TABLE public.stores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;