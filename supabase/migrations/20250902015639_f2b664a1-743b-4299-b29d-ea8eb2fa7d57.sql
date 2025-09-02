-- Schedule happiness decrease every 20 minutes
SELECT cron.schedule(
  'happiness-decrease-job',
  '*/20 * * * *', -- Every 20 minutes
  $$
  SELECT
    net.http_post(
      url:='https://jquhgyqoepmysvoxxgji.supabase.co/functions/v1/happiness-decrease',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWhneXFvZXBteXN2b3h4Z2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgxMzEsImV4cCI6MjA3MDk2NDEzMX0.-8sxUtluC-neIpmoQVl-8c6wqq57IwI7wj0xghndPzc"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule energy decrease every 20 minutes (offset by 5 minutes to avoid conflicts)
SELECT cron.schedule(
  'energy-decrease-job',
  '5,25,45 * * * *', -- Every 20 minutes, starting at minute 5
  $$
  SELECT
    net.http_post(
      url:='https://jquhgyqoepmysvoxxgji.supabase.co/functions/v1/energy-decrease',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWhneXFvZXBteXN2b3h4Z2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgxMzEsImV4cCI6MjA3MDk2NDEzMX0.-8sxUtluC-neIpmoQVl-8c6wqq57IwI7wj0xghndPzc"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);