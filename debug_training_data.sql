-- DEBUG: Verificar dados reais de treinos para o período 25/08 a 31/08
-- Este script ajuda a identificar por que o gráfico não mostra a realidade

-- 1. VERIFICAR TODOS OS TREINOS NO PERÍODO
SELECT 
  'TODOS OS TREINOS' as tipo,
  id,
  user_id,
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
  execution_type,
  created_at
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
ORDER BY training_date, status;

-- 2. VERIFICAR APENAS TREINOS PLANEJADOS
SELECT 
  'TREINOS PLANEJADOS' as tipo,
  id,
  user_id,
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
  execution_type
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND status = 'planned'
ORDER BY training_date;

-- 3. VERIFICAR APENAS TREINOS COMPLETADOS
SELECT 
  'TREINOS COMPLETADOS' as tipo,
  id,
  user_id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  execution_type
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND status = 'completed'
ORDER BY training_date;

-- 4. VERIFICAR TREINOS SEM STATUS DEFINIDO
SELECT 
  'TREINOS SEM STATUS' as tipo,
  id,
  user_id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  esforco,
  perceived_effort,
  execution_type
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (status IS NULL OR status = '')
ORDER BY training_date;

-- 5. CONTAR POR STATUS
SELECT 
  'CONTAGEM POR STATUS' as tipo,
  status,
  execution_type,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY status, execution_type
ORDER BY status, execution_type;
