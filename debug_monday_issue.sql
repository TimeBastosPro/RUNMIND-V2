-- SCRIPT PARA INVESTIGAR O PROBLEMA DA SEGUNDA-FEIRA
-- Verificar dados de treinos para a semana de 01/09 a 07/09/2025

-- 1. VERIFICAR TODOS OS TREINOS DA SEMANA
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
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date, created_at;

-- 2. VERIFICAR ESPECIFICAMENTE O DIA 01/09 (SEGUNDA-FEIRA)
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

-- 3. VERIFICAR SE HÁ DADOS NULL OU VAZIOS PARA 01/09
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
    CASE 
        WHEN distance_km IS NULL THEN 'distance_km é NULL'
        WHEN distance_km = 0 THEN 'distance_km é 0'
        ELSE 'distance_km tem valor: ' || distance_km
    END as distance_status,
    CASE 
        WHEN duracao_horas IS NULL THEN 'duracao_horas é NULL'
        WHEN duracao_horas = 0 THEN 'duracao_horas é 0'
        ELSE 'duracao_horas tem valor: ' || duracao_horas
    END as duration_hours_status,
    CASE 
        WHEN duracao_minutos IS NULL THEN 'duracao_minutos é NULL'
        WHEN duracao_minutos = 0 THEN 'duracao_minutos é 0'
        ELSE 'duracao_minutos tem valor: ' || duracao_minutos
    END as duration_minutes_status
FROM training_sessions 
WHERE training_date = '2025-09-01'
ORDER BY created_at;

-- 4. VERIFICAR CONTAGEM DE TREINOS POR DIA
SELECT 
    training_date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_sessions,
    COUNT(CASE WHEN distance_km IS NOT NULL AND distance_km > 0 THEN 1 END) as sessions_with_distance,
    COUNT(CASE WHEN duracao_horas IS NOT NULL AND duracao_horas > 0 THEN 1 END) as sessions_with_duration_hours,
    COUNT(CASE WHEN duracao_minutos IS NOT NULL AND duracao_minutos > 0 THEN 1 END) as sessions_with_duration_minutes
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
GROUP BY training_date
ORDER BY training_date;

-- 5. VERIFICAR SE HÁ PROBLEMAS DE TIMEZONE OU FORMATO DE DATA
SELECT 
    id,
    training_date,
    training_date::text as training_date_text,
    EXTRACT(dow FROM training_date::date) as day_of_week, -- 0=domingo, 1=segunda, etc.
    EXTRACT(epoch FROM training_date::timestamp) as training_date_epoch,
    created_at
FROM training_sessions 
WHERE training_date >= '2025-09-01' 
AND training_date <= '2025-09-07'
ORDER BY training_date, created_at;
