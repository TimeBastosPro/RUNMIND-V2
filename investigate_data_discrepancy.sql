-- SCRIPT PARA INVESTIGAR DISCREPÂNCIA ENTRE BANCO E GRÁFICO
-- Gráfico mostra 12.0 para 01/09, mas banco tem 10

-- 1. VERIFICAR TODAS AS SESSÕES DA SEMANA COM DETALHES COMPLETOS
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
    created_at,
    user_id
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date, created_at;

-- 2. VERIFICAR SE HÁ SESSÕES DUPLICADAS OU MÚLTIPLAS PARA O MESMO DIA
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT id) as unique_sessions,
    STRING_AGG(id::text, ', ') as session_ids,
    STRING_AGG(distance_km::text, ', ') as distances,
    STRING_AGG(status, ', ') as statuses
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
ORDER BY training_date;

-- 3. VERIFICAR ESPECIFICAMENTE O DIA 01/09 COM TODOS OS DETALHES
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
    created_at,
    user_id
FROM training_sessions 
WHERE training_date = '2025-09-01'
ORDER BY created_at;

-- 4. VERIFICAR SE HÁ SESSÕES COM DATAS DIFERENTES MAS MESMO ID
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    created_at,
    user_id
FROM training_sessions 
WHERE id IN (
    SELECT id FROM training_sessions 
    WHERE training_date >= '2025-09-01' 
    AND training_date <= '2025-09-07'
    GROUP BY id 
    HAVING COUNT(*) > 1
)
ORDER BY id, training_date;

-- 5. VERIFICAR SE HÁ SESSÕES COM VALORES NULL OU ZERO
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
    created_at,
    user_id
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
AND (distance_km IS NULL OR distance_km = 0)
ORDER BY training_date, created_at;
