-- Update process_order_delivery_rules to prevent duplicate motoboy_orders and honor a manual block marker
CREATE OR REPLACE FUNCTION public.process_order_delivery_rules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_record RECORD;
BEGIN
  -- 1) Auto-approve DELIVERY orders pending > 1 minute, but only if:
  --    - There isn't already a motoboy_orders for the same order_id (prevents duplicates)
  --    - The manager_notes does not contain a manual block marker [motoboy_blocked]
  FOR order_record IN 
    SELECT o.*
    FROM orders o
    WHERE o.status = 'pending'
      AND LOWER(COALESCE(o.delivery_type, 'pickup')) = 'delivery'
      AND o.created_at <= NOW() - INTERVAL '1 minute'
      AND o.manager_approved IS NULL
      AND (o.manager_notes IS NULL OR POSITION('[motoboy_blocked]' IN o.manager_notes) = 0)
      AND NOT EXISTS (
        SELECT 1 FROM motoboy_orders mo
        WHERE mo.order_id = o.id
      )
  LOOP
    -- Approve order for delivery
    UPDATE orders 
    SET 
      status = 'approved',
      manager_approved = true,
      approved_at = NOW(),
      manager_notes = COALESCE(manager_notes, '') || ' [Aprovado automaticamente - delivery]',
      updated_at = NOW()
    WHERE id = order_record.id;
    
    -- Create motoboy order
    INSERT INTO motoboy_orders (
      order_id,
      store_id,
      customer_name,
      customer_username,
      customer_avatar,
      delivery_address,
      items,
      total_amount,
      manager_status,
      manager_processed_at,
      manager_notes
    )
    SELECT 
      o.id,
      o.store_id,
      COALESCE(u.nickname, u.username),
      u.username,
      u.avatar,
      'Endereço não informado',
      o.items,
      o.total_amount,
      'approved',
      NOW(),
      'Aprovado automaticamente após 1 minuto'
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = order_record.id;
  END LOOP;
  
  -- 2) Do NOT auto-process pickup orders here (they require manual approval)
  
  -- 3) Log
  RAISE NOTICE 'Processamento de pedidos concluído em %', NOW();
END;
$function$;