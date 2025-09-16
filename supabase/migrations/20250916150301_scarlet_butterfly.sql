/*
  # Corrigir sistema de diminuição de fome

  1. Função Atualizada
    - Ajustar timing para 10 minutos (600 segundos)
    - Melhorar controle de timing global
    - Garantir que todos os usuários sejam afetados

  2. Controle de Timing
    - Usar tabela `stat_decrease_control` para controle global
    - Verificar se passaram 10 minutos desde a última diminuição
    - Aplicar diminuição para TODOS os usuários ativos

  3. Correções
    - Remover verificações individuais por usuário
    - Usar controle global de timing
    - Garantir consistência na diminuição
*/

-- Primeiro, vamos garantir que existe um registro de controle
INSERT INTO stat_decrease_control (id, last_hunger_decrease) 
VALUES (1, NULL) 
ON CONFLICT (id) DO NOTHING;

-- Atualizar a função de diminuição de fome para usar timing correto (10 minutos)
CREATE OR REPLACE FUNCTION decrease_hunger()
RETURNS JSON AS $$
DECLARE
  last_decrease_time TIMESTAMP;
  current_time TIMESTAMP := NOW();
  time_diff_seconds INTEGER;
  users_updated INTEGER := 0;
  should_decrease BOOLEAN := FALSE;
BEGIN
  -- Buscar o último momento de diminuição global
  SELECT last_hunger_decrease INTO last_decrease_time
  FROM stat_decrease_control 
  WHERE id = 1;
  
  -- Se nunca houve diminuição ou se passaram 10 minutos (600 segundos)
  IF last_decrease_time IS NULL THEN
    should_decrease := TRUE;
    time_diff_seconds := 0;
  ELSE
    time_diff_seconds := EXTRACT(EPOCH FROM (current_time - last_decrease_time))::INTEGER;
    should_decrease := time_diff_seconds >= 600; -- 10 minutos = 600 segundos
  END IF;
  
  -- Log para debug
  RAISE NOTICE 'Hunger decrease check: last=%, current=%, diff=%s, should=%', 
    last_decrease_time, current_time, time_diff_seconds, should_decrease;
  
  IF should_decrease THEN
    -- Diminuir fome de TODOS os usuários em 1 ponto
    UPDATE users 
    SET hunger_percentage = GREATEST(0, COALESCE(hunger_percentage, 100) - 1),
        updated_at = current_time
    WHERE hunger_percentage > 0; -- Só atualiza quem tem fome > 0
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    -- Atualizar o controle global
    UPDATE stat_decrease_control 
    SET last_hunger_decrease = current_time
    WHERE id = 1;
    
    RAISE NOTICE 'Hunger decreased for % users', users_updated;
    
    RETURN JSON_BUILD_OBJECT(
      'decreased', TRUE,
      'users_updated', users_updated,
      'message', 'Fome diminuída com sucesso',
      'timestamp', current_time,
      'seconds_since_last', time_diff_seconds
    );
  ELSE
    RETURN JSON_BUILD_OBJECT(
      'decreased', FALSE,
      'users_updated', 0,
      'message', 'Ainda não é hora de diminuir a fome',
      'next_decrease_in_seconds', 600 - time_diff_seconds,
      'seconds_since_last', time_diff_seconds
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro na diminuição de fome: %', SQLERRM;
  RETURN JSON_BUILD_OBJECT(
    'decreased', FALSE,
    'error', SQLERRM,
    'users_updated', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;