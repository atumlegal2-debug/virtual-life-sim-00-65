-- Create inventory table for user items
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add game stats columns to users table
ALTER TABLE public.users 
ADD COLUMN life_percentage DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN hunger_percentage DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN mood DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create stores table for store information
CREATE TABLE public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_password TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for purchase orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES public.stores(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory
CREATE POLICY "Users can view their own inventory" 
ON public.inventory 
FOR SELECT 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own inventory" 
ON public.inventory 
FOR UPDATE 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their own inventory" 
ON public.inventory 
FOR DELETE 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create RLS policies for stores (public read, admin write)
CREATE POLICY "Anyone can view stores" 
ON public.stores 
FOR SELECT 
USING (true);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Insert initial store data
INSERT INTO public.stores (id, name, manager_password) VALUES
('bar', 'Bar', 'Bar1212'),
('joalheria', 'Joalheria', 'Joalheria1329'),
('restaurante', 'Restaurante', 'Restaurante1313'),
('farmacia', 'Farmácia', 'Farmacia1414'),
('cafeteria', 'Cafeteria', 'Cafeteria2020'),
('pizzaria', 'Pizzaria', 'Pizzaria1616'),
('sexshop', 'Sexshop', 'Sexshop1717'),
('sorveteria', 'Sorveteria', 'Sorveteria1818'),
('hospital', 'Hospital', 'Hospital2023');

-- Create trigger for updating timestamps
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();