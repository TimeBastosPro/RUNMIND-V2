-- SCRIPT RÁPIDO PARA INVESTIGAR O PROBLEMA DA SEGUNDA-FEIRA
-- Gráfico não mostra 01/09 e resumo mostra 6 em vez de 7

-- 1. VERIFICAR TODAS AS SESSÕES DA SEMANA
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

-- 2. CONTAR SESSÕES POR DIA
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    STRING_AGG(distance_km::text, ', ') as distances
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
ORDER BY training_date;

-- 3. VERIFICAR ESPECIFICAMENTE 01/09
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date = '2025-09-01';

-- 4. VERIFICAR SE HÁ SESSÕES DUPLICADAS
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT id) as unique_sessions
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
HAVING COUNT(*) > 1
ORDER BY training_date;
