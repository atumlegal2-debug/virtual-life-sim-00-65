-- Corrigir o ID do refrigerante para corresponder ao catálogo das lojas
UPDATE inventory 
SET item_id = 'refrigerante',
    updated_at = now()
WHERE item_id = 'refrigerante_cola_guarana_limao';