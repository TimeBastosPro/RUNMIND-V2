-- SCRIPT SIMPLIFICADO: Análise de Aderência ao Planejamento
-- Este script corrige o problema de tipos de dados e implementa a análise

-- 1. ADICIONAR CAMPOS BÁSICOS (sem constraint por enquanto)
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS original_planned_id UUID,
ADD COLUMN IF NOT EXISTS execution_type TEXT;

-- 2. ATUALIZAR DADOS EXISTENTES
UPDATE training_sessions 
SET execution_type = CASE 
  WHEN status = 'planned' THEN 'planned_pending'
  WHEN status = 'completed' THEN 'spontaneous'
  ELSE 'unknown'
END
WHERE execution_type IS NULL;

-- 3. CRIAR VIEW SIMPLIFICADA PARA ANÁLISE
CREATE OR REPLACE VIEW training_adherence_analysis AS
SELECT 
  p.id as planned_id,
  e.id as executed_id,
  p.user_id,
  p.training_date,
  p.title,
  p.distance_km as planned_distance,
  e.distance_km as actual_distance,
  p.esforco as planned_effort,
  e.perceived_effort as actual_effort,
  p.modalidade as planned_modalidade,
  e.modalidade as actual_modalidade,
  p.treino_tipo as planned_treino_tipo,
  e.treino_tipo as actual_treino_tipo,
  e.execution_type,
  e.created_at as executed_at,
  
  -- Análise de aderência
  CASE 
    WHEN e.id IS NOT NULL THEN 'executed'
    ELSE 'pending'
  END as adherence_status,
  
  -- Cálculo de diferença de distância
  CASE 
    WHEN p.distance_km > 0 AND e.distance_km > 0 THEN
      ROUND(((e.distance_km - p.distance_km) / p.distance_km) * 100, 2)
    ELSE NULL
  END as distance_variance_percent,
  
  -- Classificação de aderência
  CASE 
    WHEN e.id IS NULL THEN 'not_executed'
    WHEN p.distance_km > 0 AND e.distance_km > 0 THEN
      CASE 
        WHEN ABS(((e.distance_km - p.distance_km) / p.distance_km) * 100) <= 5 THEN 'excellent_adherence'
        WHEN ABS(((e.distance_km - p.distance_km) / p.distance_km) * 100) <= 15 THEN 'good_adherence'
        WHEN ABS(((e.distance_km - p.distance_km) / p.distance_km) * 100) <= 30 THEN 'moderate_adherence'
        ELSE 'poor_adherence'
      END
    ELSE 'insufficient_data'
  END as adherence_classification

FROM training_sessions p
LEFT JOIN training_sessions e ON p.training_date = e.training_date AND p.user_id = e.user_id
WHERE p.status = 'planned' AND (e.status = 'completed' OR e.status IS NULL);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_training_sessions_original_planned_id ON training_sessions(original_planned_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_execution_type ON training_sessions(execution_type);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_status ON training_sessions(user_id, training_date, status);

-- 5. VERIFICAR DADOS
SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  execution_type,
  COUNT(*) as quantidade
FROM training_sessions 
GROUP BY execution_type
ORDER BY quantidade DESC;

-- 6. TESTAR A VIEW
SELECT 
  'TESTE DA VIEW' as etapa,
  COUNT(*) as total_registros,
  COUNT(executed_id) as treinos_executados,
  COUNT(*) - COUNT(executed_id) as treinos_pendentes
FROM training_adherence_analysis;
