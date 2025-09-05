-- Corrigir o inventário do usuário wonho1919 para as 10 pizzas que pagou mas não recebeu
-- Primeiro, vamos atualizar a quantidade existente para 10 unidades
UPDATE inventory 
SET quantity = 10, updated_at = now()
WHERE user_id = '186adc50-6e44-434c-933c-327bc46b0620' 
AND item_id = 'estrela_chocolate'
AND id = 'e5b14039-1837-4a80-b4e0-51fb549e04bb';