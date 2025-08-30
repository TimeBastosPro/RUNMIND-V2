-- SCRIPT PARA TESTAR O CÁLCULO DE PERÍODO
-- Verificar se o período calculado inclui 01/09

-- 1. VERIFICAR TODAS AS SESSÕES DA SEMANA DE 01/09 A 07/09
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date;

-- 2. VERIFICAR SE HÁ SESSÕES FORA DO PERÍODO ESPERADO
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date < '2025-09-01' 
OR training_date > '2025-09-07'
ORDER BY training_date;

-- 3. VERIFICAR ESPECIFICAMENTE O DIA 01/09
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    esforco,
    intensidade,
    modalidade,
    treino_tipo,
    created_at
FROM training_sessions 
WHERE training_date = '2025-09-01'
ORDER BY created_at;

-- 4. VERIFICAR SE HÁ SESSÕES COM DATAS MALFORMADAS
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date IS NULL
OR NOT (training_date::text ~ '^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$')
ORDER BY created_at;
