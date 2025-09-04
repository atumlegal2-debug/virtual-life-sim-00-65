-- Ensure realtime works for hospital treatments and users updates
-- 1) Use REPLICA IDENTITY FULL so updates include full row data
ALTER TABLE public.hospital_treatment_requests REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- 2) Add tables to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'hospital_treatment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_treatment_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;