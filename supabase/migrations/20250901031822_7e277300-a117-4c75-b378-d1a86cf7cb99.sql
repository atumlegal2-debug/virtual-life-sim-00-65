-- Create motoboy_orders table for delivery orders
CREATE TABLE public.motoboy_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  store_id text NOT NULL,
  customer_name text NOT NULL,
  customer_username text NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  delivery_address text,
  manager_status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  motoboy_status text NOT NULL DEFAULT 'waiting', -- waiting, accepted, delivering, delivered
  manager_notes text,
  motoboy_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  manager_processed_at timestamp with time zone,
  motoboy_accepted_at timestamp with time zone,
  delivered_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.motoboy_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Managers can view store motoboy orders" 
ON public.motoboy_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can update motoboy orders" 
ON public.motoboy_orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can create motoboy orders" 
ON public.motoboy_orders 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_motoboy_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_motoboy_orders_updated_at
BEFORE UPDATE ON public.motoboy_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_motoboy_orders_updated_at();