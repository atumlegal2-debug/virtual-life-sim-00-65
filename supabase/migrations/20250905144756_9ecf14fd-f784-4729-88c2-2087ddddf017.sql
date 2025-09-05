-- Criar função para consolidar itens duplicados automaticamente (versão corrigida)
CREATE OR REPLACE FUNCTION consolidate_duplicate_inventory_items()
RETURNS TRIGGER AS $$
DECLARE
    existing_item_id UUID;
BEGIN
    -- Procurar se já existe um item igual para este usuário
    SELECT id INTO existing_item_id
    FROM inventory 
    WHERE user_id = NEW.user_id 
    AND item_id = NEW.item_id 
    AND id != NEW.id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Se encontrou um item existente, consolidar
    IF existing_item_id IS NOT NULL THEN
        -- Atualizar a quantidade do item existente
        UPDATE inventory 
        SET quantity = quantity + NEW.quantity,
            updated_at = now()
        WHERE id = existing_item_id;
        
        -- Deletar o novo item duplicado
        DELETE FROM inventory WHERE id = NEW.id;
        
        RETURN NULL; -- Não inserir o novo registro
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para consolidação automática em novos inserts
DROP TRIGGER IF EXISTS prevent_duplicate_inventory ON inventory;
CREATE TRIGGER prevent_duplicate_inventory
    AFTER INSERT ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION consolidate_duplicate_inventory_items();

-- Finalizar consolidação dos itens duplicados restantes
WITH duplicated_items AS (
    SELECT user_id, item_id, array_agg(id ORDER BY created_at) as ids, SUM(quantity) as total_qty
    FROM inventory
    GROUP BY user_id, item_id
    HAVING COUNT(*) > 1
)
UPDATE inventory 
SET quantity = duplicated_items.total_qty,
    updated_at = now()
FROM duplicated_items
WHERE inventory.id = duplicated_items.ids[1];

-- Deletar itens duplicados restantes (manter apenas o primeiro)
WITH duplicated_items AS (
    SELECT user_id, item_id, array_agg(id ORDER BY created_at) as ids
    FROM inventory
    GROUP BY user_id, item_id
    HAVING COUNT(*) > 1
)
DELETE FROM inventory
USING duplicated_items
WHERE inventory.user_id = duplicated_items.user_id
AND inventory.item_id = duplicated_items.item_id
AND inventory.id = ANY(duplicated_items.ids[2:]);