-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own pregnancy status" ON public.user_pregnancy;
DROP POLICY IF EXISTS "Users can manage their own pregnancy status" ON public.user_pregnancy;

-- Criar políticas corretas para user_pregnancy
CREATE POLICY "Users can view their own pregnancy status" 
ON public.user_pregnancy 
FOR SELECT 
USING (user_id IN (
  SELECT users.id 
  FROM users 
  WHERE users.username = COALESCE(current_setting('app.current_user', true), '')
));

CREATE POLICY "Users can create their own pregnancy" 
ON public.user_pregnancy 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT users.id 
  FROM users 
  WHERE users.username = COALESCE(current_setting('app.current_user', true), '')
));

CREATE POLICY "Users can update their own pregnancy" 
ON public.user_pregnancy 
FOR UPDATE 
USING (user_id IN (
  SELECT users.id 
  FROM users 
  WHERE users.username = COALESCE(current_setting('app.current_user', true), '')
));

CREATE POLICY "Users can delete their own pregnancy" 
ON public.user_pregnancy 
FOR DELETE 
USING (user_id IN (
  SELECT users.id 
  FROM users 
  WHERE users.username = COALESCE(current_setting('app.current_user', true), '')
));