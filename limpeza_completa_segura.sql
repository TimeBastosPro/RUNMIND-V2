-- =====================================================
-- SCRIPT DE LIMPEZA COMPLETA ULTRA-SEGURO
-- =====================================================
-- ATENÇÃO: Este script irá APAGAR TODOS os dados do banco
-- Execute apenas se tiver certeza absoluta
-- =====================================================

-- Função para limpar tabela apenas se existir
CREATE OR REPLACE FUNCTION limpar_tabela_se_existir(nome_tabela TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = nome_tabela) THEN
        EXECUTE 'DELETE FROM ' || quote_ident(nome_tabela);
        RAISE NOTICE 'Tabela % limpa com sucesso', nome_tabela;
    ELSE
        RAISE NOTICE 'Tabela % não existe, pulando...', nome_tabela;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para desabilitar RLS apenas se existir
CREATE OR REPLACE FUNCTION desabilitar_rls_se_existir(nome_tabela TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = nome_tabela) THEN
        EXECUTE 'ALTER TABLE ' || quote_ident(nome_tabela) || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS desabilitado na tabela %', nome_tabela;
    ELSE
        RAISE NOTICE 'Tabela % não existe, pulando RLS...', nome_tabela;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para habilitar RLS apenas se existir
CREATE OR REPLACE FUNCTION habilitar_rls_se_existir(nome_tabela TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = nome_tabela) THEN
        EXECUTE 'ALTER TABLE ' || quote_ident(nome_tabela) || ' ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS habilitado na tabela %', nome_tabela;
    ELSE
        RAISE NOTICE 'Tabela % não existe, pulando RLS...', nome_tabela;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. Desabilitar RLS em todas as tabelas
SELECT '=== DESABILITANDO RLS ===' as etapa;

SELECT desabilitar_rls_se_existir('insights');
SELECT desabilitar_rls_se_existir('daily_checkins');
SELECT desabilitar_rls_se_existir('training_sessions');
SELECT desabilitar_rls_se_existir('profiles');
SELECT desabilitar_rls_se_existir('coaches');
SELECT desabilitar_rls_se_existir('athlete_coach_relationships');
SELECT desabilitar_rls_se_existir('security_logs');
SELECT desabilitar_rls_se_existir('security_alerts');
SELECT desabilitar_rls_se_existir('rate_limits');
SELECT desabilitar_rls_se_existir('active_sessions');
SELECT desabilitar_rls_se_existir('password_recovery_requests');

-- 2. Limpar todas as tabelas de dados
SELECT '=== LIMPANDO DADOS ===' as etapa;

-- Tabelas principais (sempre existem)
SELECT limpar_tabela_se_existir('training_sessions');
SELECT limpar_tabela_se_existir('daily_checkins');
SELECT limpar_tabela_se_existir('insights');
SELECT limpar_tabela_se_existir('athlete_coach_relationships');
SELECT limpar_tabela_se_existir('coaches');
SELECT limpar_tabela_se_existir('profiles');

-- Tabelas de ciclos (podem não existir)
SELECT limpar_tabela_se_existir('mesociclos');
SELECT limpar_tabela_se_existir('macrociclos');
SELECT limpar_tabela_se_existir('microciclos');

-- Tabelas de segurança (podem não existir)
SELECT limpar_tabela_se_existir('security_logs');
SELECT limpar_tabela_se_existir('security_alerts');
SELECT limpar_tabela_se_existir('rate_limits');
SELECT limpar_tabela_se_existir('active_sessions');
SELECT limpar_tabela_se_existir('password_recovery_requests');

-- Outras tabelas (podem não existir)
SELECT limpar_tabela_se_existir('fitness_tests');
SELECT limpar_tabela_se_existir('races');
SELECT limpar_tabela_se_existir('teams');
SELECT limpar_tabela_se_existir('personalized_insights');

-- 3. Resetar sequências (apenas se existirem)
SELECT '=== RESETANDO SEQUÊNCIAS ===' as etapa;

DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_name LIKE '%_id_seq'
        AND sequence_name NOT LIKE '%refresh_tokens%'
        AND sequence_name NOT LIKE '%auth%'
    LOOP
        BEGIN
            EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_name) || ' RESTART WITH 1';
            RAISE NOTICE 'Sequência % resetada', seq_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao resetar sequência %: %', seq_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Reabilitar RLS em todas as tabelas
SELECT '=== REABILITANDO RLS ===' as etapa;

SELECT habilitar_rls_se_existir('insights');
SELECT habilitar_rls_se_existir('daily_checkins');
SELECT habilitar_rls_se_existir('training_sessions');
SELECT habilitar_rls_se_existir('profiles');
SELECT habilitar_rls_se_existir('coaches');
SELECT habilitar_rls_se_existir('athlete_coach_relationships');
SELECT habilitar_rls_se_existir('security_logs');
SELECT habilitar_rls_se_existir('security_alerts');
SELECT habilitar_rls_se_existir('rate_limits');
SELECT habilitar_rls_se_existir('active_sessions');
SELECT habilitar_rls_se_existir('password_recovery_requests');

-- 5. Verificar limpeza
SELECT '=== VERIFICANDO LIMPEZA ===' as etapa;

-- Verificar tabelas principais
SELECT 
    'profiles' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'coaches', COUNT(*) FROM coaches
UNION ALL
SELECT 'insights', COUNT(*) FROM insights
UNION ALL
SELECT 'daily_checkins', COUNT(*) FROM daily_checkins
UNION ALL
SELECT 'training_sessions', COUNT(*) FROM training_sessions
UNION ALL
SELECT 'athlete_coach_relationships', COUNT(*) FROM athlete_coach_relationships;

-- Verificar outras tabelas (apenas se existirem)
DO $$
DECLARE
    tabela TEXT;
    contagem INTEGER;
BEGIN
    FOR tabela IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name IN ('mesociclos', 'macrociclos', 'microciclos', 'fitness_tests', 'races', 'teams', 'personalized_insights', 'security_logs', 'security_alerts', 'rate_limits', 'active_sessions', 'password_recovery_requests')
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(tabela) INTO contagem;
        RAISE NOTICE 'Tabela %: % registros', tabela, contagem;
    END LOOP;
END $$;

-- 6. Limpar funções auxiliares
DROP FUNCTION IF EXISTS limpar_tabela_se_existir(TEXT);
DROP FUNCTION IF EXISTS desabilitar_rls_se_existir(TEXT);
DROP FUNCTION IF EXISTS habilitar_rls_se_existir(TEXT);

-- 7. Resumo final
SELECT '=== RESUMO DA LIMPEZA ===' as etapa;
SELECT '✅ LIMPEZA COMPLETA REALIZADA COM SUCESSO!' as resultado;
SELECT '🔄 Todos os dados foram removidos do banco de dados' as status;
SELECT '📝 Execute a limpeza local e teste o novo sistema' as proximo_passo;

-- =====================================================
-- IMPORTANTE: Após executar este script, você precisará:
-- 1. Apagar manualmente os usuários do Supabase Auth
-- 2. Limpar dados locais do app usando o script limpeza_local_simples.js
-- 3. Testar o novo sistema de cadastro
-- =====================================================
