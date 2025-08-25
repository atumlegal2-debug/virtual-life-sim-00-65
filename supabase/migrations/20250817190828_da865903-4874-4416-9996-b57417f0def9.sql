-- Add user security code (4 digits, private)
ALTER TABLE public.users 
ADD COLUMN user_code TEXT CHECK (user_code ~ '^[0-9]{4}$');

-- Generate random 4-digit codes for existing users
UPDATE public.users 
SET user_code = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE user_code IS NULL;

-- Make user_code required for new users
ALTER TABLE public.users 
ALTER COLUMN user_code SET NOT NULL;

-- Create hospital birth requests table
CREATE TABLE public.hospital_birth_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  request_message TEXT DEFAULT 'Solicitação de parto',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  manager_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for hospital birth requests
ALTER TABLE public.hospital_birth_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for hospital birth requests
CREATE POLICY "Users can view their own birth requests" 
ON public.hospital_birth_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own birth requests" 
ON public.hospital_birth_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Hospital managers can update birth requests" 
ON public.hospital_birth_requests 
FOR UPDATE 
USING (true);

-- Create pregnancy status table to track pregnancy
CREATE TABLE public.user_pregnancy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pregnancy_percentage NUMERIC DEFAULT 0.00 CHECK (pregnancy_percentage >= 0 AND pregnancy_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user pregnancy
ALTER TABLE public.user_pregnancy ENABLE ROW LEVEL SECURITY;

-- RLS policies for user pregnancy
CREATE POLICY "Users can view their own pregnancy status" 
ON public.user_pregnancy 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own pregnancy status" 
ON public.user_pregnancy 
FOR ALL 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_hospital_birth_requests_updated_at
BEFORE UPDATE ON public.hospital_birth_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_pregnancy_updated_at
BEFORE UPDATE ON public.user_pregnancy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();