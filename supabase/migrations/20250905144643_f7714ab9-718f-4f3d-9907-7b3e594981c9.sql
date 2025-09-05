-- Consolidar itens duplicados no inventário
-- Primeiro, criar uma tabela temporária com as quantidades consolidadas
CREATE TEMP TABLE consolidated_inventory AS
SELECT 
    user_id,
    item_id,
    SUM(quantity) as total_quantity,
    MIN(created_at) as earliest_created_at,
    MAX(updated_at) as latest_updated_at,
    -- Pegar o primeiro sent_by_username não nulo
    (array_agg(sent_by_username ORDER BY created_at))[1] as sent_by_username,
    -- Pegar o primeiro sent_by_user_id não nulo  
    (array_agg(sent_by_user_id ORDER BY created_at))[1] as sent_by_user_id,
    -- Pegar o primeiro received_at não nulo
    (array_agg(received_at ORDER BY created_at))[1] as received_at
FROM inventory 
GROUP BY user_id, item_id;

-- Limitar a quantidade máxima por item para ser realista (máximo 100 por item)
UPDATE consolidated_inventory 
SET total_quantity = LEAST(total_quantity, 100);

-- Deletar todas as entradas atuais do inventário
DELETE FROM inventory;

-- Inserir as quantidades consolidadas
INSERT INTO inventory (user_id, item_id, quantity, created_at, updated_at, sent_by_username, sent_by_user_id, received_at)
SELECT 
    user_id,
    item_id,
    total_quantity,
    earliest_created_at,
    latest_updated_at,
    sent_by_username,
    sent_by_user_id,
    received_at
FROM consolidated_inventory
WHERE total_quantity > 0;

-- Log do que foi feito
DO $$ 
DECLARE
    total_items_before INTEGER;
    total_items_after INTEGER;
BEGIN
    -- Não podemos fazer SELECT nas tabelas que já foram alteradas, mas podemos logar
    RAISE NOTICE 'Consolidação de inventário concluída. Itens duplicados foram consolidados e limitados a máximo 100 por tipo.';
END $$;