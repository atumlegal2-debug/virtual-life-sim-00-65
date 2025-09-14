-- Prevent motoboy repair job from re-adding consumed items by marking processed orders
CREATE OR REPLACE FUNCTION public.deliver_pending_motoboy_items()
RETURNS TABLE(delivery_count integer, items_delivered text, users_updated text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pending_order RECORD;
  item_record RECORD;
  items_list TEXT := '';
  total_deliveries INTEGER := 0;
  updated_users TEXT := '';
  current_quantity INTEGER;
  max_to_add INTEGER;
  final_quantity INTEGER;
  item_name TEXT;
  item_quantity INTEGER;
  any_item_added BOOLEAN := FALSE;
BEGIN
  -- Buscar pedidos entregues nas últimas 24 horas que ainda NÃO foram aplicados ao inventário
  FOR pending_order IN 
    SELECT DISTINCT mo.*, u.id as user_id, u.username, u.nickname
    FROM motoboy_orders mo
    JOIN users u ON u.username = mo.customer_name
    WHERE mo.motoboy_status = 'delivered' 
      AND mo.delivered_at > NOW() - INTERVAL '24 hours'
      AND (mo.motoboy_notes IS NULL OR mo.motoboy_notes NOT LIKE '%[inventory_applied]%')
    ORDER BY mo.delivered_at DESC
  LOOP
    -- Verificar e entregar itens do pedido
    FOR item_record IN 
      SELECT item_data->'name' as name, item_data->'quantity' as quantity
      FROM jsonb_array_elements(pending_order.items) AS item_data
    LOOP
      item_name := item_record.name::text;
      item_name := TRIM(item_name, '"'); -- Remove quotes
      item_quantity := (item_record.quantity::text)::INTEGER;
      
      BEGIN
        -- Verificar limite de 3 itens por tipo já existentes no inventário
        SELECT COALESCE(SUM(quantity), 0) INTO current_quantity
        FROM inventory 
        WHERE user_id = pending_order.user_id 
          AND item_id = item_name;
        
        max_to_add := GREATEST(0, 3 - current_quantity);
        final_quantity := LEAST(item_quantity, max_to_add);
        
        IF final_quantity > 0 THEN
          INSERT INTO inventory (
            user_id,
            item_id, 
            quantity,
            sent_by_username,
            received_at
          ) VALUES (
            pending_order.user_id,
            item_name,
            final_quantity,
            'Motoboy',
            pending_order.delivered_at
          );
          
          items_list := items_list || final_quantity || 'x ' || item_name || ', ';
          total_deliveries := total_deliveries + 1;
          any_item_added := TRUE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Ignorar erros de itens individuais e continuar
        CONTINUE;
      END;
    END LOOP;
    
    -- Se adicionamos qualquer item, marcar o pedido como aplicado para evitar reaplicação futura
    IF any_item_added THEN
      UPDATE motoboy_orders 
      SET motoboy_notes = COALESCE(motoboy_notes, '') || ' [inventory_applied]',
          updated_at = now()
      WHERE id = pending_order.id;
    END IF;
    
    IF items_list != '' THEN
      updated_users := updated_users || COALESCE(pending_order.nickname, pending_order.username) || ', ';
    END IF;
  END LOOP;
  
  -- Remover vírgulas finais
  items_list := RTRIM(items_list, ', ');
  updated_users := RTRIM(updated_users, ', ');
  
  RETURN QUERY SELECT total_deliveries, items_list, updated_users;
END;
$function$;