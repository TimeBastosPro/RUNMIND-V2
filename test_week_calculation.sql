-- TESTE: Verificar se a padronização de semanas está funcionando
-- Este script testa se os dados da semana 25/08-31/08 estão sendo processados corretamente

-- 1. VERIFICAR TODOS OS TREINOS DA SEMANA 25/08-31/08
SELECT 
  'TREINOS DA SEMANA 25/08-31/08' as categoria,
  id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  esforco,
  intensidade,
  modalidade,
  treino_tipo,
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  created_at
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
ORDER BY training_date, created_at;

-- 2. CONTAR TREINOS POR DIA DA SEMANA
SELECT 
  'CONTAGEM POR DIA DA SEMANA' as categoria,
  training_date,
  EXTRACT(DOW FROM training_date::date) as day_of_week,
  CASE EXTRACT(DOW FROM training_date::date)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda-feira'
    WHEN 2 THEN 'Terça-feira'
    WHEN 3 THEN 'Quarta-feira'
    WHEN 4 THEN 'Quinta-feira'
    WHEN 5 THEN 'Sexta-feira'
    WHEN 6 THEN 'Sábado'
  END as dia_semana,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY training_date, EXTRACT(DOW FROM training_date::date)
ORDER BY training_date;

-- 3. VERIFICAR ESPECIFICAMENTE O DIA 25/08 (SEGUNDA-FEIRA)
SELECT 
  'TREINOS DO DIA 25/08 (SEGUNDA)' as categoria,
  id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  esforco,
  intensidade,
  modalidade,
  treino_tipo,
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  created_at
FROM training_sessions 
WHERE training_date = '2024-08-25'
ORDER BY created_at;

-- 4. VERIFICAR SE HÁ TREINOS COM DADOS DE PLANEJAMENTO NO DIA 25/08
SELECT 
  'TREINOS COM DADOS DE PLANEJAMENTO - 25/08' as categoria,
  id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  esforco,
  intensidade,
  modalidade,
  treino_tipo,
  created_at
FROM training_sessions 
WHERE training_date = '2024-08-25'
  AND (esforco IS NOT NULL OR intensidade IS NOT NULL OR modalidade IS NOT NULL OR treino_tipo IS NOT NULL)
ORDER BY created_at;

-- 5. RESUMO GERAL DA SEMANA
SELECT 
  'RESUMO GERAL DA SEMANA' as categoria,
  'Total de treinos' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'

UNION ALL

SELECT 
  'RESUMO GERAL DA SEMANA' as categoria,
  'Treinos com dados de planejamento' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (esforco IS NOT NULL OR intensidade IS NOT NULL OR modalidade IS NOT NULL OR treino_tipo IS NOT NULL)

UNION ALL

SELECT 
  'RESUMO GERAL DA SEMANA' as categoria,
  'Treinos com dados de execução' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (perceived_effort IS NOT NULL OR session_satisfaction IS NOT NULL OR avg_heart_rate IS NOT NULL);
