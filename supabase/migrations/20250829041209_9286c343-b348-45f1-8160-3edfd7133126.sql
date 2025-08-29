-- Create function to reset pregnancy
CREATE OR REPLACE FUNCTION reset_user_pregnancy(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user data
    SELECT id INTO user_record
    FROM users 
    WHERE username = p_username;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Delete pregnancy record
    DELETE FROM user_pregnancy 
    WHERE user_id = user_record.id;
    
    RETURN TRUE;
END;
$$;