-- Função robusta para exclusão completa de contas
-- Esta função garante que todos os dados relacionados sejam removidos

-- 1. Criar função para exclusão completa de usuário
CREATE OR REPLACE FUNCTION delete_user_completely(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    deleted_count INTEGER := 0;
    error_message TEXT;
BEGIN
    -- Verificar se o usuário existe
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'ERRO: Usuário não encontrado com email: ' || user_email;
    END IF;
    
    -- Iniciar transação
    BEGIN
        -- 1. Deletar macrociclos do usuário
        DELETE FROM public.macrociclos WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % macrociclos', deleted_count;
        
        -- 2. Deletar mesociclos do usuário
        DELETE FROM public.mesociclos WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % mesociclos', deleted_count;
        
        -- 3. Deletar microciclos do usuário
        DELETE FROM public.microciclos WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % microciclos', deleted_count;
        
        -- 4. Deletar sessões de treino em ciclos
        DELETE FROM public.cycle_training_sessions WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletadas % sessões de treino', deleted_count;
        
        -- 5. Deletar relacionamentos onde o usuário é treinador
        DELETE FROM public.athlete_coach_relationships WHERE coach_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % relacionamentos como treinador', deleted_count;
        
        -- 6. Deletar relacionamentos onde o usuário é atleta
        DELETE FROM public.athlete_coach_relationships WHERE athlete_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % relacionamentos como atleta', deleted_count;
        
        -- 7. Deletar equipes do treinador
        DELETE FROM public.teams WHERE coach_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletadas % equipes', deleted_count;
        
        -- 8. Deletar dados do treinador
        DELETE FROM public.coaches WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % registros de treinador', deleted_count;
        
        -- 9. Deletar perfil do usuário
        DELETE FROM public.profiles WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % perfis', deleted_count;
        
        -- 10. Deletar checkins diários
        DELETE FROM public.daily_checkins WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % checkins', deleted_count;
        
        -- 11. Deletar sessões de treino
        DELETE FROM public.training_sessions WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletadas % sessões de treino', deleted_count;
        
        -- 12. Deletar insights
        DELETE FROM public.insights WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % insights', deleted_count;
        
        -- 13. Deletar testes de fitness
        DELETE FROM public.fitness_tests WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletados % testes de fitness', deleted_count;
        
        -- 14. Deletar corridas
        DELETE FROM public.races WHERE user_id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletadas % corridas', deleted_count;
        
        -- 15. Finalmente, deletar o usuário do auth.users
        DELETE FROM auth.users WHERE id = user_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deletado % usuário do auth', deleted_count;
        
        RETURN 'SUCESSO: Usuário ' || user_email || ' e todos os dados relacionados foram deletados completamente';
        
    EXCEPTION
        WHEN OTHERS THEN
            error_message := 'ERRO durante exclusão: ' || SQLERRM;
            RAISE NOTICE '%', error_message;
            RETURN error_message;
    END;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para listar todos os dados de um usuário antes da exclusão
CREATE OR REPLACE FUNCTION list_user_data(user_email TEXT)
RETURNS TABLE(tabela TEXT, quantidade BIGINT) AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Verificar se o usuário existe
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
    END IF;
    
    RETURN QUERY
    SELECT 'auth.users'::TEXT, COUNT(*)::BIGINT FROM auth.users WHERE id = user_id
    UNION ALL
    SELECT 'profiles'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE user_id = user_id
    UNION ALL
    SELECT 'coaches'::TEXT, COUNT(*)::BIGINT FROM public.coaches WHERE user_id = user_id
    UNION ALL
    SELECT 'macrociclos'::TEXT, COUNT(*)::BIGINT FROM public.macrociclos WHERE user_id = user_id
    UNION ALL
    SELECT 'mesociclos'::TEXT, COUNT(*)::BIGINT FROM public.mesociclos WHERE user_id = user_id
    UNION ALL
    SELECT 'microciclos'::TEXT, COUNT(*)::BIGINT FROM public.microciclos WHERE user_id = user_id
    UNION ALL
    SELECT 'cycle_training_sessions'::TEXT, COUNT(*)::BIGINT FROM public.cycle_training_sessions WHERE user_id = user_id
    UNION ALL
    SELECT 'athlete_coach_relationships (coach)'::TEXT, COUNT(*)::BIGINT FROM public.athlete_coach_relationships WHERE coach_id = user_id
    UNION ALL
    SELECT 'athlete_coach_relationships (athlete)'::TEXT, COUNT(*)::BIGINT FROM public.athlete_coach_relationships WHERE athlete_id = user_id
    UNION ALL
    SELECT 'teams'::TEXT, COUNT(*)::BIGINT FROM public.teams WHERE coach_id = user_id
    UNION ALL
    SELECT 'daily_checkins'::TEXT, COUNT(*)::BIGINT FROM public.daily_checkins WHERE user_id = user_id
    UNION ALL
    SELECT 'training_sessions'::TEXT, COUNT(*)::BIGINT FROM public.training_sessions WHERE user_id = user_id
    UNION ALL
    SELECT 'insights'::TEXT, COUNT(*)::BIGINT FROM public.insights WHERE user_id = user_id
    UNION ALL
    SELECT 'fitness_tests'::TEXT, COUNT(*)::BIGINT FROM public.fitness_tests WHERE user_id = user_id
    UNION ALL
    SELECT 'races'::TEXT, COUNT(*)::BIGINT FROM public.races WHERE user_id = user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Exemplo de uso das funções
-- Para listar dados de um usuário antes de deletar:
-- SELECT * FROM list_user_data('email@exemplo.com');

-- Para deletar completamente um usuário:
-- SELECT delete_user_completely('email@exemplo.com');

-- 4. Função para limpeza completa do banco (CUIDADO!)
CREATE OR REPLACE FUNCTION clean_all_data()
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Limpar todas as tabelas em ordem correta
    DELETE FROM public.cycle_training_sessions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de cycle_training_sessions', deleted_count;
    
    DELETE FROM public.microciclos;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de microciclos', deleted_count;
    
    DELETE FROM public.mesociclos;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de mesociclos', deleted_count;
    
    DELETE FROM public.macrociclos;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de macrociclos', deleted_count;
    
    DELETE FROM public.athlete_coach_relationships;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de athlete_coach_relationships', deleted_count;
    
    DELETE FROM public.teams;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de teams', deleted_count;
    
    DELETE FROM public.coaches;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de coaches', deleted_count;
    
    DELETE FROM public.profiles;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de profiles', deleted_count;
    
    DELETE FROM public.daily_checkins;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de daily_checkins', deleted_count;
    
    DELETE FROM public.training_sessions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de training_sessions', deleted_count;
    
    DELETE FROM public.insights;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de insights', deleted_count;
    
    DELETE FROM public.fitness_tests;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de fitness_tests', deleted_count;
    
    DELETE FROM public.races;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deletados % registros de races', deleted_count;
    
    -- NOTA: auth.users deve ser limpo manualmente ou via interface do Supabase
    
    RETURN 'SUCESSO: Todos os dados foram limpos (exceto auth.users)';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERRO durante limpeza: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
