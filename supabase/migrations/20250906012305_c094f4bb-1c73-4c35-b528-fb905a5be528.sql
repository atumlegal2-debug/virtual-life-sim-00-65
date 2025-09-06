-- Create a new edge function for malnutrition and disease progression
CREATE OR REPLACE FUNCTION public.update_disease_from_malnutrition()
RETURNS TABLE(
  decreased boolean,
  users_updated integer,
  message text
) AS $$
DECLARE
  control_record RECORD;
  last_check_time timestamp;
  users_affected integer := 0;
  check_interval_minutes integer := 10; -- Check every 10 minutes
BEGIN
  -- Get or create control record
  SELECT * INTO control_record 
  FROM stat_decrease_control 
  WHERE id = 1;
  
  IF control_record IS NULL THEN
    INSERT INTO stat_decrease_control (id, last_hunger_decrease) 
    VALUES (1, now() - interval '11 minutes') 
    RETURNING * INTO control_record;
  END IF;
  
  last_check_time := COALESCE(control_record.last_hunger_decrease, now() - interval '11 minutes');
  
  -- Check if enough time has passed (10 minutes)
  IF (now() - last_check_time) < (check_interval_minutes || ' minutes')::interval THEN
    RETURN QUERY SELECT 
      false::boolean, 
      0::integer, 
      'Too early to check malnutrition. Next check in ' || 
      EXTRACT(epoch FROM (last_check_time + (check_interval_minutes || ' minutes')::interval - now()))::integer || 
      ' seconds'::text;
    RETURN;
  END IF;
  
  -- Update disease percentage for users with low hunger (malnutrition)
  -- If hunger < 30%, increase disease by 5%
  -- If hunger < 15%, increase disease by 10%
  UPDATE users 
  SET 
    disease_percentage = LEAST(100, 
      CASE 
        WHEN hunger_percentage < 15 THEN disease_percentage + 10
        WHEN hunger_percentage < 30 THEN disease_percentage + 5
        ELSE disease_percentage
      END
    ),
    updated_at = now()
  WHERE hunger_percentage < 30 
    AND disease_percentage < 100;
  
  GET DIAGNOSTICS users_affected = ROW_COUNT;
  
  -- Decrease life percentage for users with high disease levels
  -- If disease > 70%, decrease life by 3%
  -- If disease > 50%, decrease life by 2%
  -- If disease > 30%, decrease life by 1%
  UPDATE users 
  SET 
    life_percentage = GREATEST(1, 
      CASE 
        WHEN disease_percentage > 70 THEN life_percentage - 3
        WHEN disease_percentage > 50 THEN life_percentage - 2
        WHEN disease_percentage > 30 THEN life_percentage - 1
        ELSE life_percentage
      END
    ),
    updated_at = now()
  WHERE disease_percentage > 30 
    AND life_percentage > 1;
  
  -- Update the control timestamp
  UPDATE stat_decrease_control 
  SET last_hunger_decrease = now() 
  WHERE id = 1;
  
  RETURN QUERY SELECT 
    true::boolean, 
    users_affected::integer, 
    'Disease progression updated successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new treatment type for malnutrition
INSERT INTO hospital_treatment_requests (user_id, username, treatment_type, treatment_cost, request_message, status)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, 
  'system', 
  'Tratamento para Desnutrição', 
  200, 
  'Tratamento especializado para curar desnutrição e zerar nível de doença', 
  'template'
WHERE NOT EXISTS (
  SELECT 1 FROM hospital_treatment_requests 
  WHERE treatment_type = 'Tratamento para Desnutrição' 
  AND status = 'template'
);

-- Add function to cure malnutrition (to be used by managers)
CREATE OR REPLACE FUNCTION public.cure_malnutrition(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Reset disease percentage to 0 for the specified user
  UPDATE users 
  SET 
    disease_percentage = 0,
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;