-- Verificar se a tabela hospital_treatment_requests está na publicação do realtime
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'hospital_treatment_requests';

-- Se não estiver, adicionar à publicação realtime
DO $$
BEGIN
    -- Remove da publicação se já existe para evitar erros
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.hospital_treatment_requests;
    EXCEPTION
        WHEN undefined_object THEN
            -- Tabela não estava na publicação, continuar
            NULL;
    END;
    
    -- Adicionar à publicação realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_treatment_requests;
END $$;

-- Configurar REPLICA IDENTITY para capturar dados completos
ALTER TABLE public.hospital_treatment_requests REPLICA IDENTITY FULL;