-- Enable real-time for hospital_treatment_requests table
ALTER TABLE public.hospital_treatment_requests REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already added
DO $$
BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'hospital_treatment_requests'
    ) THEN
        -- Add table to realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_treatment_requests;
    END IF;
END $$;