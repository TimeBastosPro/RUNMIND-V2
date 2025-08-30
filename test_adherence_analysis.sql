-- TESTE COMPLETO: Análise de Aderência ao Planejamento
-- Este script testa a implementação com dados reais

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'training_sessions' 
  AND column_name IN ('original_planned_id', 'execution_type')
ORDER BY column_name;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT 
  'DADOS EXISTENTES' as etapa,
  status,
  execution_type,
  COUNT(*) as quantidade
FROM training_sessions 
GROUP BY status, execution_type
ORDER BY status, execution_type;

-- 3. TESTAR A VIEW COM DADOS DETALHADOS
SELECT 
  planned_id,
  executed_id,
  user_id,
  training_date,
  title,
  planned_distance,
  actual_distance,
  distance_variance_percent,
  adherence_classification,
  adherence_status
FROM training_adherence_analysis
ORDER BY training_date DESC
LIMIT 10;

-- 4. ANÁLISE DE ADERÊNCIA POR USUÁRIO
SELECT 
  user_id,
  COUNT(*) as total_planejados,
  COUNT(executed_id) as total_executados,
  ROUND((COUNT(executed_id)::DECIMAL / COUNT(*)) * 100, 2) as taxa_execucao_percent,
  COUNT(CASE WHEN adherence_classification = 'excellent_adherence' THEN 1 END) as excelente_aderencia,
  COUNT(CASE WHEN adherence_classification = 'good_adherence' THEN 1 END) as boa_aderencia,
  COUNT(CASE WHEN adherence_classification = 'moderate_adherence' THEN 1 END) as moderada_aderencia,
  COUNT(CASE WHEN adherence_classification = 'poor_adherence' THEN 1 END) as baixa_aderencia,
  AVG(ABS(distance_variance_percent)) as variância_média_percent
FROM training_adherence_analysis
GROUP BY user_id
ORDER BY taxa_execucao_percent DESC;

-- 5. ANÁLISE TEMPORAL (ÚLTIMOS 30 DIAS)
SELECT 
  DATE(training_date) as data,
  COUNT(*) as treinos_planejados,
  COUNT(executed_id) as treinos_executados,
  ROUND((COUNT(executed_id)::DECIMAL / COUNT(*)) * 100, 2) as taxa_execucao_percent,
  AVG(ABS(distance_variance_percent)) as variância_média_percent
FROM training_adherence_analysis
WHERE training_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(training_date)
ORDER BY data DESC;

-- 6. VERIFICAR TREINOS ESPONTÂNEOS
SELECT 
  'TREINOS ESPONTÂNEOS' as tipo,
  COUNT(*) as quantidade,
  AVG(distance_km) as distancia_media,
  AVG(perceived_effort) as esforco_medio
FROM training_sessions 
WHERE status = 'completed' 
  AND execution_type = 'spontaneous'
  AND training_date >= CURRENT_DATE - INTERVAL '30 days';
