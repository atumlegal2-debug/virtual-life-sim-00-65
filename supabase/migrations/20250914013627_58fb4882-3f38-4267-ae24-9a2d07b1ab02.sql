-- Configurar cron job para processar pedidos automaticamente a cada minuto
SELECT cron.schedule(
  'process-orders-every-minute',
  '* * * * *', -- every minute  
  $$
  SELECT net.http_post(
      url:='https://jquhgyqoepmysvoxxgji.supabase.co/functions/v1/process-orders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWhneXFvZXBteXN2b3h4Z2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgxMzEsImV4cCI6MjA3MDk2NDEzMX0.-8sxUtluC-neIpmoQVl-8c6wqq57IwI7wj0xghndPzc"}'::jsonb,
      body:='{"action": "process_orders"}'::jsonb
  ) as request_id;
  $$
);