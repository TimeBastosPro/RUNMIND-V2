-- Script para testar e diagnosticar o problema de salvar múltiplas provas
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar se há constraints únicas que podem estar impedindo múltiplas provas
SELECT
    '=== CONSTRAINTS ÚNICAS NA TABELA RACES ===' as info;

SELECT
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
WHERE tc.table_name = 'races'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Verificar se há triggers que podem estar interferindo
SELECT
    '=== TRIGGERS NA TABELA RACES ===' as info;

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'races'
ORDER BY trigger_name;

-- 3. Verificar políticas RLS que podem estar bloqueando inserções
SELECT
    '=== POLÍTICAS RLS PARA INSERÇÃO ===' as info;

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
WHERE tablename = 'races'
    AND cmd = 'INSERT'
ORDER BY policyname;

-- 4. Verificar se há problemas com dados existentes
SELECT
    '=== ANÁLISE DE DADOS EXISTENTES ===' as info;

-- Verificar se há provas com dados duplicados (mesmo nome, data e cidade)
SELECT
    'PROVAS COM DADOS POTENCIALMENTE DUPLICADOS:' as info;

SELECT
    event_name,
    start_date,
    city,
    COUNT(*) as quantidade,
    array_agg(user_id) as usuarios
FROM races
GROUP BY event_name, start_date, city
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. Verificar se há problemas com datas
SELECT
    'PROBLEMAS COM DATAS:' as info;

SELECT
    id,
    user_id,
    event_name,
    start_date,
    CASE 
        WHEN start_date IS NULL THEN 'DATA NULA'
        WHEN start_date < '1900-01-01' THEN 'DATA MUITO ANTIGA'
        WHEN start_date > '2100-01-01' THEN 'DATA MUITO FUTURA'
        WHEN start_date::text !~ '^\d{4}-\d{2}-\d{2}$' THEN 'FORMATO INVÁLIDO'
        ELSE 'DATA VÁLIDA'
    END as status_data
FROM races
WHERE start_date IS NULL 
   OR start_date < '1900-01-01' 
   OR start_date > '2100-01-01'
   OR start_date::text !~ '^\d{4}-\d{2}-\d{2}$';

-- 6. Teste de inserção manual (comentado para segurança)
SELECT
    '=== TESTE DE INSERÇÃO MANUAL ===' as info;

-- Descomente e execute uma linha por vez para testar:
-- INSERT INTO races (user_id, event_name, city, start_date, start_time, distance_km) 
-- VALUES ('SEU_USER_ID_AQUI', 'Teste Prova 1', 'São Paulo', '2025-02-15', '08:00', 10.0);

-- INSERT INTO races (user_id, event_name, city, start_date, start_time, distance_km) 
-- VALUES ('SEU_USER_ID_AQUI', 'Teste Prova 2', 'Rio de Janeiro', '2025-03-20', '07:30', 21.1);

-- 7. Verificar logs de erro recentes (se disponível)
SELECT
    '=== LOGS DE ERRO RECENTES ===' as info;

-- Esta consulta pode não funcionar dependendo das permissões
-- SELECT * FROM pg_stat_activity 
-- WHERE query LIKE '%races%' 
-- AND state = 'active'
-- ORDER BY query_start DESC;

-- 8. Verificar se há problemas de permissão
SELECT
    '=== PERMISSÕES DA TABELA RACES ===' as info;

SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'races'
ORDER BY grantee, privilege_type;

-- 9. Verificar se há problemas com o tipo de dados
SELECT
    '=== TIPOS DE DADOS DA TABELA RACES ===' as info;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'races'
ORDER BY ordinal_position;

-- 10. Verificar se há problemas com índices
SELECT
    '=== ÍNDICES DA TABELA RACES ===' as info;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'races'
ORDER BY indexname;
