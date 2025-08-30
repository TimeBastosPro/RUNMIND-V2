-- CORREÇÃO: Sincronizar dados entre aba de treinos e análise
-- Este script identifica e corrige discrepâncias nos dados

-- 1. VERIFICAR TODOS OS TREINOS DA SEMANA 25/08-31/08
SELECT 
  'TODOS OS TREINOS DA SEMANA' as categoria,
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
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  execution_type,
  created_at,
  updated_at
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
ORDER BY training_date, created_at;

-- 2. CONTAR TREINOS POR STATUS
SELECT 
  'CONTAGEM POR STATUS' as categoria,
  status,
  COUNT(*) as quantidade,
  STRING_AGG(DISTINCT training_date, ', ') as datas
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY status
ORDER BY status;

-- 3. VERIFICAR TREINOS SEM STATUS
SELECT 
  'TREINOS SEM STATUS' as categoria,
  id,
  training_date,
  title,
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
  AND (status IS NULL OR status = '')
ORDER BY training_date;

-- 4. VERIFICAR TREINOS COM DADOS DE PLANEJAMENTO
SELECT 
  'TREINOS COM DADOS DE PLANEJAMENTO' as categoria,
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
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (esforco IS NOT NULL OR intensidade IS NOT NULL OR modalidade IS NOT NULL OR treino_tipo IS NOT NULL)
ORDER BY training_date;

-- 5. VERIFICAR TREINOS COM DADOS DE EXECUÇÃO
SELECT 
  'TREINOS COM DADOS DE EXECUÇÃO' as categoria,
  id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  created_at
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (perceived_effort IS NOT NULL OR session_satisfaction IS NOT NULL OR avg_heart_rate IS NOT NULL)
ORDER BY training_date;

-- 6. ANÁLISE DE DISCREPÂNCIAS
SELECT 
  'ANÁLISE DE DISCREPÂNCIAS' as categoria,
  'Total de treinos na semana' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'

UNION ALL

SELECT 
  'ANÁLISE DE DISCREPÂNCIAS' as categoria,
  'Treinos com status planned' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND status = 'planned'

UNION ALL

SELECT 
  'ANÁLISE DE DISCREPÂNCIAS' as categoria,
  'Treinos com status completed' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND status = 'completed'

UNION ALL

SELECT 
  'ANÁLISE DE DISCREPÂNCIAS' as categoria,
  'Treinos sem status definido' as metrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
  AND (status IS NULL OR status = '');
