-- DIAGNÓSTICO COMPLETO: PROBLEMAS DE SALVAMENTO NO SUPABASE
-- Este script verifica TODOS os problemas possíveis que impedem salvamento

-- ========================================
-- 1. VERIFICAR CONFIGURAÇÃO DO BANCO
-- ========================================

SELECT '=== CONFIGURAÇÃO DO BANCO ===' as info;

-- Verificar se o banco está acessível
SELECT 
    current_database() as database_atual,
    current_user as usuario_atual,
    version() as versao_postgres;

-- ========================================
-- 2. VERIFICAR TABELAS CRÍTICAS
-- ========================================

SELECT '=== TABELAS CRÍTICAS ===' as info;

-- Listar todas as tabelas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
-- ========================================

SELECT '=== RLS - ROW LEVEL SECURITY ===' as info;

-- Verificar se RLS está habilitado nas tabelas críticas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY tablename;

-- ========================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT '=== POLÍTICAS RLS ===' as info;

-- Verificar políticas RLS para cada tabela
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
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY tablename, policyname;

-- ========================================
-- 5. VERIFICAR CONSTRAINTS
-- ========================================

SELECT '=== CONSTRAINTS ===' as info;

-- Verificar constraints que podem impedir inserção
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY tc.table_name, tc.constraint_type;

-- ========================================
-- 6. VERIFICAR TRIGGERS
-- ========================================

SELECT '=== TRIGGERS ===' as info;

-- Verificar triggers que podem interferir
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 7. VERIFICAR FUNÇÕES
-- ========================================

SELECT '=== FUNÇÕES ===' as info;

-- Verificar funções que podem interferir
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name LIKE '%check%' 
    OR routine_name LIKE '%insert%'
    OR routine_name LIKE '%update%'
    OR routine_name LIKE '%delete%'
ORDER BY routine_name;

-- ========================================
-- 8. VERIFICAR PERMISSÕES
-- ========================================

SELECT '=== PERMISSÕES ===' as info;

-- Verificar permissões do usuário anônimo
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY table_name, privilege_type;

-- Verificar permissões do usuário authenticated
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated'
    AND table_schema = 'public'
    AND table_name IN ('profiles', 'daily_checkins', 'insights', 'races', 'training_sessions', 'macrociclos', 'mesociclos', 'microciclos', 'fitness_tests', 'coaches', 'athlete_coach_relationships')
ORDER BY table_name, privilege_type;

-- ========================================
-- 9. VERIFICAR DADOS EXISTENTES
-- ========================================

SELECT '=== DADOS EXISTENTES ===' as info;

-- Contar registros em cada tabela
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'daily_checkins', COUNT(*) FROM daily_checkins
UNION ALL
SELECT 'insights', COUNT(*) FROM insights
UNION ALL
SELECT 'races', COUNT(*) FROM races
UNION ALL
SELECT 'training_sessions', COUNT(*) FROM training_sessions
UNION ALL
SELECT 'macrociclos', COUNT(*) FROM macrociclos
UNION ALL
SELECT 'mesociclos', COUNT(*) FROM mesociclos
UNION ALL
SELECT 'microciclos', COUNT(*) FROM microciclos
UNION ALL
SELECT 'fitness_tests', COUNT(*) FROM fitness_tests
UNION ALL
SELECT 'coaches', COUNT(*) FROM coaches
UNION ALL
SELECT 'athlete_coach_relationships', COUNT(*) FROM athlete_coach_relationships;

-- ========================================
-- 10. VERIFICAR LOGS DE ERRO
-- ========================================

SELECT '=== LOGS DE ERRO ===' as info;

-- Verificar se há logs de erro recentes (se disponível)
SELECT 
    'Logs de erro não disponíveis nesta consulta' as info,
    'Verifique os logs do Supabase Dashboard' as acao;

-- ========================================
-- 11. TESTE DE INSERÇÃO SIMPLES
-- ========================================

SELECT '=== TESTE DE INSERÇÃO ===' as info;

-- Teste de inserção em uma tabela simples (se possível)
-- NOTA: Este teste pode falhar se RLS estiver muito restritivo
SELECT 'Teste de inserção não executado automaticamente' as info,
       'Execute manualmente se necessário' as acao;

-- ========================================
-- 12. VERIFICAR CONFIGURAÇÃO DE AUTENTICAÇÃO
-- ========================================

SELECT '=== AUTENTICAÇÃO ===' as info;

-- Verificar se auth.users existe e tem dados
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total_usuarios
FROM auth.users;

-- Verificar usuários recentes
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 13. RESUMO DOS PROBLEMAS POTENCIAIS
-- ========================================

SELECT '=== RESUMO DOS PROBLEMAS POTENCIAIS ===' as info;

SELECT 
    '1. RLS muito restritivo' as problema,
    'Verificar políticas RLS nas tabelas' as solucao
UNION ALL
SELECT 
    '2. Constraints únicos violados',
    'Verificar dados duplicados'
UNION ALL
SELECT 
    '3. Permissões insuficientes',
    'Verificar permissões do usuário authenticated'
UNION ALL
SELECT 
    '4. Triggers interferindo',
    'Verificar triggers nas tabelas'
UNION ALL
SELECT 
    '5. Sessão de autenticação inválida',
    'Verificar auth.users e sessões'
UNION ALL
SELECT 
    '6. Campos obrigatórios não preenchidos',
    'Verificar estrutura das tabelas'
UNION ALL
SELECT 
    '7. Tipos de dados incorretos',
    'Verificar tipos de colunas'
UNION ALL
SELECT 
    '8. Foreign keys inválidas',
    'Verificar referências entre tabelas';
