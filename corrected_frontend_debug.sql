-- SCRIPT CORRIGIDO PARA DEBUGGING DOS DADOS NO FRONTEND
-- Verificar se os dados estão sendo filtrados corretamente

-- 1. VERIFICAR TODAS AS SESSÕES COM STATUS 'planned' (JÁ EXECUTADO - 7 RESULTADOS)
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

-- 2. VERIFICAR SE HÁ SESSÕES COM STATUS DIFERENTE (JÁ EXECUTADO - 0 RESULTADOS)
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

-- 3. VERIFICAR SE HÁ SESSÕES COM DISTANCE_KM NULL (EXECUTAR ESTA)
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

-- 4. VERIFICAR SE HÁ SESSÕES COM DISTANCE_KM = 0 (EXECUTAR ESTA)
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

-- 5. VERIFICAR DADOS COMPLETOS DA SESSÃO 01/09 (NOVA CONSULTA)
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    duracao_horas,
    duracao_minutos,
    esforco,
    intensidade,
    modalidade,
    treino_tipo,
    created_at
FROM training_sessions 
WHERE training_date = '2025-09-01'
ORDER BY created_at;
