-- Create relationships table to track user relationships
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user1_username TEXT NOT NULL,
  user2_id UUID NOT NULL,
  user2_username TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('dating', 'engagement', 'marriage')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for relationships
CREATE POLICY "Users can view relationships involving them" 
ON public.relationships 
FOR SELECT 
USING (
  user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create relationships" 
ON public.relationships 
FOR INSERT 
WITH CHECK (
  user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update their relationships" 
ON public.relationships 
FOR UPDATE 
USING (
  user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can delete their relationships" 
ON public.relationships 
FOR DELETE 
USING (
  user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Create proposal_requests table for storing romantic proposals
CREATE TABLE public.proposal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  from_username TEXT NOT NULL,
  to_user_id UUID NOT NULL,
  to_username TEXT NOT NULL,
  ring_data JSONB NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('dating', 'engagement', 'marriage')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.proposal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for proposal_requests
CREATE POLICY "Users can view proposals involving them" 
ON public.proposal_requests 
FOR SELECT 
USING (
  from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR 
  to_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create proposals" 
ON public.proposal_requests 
FOR INSERT 
WITH CHECK (
  from_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update proposals directed to them" 
ON public.proposal_requests 
FOR UPDATE 
USING (
  to_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Add relationship_status column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single' 
CHECK (relationship_status IN ('single', 'dating', 'engaged', 'married'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_relationships_updated_at
BEFORE UPDATE ON public.relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposal_requests_updated_at
BEFORE UPDATE ON public.proposal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();