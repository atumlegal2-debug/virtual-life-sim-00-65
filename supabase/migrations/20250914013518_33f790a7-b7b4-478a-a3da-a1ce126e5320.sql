-- Adicionar edge function para processar pedidos automaticamente
CREATE OR REPLACE FUNCTION public.process_order_delivery_rules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_record RECORD;
BEGIN
  -- Aprovar automaticamente pedidos de delivery pendentes há mais de 1 minuto
  FOR order_record IN 
    SELECT * FROM orders 
    WHERE status = 'pending' 
    AND LOWER(COALESCE(delivery_type, 'pickup')) = 'delivery'
    AND created_at <= NOW() - INTERVAL '1 minute'
    AND manager_approved IS NULL
  LOOP
    -- Aprovar automaticamente pedidos de delivery
    UPDATE orders 
    SET 
      status = 'approved',
      manager_approved = true,
      approved_at = NOW(),
      manager_notes = COALESCE(manager_notes, '') || ' [Aprovado automaticamente - delivery]',
      updated_at = NOW()
    WHERE id = order_record.id;
    
    -- Criar pedido motoboy se for delivery
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
  
  -- Expirar pedidos de retirada pendentes há mais de 30 minutos
  UPDATE orders 
  SET 
    status = 'expired',
    manager_notes = COALESCE(manager_notes, '') || ' [Expirado - não aprovado em 30 minutos]',
    updated_at = NOW()
  WHERE status = 'pending' 
    AND LOWER(COALESCE(delivery_type, 'pickup')) = 'pickup'
    AND created_at <= NOW() - INTERVAL '30 minutes'
    AND manager_approved IS NULL;
END;
$function$;