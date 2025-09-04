-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to auto-approve expired motoboy orders
SELECT cron.schedule(
  'auto-approve-motoboy-orders',
  '* * * * *', -- every minute
  $$
  UPDATE motoboy_orders 
  SET 
    manager_status = 'approved',
    manager_notes = 'Aprovado automaticamente após 1 minuto',
    manager_processed_at = now()
  WHERE 
    manager_status = 'pending' 
    AND created_at < now() - interval '1 minute';
  $$
);