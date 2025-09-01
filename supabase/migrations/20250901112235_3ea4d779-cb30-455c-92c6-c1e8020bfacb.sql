-- Update existing motoboy_orders to use correct store IDs
UPDATE motoboy_orders 
SET store_id = CASE 
  WHEN store_id = 'pharmacy' THEN 'farmacia'
  WHEN store_id = 'restaurant' THEN 'restaurante' 
  WHEN store_id = 'pizzeria' THEN 'pizzaria'
  WHEN store_id = 'bar' THEN 'bar'
  WHEN store_id = 'cafeteria' THEN 'cafeteria'
  WHEN store_id = 'jewelry' THEN 'joalheria'
  WHEN store_id = 'sexshop' THEN 'sexshop'
  WHEN store_id = 'icecream' THEN 'sorveteria'
  ELSE store_id
END
WHERE store_id IN ('pharmacy', 'restaurant', 'pizzeria', 'jewelry', 'icecream');