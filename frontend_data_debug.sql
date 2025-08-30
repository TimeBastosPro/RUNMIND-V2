-- SCRIPT PARA DEBUGGING DOS DADOS NO FRONTEND
-- Verificar se os dados estão sendo filtrados corretamente

-- 1. VERIFICAR TODAS AS SESSÕES COM STATUS 'planned'
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
AND status = 'planned'
ORDER BY training_date;

-- 2. VERIFICAR SE HÁ SESSÕES COM STATUS DIFERENTE
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
AND status != 'planned'
ORDER BY training_date;

-- 3. VERIFICAR SE HÁ SESSÕES COM DISTANCE_KM NULL
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
AND distance_km IS NULL
ORDER BY training_date;

-- 4. VERIFICAR SE HÁ SESSÕES COM DISTANCE_KM = 0
SELECT 
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
AND distance_km = 0
ORDER BY training_date;
