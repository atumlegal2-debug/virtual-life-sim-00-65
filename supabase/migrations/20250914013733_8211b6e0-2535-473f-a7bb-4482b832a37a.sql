-- Create cron job to process orders every minute
SELECT cron.schedule(
  'process-orders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://jquhgyqoepmysvoxxgji.supabase.co/functions/v1/process-orders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWhneXFvZXBteXN2b3h4Z2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgxMzEsImV4cCI6MjA3MDk2NDEzMX0.-8sxUtluC-neIpmoQVl-8c6wqq57IwI7wj0xghndPzc"}'::jsonb,
    body:='{"timestamp": "' || now() || '"}'::jsonb
  ) as request_id;
  $$
);