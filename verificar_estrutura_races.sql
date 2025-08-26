-- Script para verificar a estrutura da tabela races
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar estrutura da tabela races
SELECT
    '=== ESTRUTURA DA TABELA RACES ===' as info;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'races'
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela
SELECT
    '=== CONSTRAINTS DA TABELA RACES ===' as info;

SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'races';

-- 3. Verificar índices da tabela
SELECT
    '=== ÍNDICES DA TABELA RACES ===' as info;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'races';

-- 4. Verificar RLS (Row Level Security)
SELECT
    '=== RLS DA TABELA RACES ===' as info;

SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'races';

-- 5. Verificar políticas RLS
SELECT
    '=== POLÍTICAS RLS DA TABELA RACES ===' as info;

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
WHERE tablename = 'races';

-- 6. Verificar se há triggers
SELECT
    '=== TRIGGERS DA TABELA RACES ===' as info;

SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'races';

-- 7. Verificar estatísticas da tabela
SELECT
    '=== ESTATÍSTICAS DA TABELA RACES ===' as info;

SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'races'
ORDER BY attname;
