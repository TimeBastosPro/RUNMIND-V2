-- =====================================================
-- Remoção DEFINITIVA de usuário por e-mail (admin)
-- - Apaga todos os dados relacionados em tabelas do domínio
-- - Remove relacionamentos como atleta e como treinador
-- - Remove perfis e times
-- - Por fim, remove o usuário de auth.users
--
-- Uso manual (SQL Editor):
--   SELECT admin_delete_user_by_email('usuario@dominio.com');
--
-- Segurança:
--   - SECURITY DEFINER: executa com privilégios do dono (postgres, quando criado no SQL editor)
--   - EXECUTE concedido apenas ao "service_role" por padrão
--   - Revogado de PUBLIC
-- =====================================================

CREATE OR REPLACE FUNCTION admin_delete_user_by_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_coach_ids UUID[] := ARRAY[]::UUID[];
  v_deleted_counts JSONB := '{}'::jsonb;
BEGIN
  -- Localizar o usuário pelo e-mail
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email ILIKE p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN format('Usuário com e-mail %s não encontrado em auth.users', p_email);
  END IF;

  -- Capturar IDs de coach associados (se houver)
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[])
    INTO v_coach_ids
  FROM coaches
  WHERE user_id = v_user_id;

  -- Iniciar transação explícita não é permitido dentro da função; usar atomicidade da função

  -- 1) Remover dados de aplicação (ordem que evita FKs)
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'insights';
  IF FOUND THEN
    EXECUTE $$DELETE FROM insights WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('insights', (SELECT COUNT(*) FROM insights WHERE user_id = v_user_id));
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'races';
  IF FOUND THEN
    EXECUTE $$DELETE FROM races WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('races', (SELECT COUNT(*) FROM races WHERE user_id = v_user_id));
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'fitness_tests';
  IF FOUND THEN
    EXECUTE $$DELETE FROM fitness_tests WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('fitness_tests', (SELECT COUNT(*) FROM fitness_tests WHERE user_id = v_user_id));
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'training_sessions';
  IF FOUND THEN
    EXECUTE $$DELETE FROM training_sessions WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('training_sessions', (SELECT COUNT(*) FROM training_sessions WHERE user_id = v_user_id));
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'daily_checkins';
  IF FOUND THEN
    EXECUTE $$DELETE FROM daily_checkins WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('daily_checkins', (SELECT COUNT(*) FROM daily_checkins WHERE user_id = v_user_id));
  END IF;

  -- Tabela legada opcional
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'checkins';
  IF FOUND THEN
    EXECUTE $$DELETE FROM checkins WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('checkins', (SELECT COUNT(*) FROM checkins WHERE user_id = v_user_id));
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'profile_preferences';
  IF FOUND THEN
    EXECUTE $$DELETE FROM profile_preferences WHERE user_id = $1$$ USING v_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('profile_preferences', (SELECT COUNT(*) FROM profile_preferences WHERE user_id = v_user_id));
  END IF;

  -- 2) Relacionamentos como atleta (athlete_id referencia auth.users com ON DELETE CASCADE na maioria dos esquemas, mas vamos garantir)
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'athlete_coach_relationships';
  IF FOUND THEN
    EXECUTE $$DELETE FROM athlete_coach_relationships WHERE athlete_id = $1$$ USING v_user_id;
  END IF;

  -- 3) Dados de treinador: equipes e relacionamentos por coach_id (normalmente CASCADE ao excluir coaches)
  IF array_length(v_coach_ids, 1) IS NOT NULL AND array_length(v_coach_ids, 1) > 0 THEN
    -- Remover relacionamentos onde for coach por segurança (além do CASCADE)
    PERFORM 1 FROM information_schema.tables WHERE table_name = 'athlete_coach_relationships';
    IF FOUND THEN
      EXECUTE $$DELETE FROM athlete_coach_relationships WHERE coach_id = ANY($1)$$ USING v_coach_ids;
    END IF;

    -- Remover equipes explicitamente (além do CASCADE)
    PERFORM 1 FROM information_schema.tables WHERE table_name = 'teams';
    IF FOUND THEN
      EXECUTE $$DELETE FROM teams WHERE coach_id = ANY($1)$$ USING v_coach_ids;
    END IF;
  END IF;

  -- 4) Remover perfis de domínio
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'coaches';
  IF FOUND THEN
    EXECUTE $$DELETE FROM coaches WHERE user_id = $1$$ USING v_user_id;
  END IF;

  PERFORM 1 FROM information_schema.tables WHERE table_name = 'profiles';
  IF FOUND THEN
    EXECUTE $$DELETE FROM profiles WHERE id = $1$$ USING v_user_id;
  END IF;

  -- 5) Por fim, remover da tabela de autenticação
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN format('Usuário %s (%s) removido com sucesso de todas as tabelas conhecidas.', p_email, v_user_id);
EXCEPTION WHEN OTHERS THEN
  -- Em caso de falha, retornar mensagem de erro
  RETURN format('Falha ao remover %s: %s', p_email, SQLERRM);
END;
$$;

-- Permissões: restringir execução a service_role; ajustar conforme necessidade
REVOKE ALL ON FUNCTION admin_delete_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_user_by_email(TEXT) TO service_role;

