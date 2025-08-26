-- Script para verificar provas no banco de dados
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar todas as provas no banco
SELECT
    '=== TODAS AS PROVAS NO BANCO ===' as info;

SELECT
    id,
    user_id,
    event_name,
    city,
    start_date,
    start_time,
    distance_km,
    created_at,
    updated_at
FROM races
ORDER BY start_date ASC;

-- 2. Verificar provas por usuário específico (substitua pelo ID do usuário)
SELECT
    '=== PROVAS POR USUÁRIO ===' as info;

-- Substitua 'USER_ID_AQUI' pelo ID real do usuário
SELECT
    id,
    event_name,
    city,
    start_date,
    start_time,
    distance_km,
    created_at
FROM races
WHERE user_id = 'USER_ID_AQUI'  -- Substitua pelo ID real
ORDER BY start_date ASC;

-- 3. Verificar provas futuras (a partir de hoje)
SELECT
    '=== PROVAS FUTURAS ===' as info;

SELECT
    id,
    user_id,
    event_name,
    city,
    start_date,
    start_time,
    distance_km
FROM races
WHERE start_date >= CURRENT_DATE
ORDER BY start_date ASC;

-- 4. Verificar estrutura da tabela
SELECT
    '=== ESTRUTURA DA TABELA RACES ===' as info;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'races'
ORDER BY ordinal_position;

-- 5. ✅ NOVO: Verificar se há provas com datas inválidas
SELECT
    '=== PROVAS COM DATAS INVÁLIDAS ===' as info;

SELECT
    id,
    user_id,
    event_name,
    start_date,
    CASE 
        WHEN start_date IS NULL THEN 'DATA NULA'
        WHEN start_date < '1900-01-01' THEN 'DATA MUITO ANTIGA'
        WHEN start_date > '2100-01-01' THEN 'DATA MUITO FUTURA'
        ELSE 'DATA VÁLIDA'
    END as status_data
FROM races
WHERE start_date IS NULL 
   OR start_date < '1900-01-01' 
   OR start_date > '2100-01-01';

-- 6. ✅ NOVO: Verificar contagem de provas por usuário
SELECT
    '=== CONTAGEM DE PROVAS POR USUÁRIO ===' as info;

SELECT
    user_id,
    COUNT(*) as total_provas,
    MIN(start_date) as primeira_prova,
    MAX(start_date) as ultima_prova
FROM races
GROUP BY user_id
ORDER BY total_provas DESC;

-- 7. ✅ NOVO: Verificar provas criadas hoje
SELECT
    '=== PROVAS CRIADAS HOJE ===' as info;

SELECT
    id,
    user_id,
    event_name,
    start_date,
    created_at
FROM races
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
