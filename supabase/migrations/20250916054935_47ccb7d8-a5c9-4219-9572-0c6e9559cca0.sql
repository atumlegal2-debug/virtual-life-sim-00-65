-- Remove 80% floor on malnutrition cures and keep proper clamping
-- 1) Update cure_malnutrition to add +60 (max 100) instead of GREATEST(...,80)
CREATE OR REPLACE FUNCTION public.cure_malnutrition(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  UPDATE public.users
  SET 
    disease_percentage = 0,
    hunger_percentage = LEAST(100, COALESCE(hunger_percentage, 0) + 60),
    life_percentage = GREATEST(COALESCE(life_percentage, 0), 50),
    updated_at = now()
  WHERE id = target_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_diseases'
  ) THEN
    UPDATE public.user_diseases
    SET cured_at = now()
    WHERE user_id = target_user_id
      AND disease_name IN ('Desnutrição','Malnutrition')
      AND cured_at IS NULL;
  END IF;

  RETURN v_rows > 0;
END;
$$;

-- 2) Update cure_patient_treatment branch for Desnutrição
CREATE OR REPLACE FUNCTION public.cure_patient_treatment(p_user_id uuid, p_treatment_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  CASE LOWER(p_treatment_type)
    WHEN 'consulta médica', 'consulta', 'checkup', 'check-in' THEN
      UPDATE public.users
      SET 
        life_percentage = LEAST(100, COALESCE(life_percentage, 0) + 20),
        happiness_percentage = LEAST(100, COALESCE(happiness_percentage, 0) + 15),
        disease_percentage = GREATEST(0, COALESCE(disease_percentage, 0) - 10),
        updated_at = now()
      WHERE id = p_user_id;
      
    WHEN 'consulta especializada', 'especializada' THEN
      UPDATE public.users
      SET 
        life_percentage = LEAST(100, COALESCE(life_percentage, 0) + 35),
        happiness_percentage = LEAST(100, COALESCE(happiness_percentage, 0) + 25),
        disease_percentage = GREATEST(0, COALESCE(disease_percentage, 0) - 25),
        energy_percentage = LEAST(100, COALESCE(energy_percentage, 0) + 20),
        updated_at = now()
      WHERE id = p_user_id;
      
    WHEN 'cirurgia', 'surgery' THEN
      UPDATE public.users
      SET 
        life_percentage = 100,
        happiness_percentage = LEAST(100, COALESCE(happiness_percentage, 0) + 30),
        disease_percentage = 0,
        energy_percentage = LEAST(100, COALESCE(energy_percentage, 0) + 40),
        updated_at = now()
      WHERE id = p_user_id;
      
    WHEN 'desnutrição', 'malnutrition' THEN
      UPDATE public.users
      SET 
        disease_percentage = 0,
        hunger_percentage = LEAST(100, COALESCE(hunger_percentage, 0) + 60),
        life_percentage = GREATEST(COALESCE(life_percentage, 0), 50),
        updated_at = now()
      WHERE id = p_user_id;
      
    ELSE
      UPDATE public.users
      SET 
        life_percentage = LEAST(100, COALESCE(life_percentage, 0) + 25),
        disease_percentage = GREATEST(0, COALESCE(disease_percentage, 0) - 15),
        updated_at = now()
      WHERE id = p_user_id;
  END CASE;
  
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;