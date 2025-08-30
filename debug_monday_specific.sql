-- 🔍 DEBUG ESPECÍFICO PARA SEGUNDA-FEIRA (01/09)
-- Verificar exatamente o que está no banco para 01/09

-- 1. Verificar todas as sessões para 01/09
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
    perceived_effort,
    session_satisfaction,
    avg_heart_rate,
    duracao_horas,
    duracao_minutos,
    created_at
FROM training_sessions 
WHERE training_date::date = '2025-09-01'
ORDER BY created_at;

-- 2. Verificar se há sessões com datas próximas (30/08, 31/08, 02/09)
SELECT 
    id,
    training_date,
    status,
    title,
    distance_km,
    esforco,
    intensidade,
    modalidade,
    treino_tipo
FROM training_sessions 
WHERE training_date::date BETWEEN '2025-08-30' AND '2025-09-02'
ORDER BY training_sessions.training_date;

-- 3. Verificar se há sessões com timezone diferente
SELECT 
    id,
    training_date,
    training_date::timestamp,
    training_date::date,
    status,
    title,
    distance_km
FROM training_sessions 
WHERE training_date::date = '2025-09-01'
   OR training_date::timestamp::date = '2025-09-01'
ORDER BY training_sessions.training_date;

-- 4. Verificar se há sessões com status específico para 01/09
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as session_ids
FROM training_sessions 
WHERE training_date::date = '2025-09-01'
GROUP BY status;

-- 5. Verificar se há sessões com campos de planejamento preenchidos para 01/09
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
    -- Verificar se tem dados de planejamento
    CASE 
        WHEN esforco IS NOT NULL THEN 'tem_esforco'
        WHEN intensidade IS NOT NULL THEN 'tem_intensidade'
        WHEN modalidade IS NOT NULL THEN 'tem_modalidade'
        WHEN treino_tipo IS NOT NULL THEN 'tem_treino_tipo'
        WHEN distance_km IS NOT NULL THEN 'tem_distance_km'
        ELSE 'sem_dados_planejamento'
    END as tipo_dados
FROM training_sessions 
WHERE training_date::date = '2025-09-01'
ORDER BY created_at;
