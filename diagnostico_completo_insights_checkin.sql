-- DIAGNÓSTICO COMPLETO: CHECK-INS E INSIGHTS
-- Este script verifica TODOS os problemas possíveis

-- ========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

SELECT '=== ESTRUTURA DA TABELA daily_checkins ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins'
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA DA TABELA insights ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'insights'
ORDER BY ordinal_position;

-- ========================================
-- 2. VERIFICAR CONSTRAINTS E RLS
-- ========================================

SELECT '=== CONSTRAINTS DA TABELA daily_checkins ===' as info;
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'daily_checkins';

SELECT '=== CONSTRAINTS DA TABELA insights ===' as info;
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'insights';

-- ========================================
-- 3. VERIFICAR RLS (Row Level Security)
-- ========================================

SELECT '=== RLS DA TABELA daily_checkins ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'daily_checkins';

SELECT '=== RLS DA TABELA insights ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'insights';

-- ========================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT '=== POLÍTICAS RLS DA TABELA daily_checkins ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'daily_checkins';

SELECT '=== POLÍTICAS RLS DA TABELA insights ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'insights';

-- ========================================
-- 5. VERIFICAR DADOS ATUAIS
-- ========================================

SELECT '=== CHECK-INS DE HOJE ===' as info;
SELECT 
    id,
    user_id,
    date,
    sleep_quality,
    soreness,
    motivation,
    confidence,
    created_at,
    updated_at
FROM daily_checkins 
WHERE DATE(date) = CURRENT_DATE
ORDER BY created_at DESC;

SELECT '=== CHECK-INS ÚLTIMOS 7 DIAS ===' as info;
SELECT 
    id,
    user_id,
    date,
    sleep_quality,
    soreness,
    motivation,
    confidence,
    created_at
FROM daily_checkins 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

SELECT '=== INSIGHTS DE HOJE ===' as info;
SELECT 
    id,
    user_id,
    insight_type,
    context_type,
    generated_by,
    created_at,
    LEFT(insight_text, 100) as preview
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

SELECT '=== INSIGHTS ÚLTIMOS 7 DIAS ===' as info;
SELECT 
    id,
    user_id,
    insight_type,
    context_type,
    generated_by,
    created_at,
    LEFT(insight_text, 100) as preview
FROM insights 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ========================================
-- 6. VERIFICAR USUÁRIOS ATIVOS
-- ========================================

SELECT '=== USUÁRIOS ATIVOS ===' as info;
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    p.onboarding_completed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY u.created_at DESC;

-- ========================================
-- 7. VERIFICAR CHECK-INS SEM INSIGHTS
-- ========================================

SELECT '=== CHECK-INS SEM INSIGHTS CORRESPONDENTES ===' as info;
SELECT 
    dc.id as checkin_id,
    dc.user_id,
    dc.date,
    dc.sleep_quality,
    dc.soreness,
    dc.motivation,
    dc.created_at as checkin_created,
    i.id as insight_id,
    i.created_at as insight_created
FROM daily_checkins dc
LEFT JOIN insights i ON dc.user_id = i.user_id 
    AND DATE(dc.date) = DATE(i.created_at)
    AND i.context_type = 'daily_checkin'
WHERE DATE(dc.date) >= CURRENT_DATE - INTERVAL '7 days'
    AND i.id IS NULL
ORDER BY dc.created_at DESC;

-- ========================================
-- 8. VERIFICAR INSIGHTS ÓRFÃOS
-- ========================================

SELECT '=== INSIGHTS SEM USUÁRIO VÁLIDO ===' as info;
SELECT 
    i.id,
    i.user_id,
    i.insight_type,
    i.created_at,
    LEFT(i.insight_text, 50) as preview
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- ========================================
-- 9. VERIFICAR TRIGGERS
-- ========================================

SELECT '=== TRIGGERS NA TABELA daily_checkins ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'daily_checkins';

SELECT '=== TRIGGERS NA TABELA insights ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'insights';

-- ========================================
-- 10. VERIFICAR FUNÇÕES RELACIONADAS
-- ========================================

SELECT '=== FUNÇÕES RELACIONADAS A INSIGHTS ===' as info;
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND prosrc ILIKE '%insight%'
ORDER BY proname;

-- ========================================
-- 11. VERIFICAR ESTATÍSTICAS
-- ========================================

SELECT '=== ESTATÍSTICAS DA TABELA daily_checkins ===' as info;
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'daily_checkins'
ORDER BY attname;

SELECT '=== ESTATÍSTICAS DA TABELA insights ===' as info;
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'insights'
ORDER BY attname;

-- ========================================
-- 12. VERIFICAR LOGS DE ERRO (se disponível)
-- ========================================

SELECT '=== ÚLTIMOS LOGS DE ERRO ===' as info;
-- Esta consulta pode não funcionar dependendo das permissões
-- SELECT * FROM pg_stat_activity WHERE state = 'active' AND query ILIKE '%error%';
