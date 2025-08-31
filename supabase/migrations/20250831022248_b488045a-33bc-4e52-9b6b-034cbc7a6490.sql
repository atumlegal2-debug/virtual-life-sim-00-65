-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to decrease alcoholism every 5 minutes
SELECT cron.schedule(
  'decrease-alcoholism-every-5-minutes',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://jquhgyqoepmysvoxxgji.supabase.co/functions/v1/alcoholism-decrease',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWhneXFvZXBteXN2b3h4Z2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgxMzEsImV4cCI6MjA3MDk2NDEzMX0.-8sxUtluC-neIpmoQVl-8c6wqq57IwI7wj0xghndPzc"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);