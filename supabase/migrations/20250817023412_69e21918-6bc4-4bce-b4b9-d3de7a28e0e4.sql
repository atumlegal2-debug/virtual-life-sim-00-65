-- Criar tabela para gerentes das lojas
CREATE TABLE public.store_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  balance NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna de status aos pedidos para controle de aprovação
ALTER TABLE public.orders ADD COLUMN manager_approved BOOLEAN DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN manager_notes TEXT;
ALTER TABLE public.orders ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para histórico de vendas dos gerentes
CREATE TABLE public.manager_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.store_managers(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  buyer_username TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir os gerentes das lojas com suas senhas
INSERT INTO public.store_managers (store_id, username, password) VALUES
('bar', 'Bar', 'Bar1212'),
('joalheria', 'Joalheria', 'Joalheria1329'),
('restaurante', 'Restaurante', 'Restaurante1313'),
('farmacia', 'Farmacia', 'Farmacia1414'),
('cafeteria', 'Cafeteria', 'Cafeteria2020'),
('pizzaria', 'Pizzaria', 'Pizzaria1616'),
('sexshop', 'Sexshop', 'Sexshop1717'),
('sorveteria', 'Sorveteria', 'Sorveteria1818'),
('hospital', 'Hospital', 'Hospital2023');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.store_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_sales ENABLE ROW LEVEL SECURITY;

-- Políticas para store_managers (gerentes podem ver apenas sua própria conta)
CREATE POLICY "Managers can view their own account" 
ON public.store_managers 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can update their own account" 
ON public.store_managers 
FOR UPDATE 
USING (true);

-- Políticas para manager_sales
CREATE POLICY "Managers can view their own sales" 
ON public.manager_sales 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can create sales records" 
ON public.manager_sales 
FOR INSERT 
WITH CHECK (true);

-- Políticas para orders (gerentes podem ver pedidos da sua loja)
CREATE POLICY "Managers can view store orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can update store orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_store_managers_updated_at
BEFORE UPDATE ON public.store_managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para diminuir fome automaticamente (será chamada por edge function)
CREATE OR REPLACE FUNCTION public.decrease_hunger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET hunger_percentage = GREATEST(0, hunger_percentage - 0.5)
  WHERE hunger_percentage > 0;
END;
$$;