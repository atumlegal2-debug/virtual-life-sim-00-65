-- Create or replace the decrease_hunger function with proper PostgreSQL syntax
CREATE OR REPLACE FUNCTION decrease_hunger()
RETURNS JSON AS $$
DECLARE
    hunger_control_record RECORD;
    users_updated_count INTEGER := 0;
    should_decrease BOOLEAN := false;
    next_decrease_seconds INTEGER;
BEGIN
    -- Get or create hunger control record
    SELECT * INTO hunger_control_record 
    FROM hunger_control 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If no record exists, create one
    IF hunger_control_record IS NULL THEN
        INSERT INTO hunger_control (last_decrease_at) 
        VALUES (now()) 
        RETURNING * INTO hunger_control_record;
        should_decrease := true;
    ELSE
        -- Check if 5 minutes have passed since last decrease
        IF EXTRACT(EPOCH FROM (now() - hunger_control_record.last_decrease_at)) >= 300 THEN
            should_decrease := true;
        END IF;
    END IF;
    
    -- Calculate seconds until next decrease
    next_decrease_seconds := GREATEST(0, 300 - EXTRACT(EPOCH FROM (now() - hunger_control_record.last_decrease_at))::INTEGER);
    
    IF should_decrease THEN
        -- Decrease hunger by 1 for all users (minimum 0)
        UPDATE users 
        SET 
            hunger_percentage = GREATEST(0, COALESCE(hunger_percentage, 100) - 1),
            updated_at = now()
        WHERE hunger_percentage > 0;
        
        GET DIAGNOSTICS users_updated_count = ROW_COUNT;
        
        -- Update the control record
        UPDATE hunger_control 
        SET 
            last_decrease_at = now(),
            updated_at = now()
        WHERE id = hunger_control_record.id;
        
        -- Check for users who got hungry and create disease
        INSERT INTO user_diseases (user_id, disease_name, medicine_name, created_at)
        SELECT 
            u.id,
            'Desnutrição',
            'Consulta Médica',
            now()
        FROM users u
        WHERE u.hunger_percentage <= 49 
        AND NOT EXISTS (
            SELECT 1 FROM user_diseases ud 
            WHERE ud.user_id = u.id 
            AND ud.disease_name = 'Desnutrição'
            AND ud.cured_at IS NULL
        );
        
        RETURN json_build_object(
            'decreased', true,
            'users_updated', users_updated_count,
            'message', 'Hunger decreased successfully',
            'next_decrease_in_seconds', 300
        );
    ELSE
        RETURN json_build_object(
            'decreased', false,
            'users_updated', 0,
            'message', 'Too early to decrease hunger',
            'next_decrease_in_seconds', next_decrease_seconds
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_diseases table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_diseases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    disease_name TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    cured_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_diseases
ALTER TABLE user_diseases ENABLE ROW LEVEL SECURITY;

-- Create policies for user_diseases
CREATE POLICY "Users can view their own diseases" ON user_diseases
FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "System can manage diseases" ON user_diseases
FOR ALL USING (true);

-- Create a trigger to update disease percentage when diseases are added/removed
CREATE OR REPLACE FUNCTION update_disease_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update disease percentage based on active diseases
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE users 
        SET disease_percentage = (
            SELECT COUNT(*) * 10 
            FROM user_diseases 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
            AND cured_at IS NULL
        )
        WHERE id = COALESCE(NEW.user_id, OLD.user_id);
        
        RETURN COALESCE(NEW, OLD);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET disease_percentage = (
            SELECT COUNT(*) * 10 
            FROM user_diseases 
            WHERE user_id = OLD.user_id 
            AND cured_at IS NULL
        )
        WHERE id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_disease_percentage ON user_diseases;
CREATE TRIGGER trigger_update_disease_percentage
    AFTER INSERT OR UPDATE OR DELETE ON user_diseases
    FOR EACH ROW EXECUTE FUNCTION update_disease_percentage();