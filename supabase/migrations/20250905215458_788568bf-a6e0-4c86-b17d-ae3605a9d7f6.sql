-- Normalizar IDs dos itens no inventário para corresponder aos IDs das lojas
UPDATE inventory 
SET item_id = 'aurora_acucarada',
    updated_at = now()
WHERE item_id = 'Aurora Açucarada';

UPDATE inventory 
SET item_id = 'refrigerante_cola_guarana_limao',
    updated_at = now()
WHERE item_id = 'Refrigerante (Cola, Guaraná, Limão)';