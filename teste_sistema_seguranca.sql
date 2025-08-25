-- =====================================================
-- SCRIPT DE TESTE DO SISTEMA DE SEGURANÇA
-- =====================================================
-- Este script verifica se o sistema de segurança está funcionando
-- =====================================================

-- 1. Verificar existência das tabelas de segurança
SELECT '=== VERIFICAÇÃO DAS TABELAS DE SEGURANÇA ===' as info;

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_name IN (
    'security_logs',
    'security_alerts', 
    'rate_limits',
    'active_sessions',
    'password_recovery_requests'
) AND table_schema = 'public';

-- 2. Criar tabela security_logs se não existir
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verificar estrutura das tabelas principais
SELECT '=== ESTRUTURA DAS TABELAS PRINCIPAIS ===' as info;

-- Verificar profiles
SELECT 'profiles' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar coaches
SELECT 'coaches' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar constraints de segurança
SELECT '=== CONSTRAINTS DE SEGURANÇA ===' as info;

-- Verificar constraint user_type em profiles
SELECT 
    tc.constraint_name,
    tc.table_name,
    cc.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.constraint_type = 'CHECK'
AND cc.check_clause LIKE '%user_type%';

-- 5. Verificar RLS policies
SELECT '=== RLS POLICIES ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'coaches', 'security_logs')
ORDER BY tablename, policyname;

-- 6. Verificar dados existentes
SELECT '=== DADOS EXISTENTES ===' as info;

SELECT 
    'profiles' as tabela, 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_type = 'athlete' THEN 1 END) as atletas,
    COUNT(CASE WHEN user_type = 'coach' THEN 1 END) as treinadores,
    COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as onboarding_completo
FROM profiles
UNION ALL
SELECT 
    'coaches', 
    COUNT(*), 
    NULL, 
    NULL,
    NULL
FROM coaches
UNION ALL
SELECT 
    'security_logs', 
    COUNT(*), 
    NULL, 
    NULL,
    NULL
FROM security_logs;

-- 7. Testar inserção de log de segurança
SELECT '=== TESTE DE INSERÇÃO DE LOG ===' as info;

INSERT INTO security_logs (event_type, event_details, success)
VALUES ('test_security_system', '{"test": true, "timestamp": "' || NOW() || '"}', true)
RETURNING id, event_type, created_at;

-- 8. Verificar usuários auth vs profiles
SELECT '=== VERIFICAÇÃO DE CONSISTÊNCIA AUTH-PROFILES ===' as info;

-- Usuários auth sem profile
SELECT 
    'Usuários auth sem profile' as tipo,
    COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

-- Profiles sem usuário auth
SELECT 
    'Profiles sem usuário auth' as tipo,
    COUNT(*) as quantidade
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL

UNION ALL

-- Coaches sem profile
SELECT 
    'Coaches sem profile' as tipo,
    COUNT(*) as quantidade
FROM coaches c
LEFT JOIN profiles p ON c.id = p.id
WHERE p.id IS NULL;

-- 9. Verificar configurações de segurança
SELECT '=== CONFIGURAÇÕES DE SEGURANÇA ===' as info;

-- Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_ativo
FROM pg_tables 
WHERE tablename IN ('profiles', 'coaches', 'security_logs')
ORDER BY tablename;

-- 10. Estatísticas de segurança
SELECT '=== ESTATÍSTICAS DE SEGURANÇA ===' as info;

SELECT 
    event_type,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN success = true THEN 1 END) as sucessos,
    COUNT(CASE WHEN success = false THEN 1 END) as falhas,
    MIN(created_at) as primeiro_evento,
    MAX(created_at) as ultimo_evento
FROM security_logs
GROUP BY event_type
ORDER BY total_eventos DESC;

-- 11. Recomendações de segurança
SELECT '=== RECOMENDAÇÕES DE SEGURANÇA ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') 
        THEN '✅ RLS ativo em profiles'
        ELSE '❌ RLS não configurado em profiles'
    END as recomendacao

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coaches') 
        THEN '✅ RLS ativo em coaches'
        ELSE '❌ RLS não configurado em coaches'
    END

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') 
        THEN '✅ Campo user_type existe em profiles'
        ELSE '❌ Campo user_type não existe em profiles'
    END

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coaches' AND column_name = 'cref') 
        THEN '✅ Campo cref existe em coaches'
        ELSE '❌ Campo cref não existe em coaches'
    END

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM security_logs WHERE event_type LIKE '%login%') 
        THEN '✅ Logs de login estão sendo registrados'
        ELSE '⚠️ Nenhum log de login encontrado'
    END;

-- 12. Limpar log de teste
DELETE FROM security_logs WHERE event_type = 'test_security_system';

-- 13. Resumo final
SELECT '=== RESUMO DO SISTEMA DE SEGURANÇA ===' as info;

SELECT 
    'Sistema de Autenticação Ultra-Seguro' as sistema,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coaches' AND column_name = 'cref')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
        THEN '✅ CONFIGURADO CORRETAMENTE'
        ELSE '❌ NECESSITA CONFIGURAÇÃO'
    END as status;

-- =====================================================
-- INSTRUÇÕES PÓS-TESTE:
-- 1. Se algum item mostrar ❌, execute os scripts de correção
-- 2. Se tudo mostrar ✅, o sistema está funcionando
-- 3. Monitore os logs de segurança regularmente
-- =====================================================
