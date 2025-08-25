-- CORREÇÃO DOS FILTROS DE ANÁLISE (VERSÃO CORRIGIDA)
-- Este script corrige os problemas de filtros que impedem a análise de treinos

-- 1. VERIFICAR DADOS PARA FILTROS
SELECT 
  'ANÁLISE DE DADOS' as tipo,
  'Total de treinos' as métrica,
  COUNT(*) as valor
FROM training_sessions

UNION ALL

SELECT 
  'ANÁLISE DE DADOS' as tipo,
  'Treinos completados' as métrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE status = 'completed'

UNION ALL

SELECT 
  'ANÁLISE DE DADOS' as tipo,
  'Treinos planejados' as métrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE status = 'planned'

UNION ALL

SELECT 
  'ANÁLISE DE DADOS' as tipo,
  'Treinos com distância' as métrica,
  COUNT(*) as valor
FROM training_sessions 
WHERE distance_km IS NOT NULL AND distance_km > 0;

-- 2. CORRIGIR STATUS DOS TREINOS
UPDATE training_sessions 
SET status = 'completed'
WHERE status IS NULL AND perceived_effort IS NOT NULL;

UPDATE training_sessions 
SET status = 'planned'
WHERE status IS NULL AND perceived_effort IS NULL;

-- 3. CORRIGIR DATAS DE TREINO
UPDATE training_sessions 
SET training_date = DATE(created_at)
WHERE training_date IS NULL;

-- 4. CORRIGIR DISTÂNCIAS
UPDATE training_sessions 
SET distance_km = COALESCE(distance_km, distancia_m / 1000.0)
WHERE distance_km IS NULL AND distancia_m IS NOT NULL;

-- 5. CORRIGIR DURAÇÕES
UPDATE training_sessions 
SET duration_minutes = COALESCE(
  duration_minutes,
  COALESCE(CAST(duracao_horas AS INTEGER), 0) * 60 + 
  COALESCE(CAST(duracao_minutos AS INTEGER), 0)
)
WHERE duration_minutes IS NULL;

-- 6. CORRIGIR ESFORÇO PERCEBIDO
UPDATE training_sessions 
SET perceived_effort = COALESCE(perceived_effort, effort_level)
WHERE perceived_effort IS NULL AND effort_level IS NOT NULL;

-- 7. CRIAR VIEW PARA ANÁLISE SIMPLIFICADA
CREATE OR REPLACE VIEW training_analysis_view AS
SELECT 
  id,
  user_id,
  title,
  modalidade,
  training_date,
  status,
  COALESCE(distance_km, 0) as distance_km,
  COALESCE(duration_minutes, 0) as duration_minutes,
  COALESCE(perceived_effort, 3) as perceived_effort,
  COALESCE(session_satisfaction, 3) as session_satisfaction,
  created_at
FROM training_sessions
WHERE training_date IS NOT NULL;

-- 8. VERIFICAR VIEW
SELECT 
  'VERIFICAÇÃO VIEW' as tipo,
  'Treinos na view' as métrica,
  COUNT(*) as valor
FROM training_analysis_view

UNION ALL

SELECT 
  'VERIFICAÇÃO VIEW' as tipo,
  'Treinos completados na view' as métrica,
  COUNT(*) as valor
FROM training_analysis_view 
WHERE status = 'completed'

UNION ALL

SELECT 
  'VERIFICAÇÃO VIEW' as tipo,
  'Treinos com distância > 0' as métrica,
  COUNT(*) as valor
FROM training_analysis_view 
WHERE distance_km > 0;

-- 9. MOSTRAR EXEMPLO DE DADOS CORRIGIDOS
SELECT 
  id,
  title,
  modalidade,
  training_date,
  status,
  distance_km,
  duration_minutes,
  perceived_effort,
  session_satisfaction
FROM training_analysis_view
ORDER BY created_at DESC
LIMIT 10;

-- 10. CRIAR FUNÇÃO SIMPLIFICADA PARA CALCULAR MÉTRICAS
CREATE OR REPLACE FUNCTION calculate_training_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  total_sessions INTEGER,
  completed_sessions INTEGER,
  total_distance DECIMAL(10,2),
  total_duration INTEGER,
  avg_effort DECIMAL(5,2),
  avg_satisfaction DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_sessions,
    COALESCE(SUM(distance_km), 0) as total_distance,
    COALESCE(SUM(duration_minutes), 0)::INTEGER as total_duration,
    COALESCE(AVG(perceived_effort), 0) as avg_effort,
    COALESCE(AVG(session_satisfaction), 0) as avg_satisfaction
  FROM training_analysis_view
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR training_date >= p_start_date)
    AND (p_end_date IS NULL OR training_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- 11. TESTE SIMPLIFICADO DA FUNÇÃO (SEM PARÂMETROS PROBLEMÁTICOS)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Pegar um usuário de teste
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Testar a função com parâmetros simples
    PERFORM * FROM calculate_training_metrics(test_user_id);
    RAISE NOTICE '✅ Função calculate_training_metrics testada com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
  END IF;
END $$;

-- 12. CONCLUSÃO
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO DOS FILTROS CONCLUÍDA ===';
  RAISE NOTICE '1. Status dos treinos corrigidos';
  RAISE NOTICE '2. Datas de treino padronizadas';
  RAISE NOTICE '3. Distâncias e durações calculadas';
  RAISE NOTICE '4. View de análise criada';
  RAISE NOTICE '5. Função de métricas criada e testada';
  RAISE NOTICE '=== FILTROS DE ANÁLISE DEVEM FUNCIONAR AGORA ===';
END $$;
