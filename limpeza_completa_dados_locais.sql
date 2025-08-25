-- =====================================================
-- SCRIPT DE LIMPEZA COMPLETA DE DADOS LOCAIS
-- =====================================================
-- ATENÇÃO: Este script irá APAGAR TODOS os dados do banco
-- Execute apenas se tiver certeza absoluta
-- =====================================================

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS apenas se as tabelas existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
        ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') THEN
        ALTER TABLE security_alerts DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
        ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_sessions') THEN
        ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_recovery_requests') THEN
        ALTER TABLE password_recovery_requests DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Limpar dados de treinamento
DELETE FROM training_sessions;

-- Limpar dados de ciclos (apenas se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mesociclos') THEN
        DELETE FROM mesociclos;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'macrociclos') THEN
        DELETE FROM macrociclos;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'microciclos') THEN
        DELETE FROM microciclos;
    END IF;
END $$;

-- 3. Limpar dados de check-in
DELETE FROM daily_checkins;

-- 4. Limpar insights
DELETE FROM insights;

-- 5. Limpar relacionamentos treinador-atleta
DELETE FROM athlete_coach_relationships;

-- 6. Limpar dados de treinadores
DELETE FROM coaches;

-- 7. Limpar perfis de usuários
DELETE FROM profiles;

-- 8. Limpar logs de segurança (apenas se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
        DELETE FROM security_logs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') THEN
        DELETE FROM security_alerts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
        DELETE FROM rate_limits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_sessions') THEN
        DELETE FROM active_sessions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_recovery_requests') THEN
        DELETE FROM password_recovery_requests;
    END IF;
END $$;

-- 9. Limpar dados de testes físicos (apenas se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_tests') THEN
        DELETE FROM fitness_tests;
    END IF;
END $$;

-- 10. Limpar dados de corridas (apenas se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'races') THEN
        DELETE FROM races;
    END IF;
END $$;

-- 11. Limpar dados de equipes (apenas se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        DELETE FROM teams;
    END IF;
END $$;

-- 12. Limpar dados de insights personalizados (apenas se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personalized_insights') THEN
        DELETE FROM personalized_insights;
    END IF;
END $$;

-- 13. Resetar sequências (se existirem)
-- Nota: Ajuste os nomes das sequências conforme necessário
DO $$
BEGIN
    -- Resetar sequências para IDs
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'profiles_id_seq') THEN
        ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'coaches_id_seq') THEN
        ALTER SEQUENCE coaches_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'insights_id_seq') THEN
        ALTER SEQUENCE insights_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'daily_checkins_id_seq') THEN
        ALTER SEQUENCE daily_checkins_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'training_sessions_id_seq') THEN
        ALTER SEQUENCE training_sessions_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 14. Reabilitar RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- Reabilitar RLS apenas se as tabelas existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
        ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') THEN
        ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
        ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_sessions') THEN
        ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_recovery_requests') THEN
        ALTER TABLE password_recovery_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 15. Verificar limpeza
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

-- Verificar tabelas de segurança (apenas se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
        RAISE NOTICE 'security_logs: % registros', (SELECT COUNT(*) FROM security_logs);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') THEN
        RAISE NOTICE 'security_alerts: % registros', (SELECT COUNT(*) FROM security_alerts);
    END IF;
END $$;

-- =====================================================
-- IMPORTANTE: Após executar este script, você precisará:
-- 1. Apagar manualmente os usuários do Supabase Auth
-- 2. Limpar dados locais do app usando o script forcar_limpeza_local.ts
-- 3. Testar o novo sistema de cadastro
-- =====================================================
