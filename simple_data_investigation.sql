-- SCRIPT SIMPLES PARA INVESTIGAR O PROBLEMA DA SEGUNDA-FEIRA
-- Focado em identificar sessões duplicadas ou malformadas

-- 1. VERIFICAR TODAS AS SESSÕES DA SEMANA
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

-- 2. VERIFICAR CONTAGEM POR DIA
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT id) as unique_sessions,
    STRING_AGG(id::text, ', ') as session_ids
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
ORDER BY training_date;

-- 3. VERIFICAR ESPECIFICAMENTE 01/09 E 07/09
SELECT 
    '01/09' as dia,
    id,
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date = '2025-09-01'

UNION ALL

SELECT 
    '07/09' as dia,
    id,
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date = '2025-09-07'

ORDER BY dia, created_at;
