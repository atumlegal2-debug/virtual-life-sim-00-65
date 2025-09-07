-- Ativar real-time updates para a tabela inventory
ALTER TABLE public.inventory REPLICA IDENTITY FULL;

-- Adicionar a tabela inventory à publicação de real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;