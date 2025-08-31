-- Enable realtime for hospital_treatment_requests table
ALTER TABLE public.hospital_treatment_requests REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_treatment_requests;