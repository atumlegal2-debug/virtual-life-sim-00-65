-- Criar função para consolidar itens duplicados automaticamente
CREATE OR REPLACE FUNCTION consolidate_duplicate_inventory_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Se já existe um item igual para este usuário, somar as quantidades
    IF EXISTS (
        SELECT 1 FROM inventory 
        WHERE user_id = NEW.user_id 
        AND item_id = NEW.item_id 
        AND id != NEW.id
    ) THEN
        -- Atualizar a quantidade do item existente
        UPDATE inventory 
        SET quantity = quantity + NEW.quantity,
            updated_at = now()
        WHERE user_id = NEW.user_id 
        AND item_id = NEW.item_id 
        AND id != NEW.id
        LIMIT 1;
        
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

-- Reconsolidar itens que ainda estão duplicados
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
AND inventory.id != duplicated_items.ids[1];