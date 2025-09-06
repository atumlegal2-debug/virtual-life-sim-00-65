-- Fix any remaining malnutrition issues for users who were treated but still show disease
-- This will ensure all users who had approved malnutrition treatments are properly cured

UPDATE users 
SET disease_percentage = 0 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM hospital_treatment_requests 
  WHERE status = 'accepted' 
  AND treatment_type LIKE '%Desnutrição%'
  AND processed_at IS NOT NULL
) 
AND disease_percentage > 0;