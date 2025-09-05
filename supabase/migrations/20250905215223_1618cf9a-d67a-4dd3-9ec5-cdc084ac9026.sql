-- Limitar itens existentes que ultrapassam 10 unidades para exatamente 10
UPDATE inventory 
SET quantity = 10, 
    updated_at = now()
WHERE quantity > 10;