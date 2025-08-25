-- Primeiro, vamos identificar e limpar apenas os usuários problemáticos sem auth_user_id
-- e suas dependências relacionadas

-- Obter IDs dos usuários sem auth_user_id válido
DO $$
DECLARE
    user_ids_to_delete uuid[];
BEGIN
    -- Encontrar usuários sem auth_user_id válido
    SELECT array_agg(id) INTO user_ids_to_delete
    FROM public.users 
    WHERE auth_user_id IS NULL OR auth_user_id NOT IN (
        SELECT id FROM auth.users
    );
    
    -- Se há usuários para deletar
    IF array_length(user_ids_to_delete, 1) > 0 THEN
        -- Deletar registros dependentes primeiro
        DELETE FROM public.manager_sales WHERE order_id IN (
            SELECT id FROM public.orders WHERE user_id = ANY(user_ids_to_delete)
        );
        
        DELETE FROM public.orders WHERE user_id = ANY(user_ids_to_delete);
        DELETE FROM public.inventory WHERE user_id = ANY(user_ids_to_delete);
        DELETE FROM public.friend_requests WHERE requester_id = ANY(user_ids_to_delete) OR addressee_id = ANY(user_ids_to_delete);
        DELETE FROM public.user_interactions WHERE user_id = ANY(user_ids_to_delete) OR target_user_id = ANY(user_ids_to_delete);
        DELETE FROM public.user_pregnancy WHERE user_id = ANY(user_ids_to_delete);
        DELETE FROM public.hospital_birth_requests WHERE user_id = ANY(user_ids_to_delete);
        DELETE FROM public.hospital_treatment_requests WHERE user_id = ANY(user_ids_to_delete);
        DELETE FROM public.proposal_requests WHERE from_user_id = ANY(user_ids_to_delete) OR to_user_id = ANY(user_ids_to_delete);
        DELETE FROM public.relationships WHERE user1_id = ANY(user_ids_to_delete) OR user2_id = ANY(user_ids_to_delete);
        DELETE FROM public.matches WHERE user1_id = ANY(user_ids_to_delete) OR user2_id = ANY(user_ids_to_delete);
        
        -- Finalmente deletar os usuários
        DELETE FROM public.users WHERE id = ANY(user_ids_to_delete);
    END IF;
END
$$;