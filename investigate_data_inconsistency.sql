-- SCRIPT PARA INVESTIGAR INCONSISTÊNCIA DE DADOS
-- O gráfico funciona, mas o console mostra sessão de 07/09 sendo comparada com 01/09

-- 1. VERIFICAR TODAS AS SESSÕES DA SEMANA COM DETALHES
SELECT 
    id,
    training_date,
    training_date::text as training_date_text,
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

-- 2. VERIFICAR ESPECIFICAMENTE O DIA 01/09
SELECT 
    id,
    training_date,
    training_date::text as training_date_text,
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

-- 3. VERIFICAR ESPECIFICAMENTE O DIA 07/09
SELECT 
    id,
    training_date,
    training_date::text as training_date_text,
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
WHERE training_date = '2025-09-07'
ORDER BY created_at;

-- 4. VERIFICAR SE HÁ SESSÕES COM DATAS MALFORMADAS
SELECT 
    id,
    training_date,
    training_date::text as training_date_text,
    LENGTH(training_date::text) as date_length,
    status,
    title,
    distance_km,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date, created_at;

-- 5. VERIFICAR SE HÁ SESSÕES DUPLICADAS
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    STRING_AGG(id::text, ', ') as session_ids
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
ORDER BY training_date;

-- 6. VERIFICAR SE HÁ PROBLEMAS DE TIMEZONE NO BANCO
SELECT 
    id,
    training_date,
    training_date::timestamp as training_timestamp,
    training_date::date as training_date_only,
    created_at,
    created_at::timestamp as created_timestamp
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date, created_at;
