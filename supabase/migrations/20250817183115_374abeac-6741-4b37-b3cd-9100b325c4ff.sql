-- Create friend_requests table for handling friendship requests
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_friend_requests_addressee ON public.friend_requests(addressee_id, status);
CREATE INDEX idx_friend_requests_requester ON public.friend_requests(requester_id, status);

-- Prevent duplicate friend requests
CREATE UNIQUE INDEX idx_friend_requests_unique ON public.friend_requests(requester_id, addressee_id) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own requests" 
ON public.friend_requests 
FOR SELECT 
USING (
  requester_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
  addressee_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (
  requester_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update their own requests" 
ON public.friend_requests 
FOR UPDATE 
USING (
  addressee_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
  requester_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Add trigger for updating updated_at
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();