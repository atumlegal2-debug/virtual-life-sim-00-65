-- Verificar se a tabela inventory está na publicação do realtime
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory';

-- Configurar inventory para realtime se não estiver
DO $$
BEGIN
    -- Remove da publicação se já existe para evitar erros
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.inventory;
    EXCEPTION
        WHEN undefined_object THEN
            -- Tabela não estava na publicação, continuar
            NULL;
    END;
    
    -- Adicionar à publicação realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
END $$;

-- Configurar REPLICA IDENTITY para capturar dados completos nas mudanças
ALTER TABLE public.inventory REPLICA IDENTITY FULL;