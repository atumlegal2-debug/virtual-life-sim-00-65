-- Create table for hospital treatment requests
CREATE TABLE public.hospital_treatment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  treatment_cost INTEGER NOT NULL,
  request_message TEXT DEFAULT 'Solicitação de tratamento médico',
  status TEXT NOT NULL DEFAULT 'pending',
  manager_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.hospital_treatment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for hospital treatment requests
CREATE POLICY "Users can view all treatment requests" 
ON public.hospital_treatment_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own treatment requests" 
ON public.hospital_treatment_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Hospital managers can update treatment requests" 
ON public.hospital_treatment_requests 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hospital_treatment_requests_updated_at
BEFORE UPDATE ON public.hospital_treatment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();