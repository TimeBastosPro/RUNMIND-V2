-- CORREÇÃO COMPLETA: Análise Planejado vs Realizado
-- Este script corrige a lógica fundamental de análise de treinos

-- 1. ADICIONAR CAMPOS PARA RASTREAR ORIGEM DOS TREINOS
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS original_planned_id UUID,
ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS planned_duration_hours TEXT,
ADD COLUMN IF NOT EXISTS planned_duration_minutes TEXT,
ADD COLUMN IF NOT EXISTS planned_perceived_effort INTEGER,
ADD COLUMN IF NOT EXISTS planned_intensity TEXT,
ADD COLUMN IF NOT EXISTS planned_modalidade TEXT,
ADD COLUMN IF NOT EXISTS planned_treino_tipo TEXT,
ADD COLUMN IF NOT EXISTS planned_terreno TEXT,
ADD COLUMN IF NOT EXISTS planned_percurso TEXT,
ADD COLUMN IF NOT EXISTS planned_esforco TEXT,
ADD COLUMN IF NOT EXISTS planned_observacoes TEXT,
ADD COLUMN IF NOT EXISTS execution_type TEXT;

-- 2. ADICIONAR CONSTRAINT PARA execution_type
ALTER TABLE training_sessions 
ADD CONSTRAINT check_execution_type 
CHECK (execution_type IN ('planned_executed', 'spontaneous', 'planned_pending'));

-- 3. CRIAR VIEW SIMPLIFICADA PARA ANÁLISE DE ADERÊNCIA
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
LEFT JOIN training_sessions e ON p.id = e.original_planned_id OR 
  (e.original_planned_id IS NULL AND p.training_date = e.training_date AND p.user_id = e.user_id)
WHERE p.status = 'planned' AND (e.status = 'completed' OR e.status IS NULL);

-- 4. ATUALIZAR DADOS EXISTENTES
-- Marcar treinos existentes com execution_type baseado na lógica atual
UPDATE training_sessions 
SET execution_type = CASE 
  WHEN status = 'planned' THEN 'planned_pending'
  WHEN status = 'completed' AND original_planned_id IS NOT NULL THEN 'planned_executed'
  WHEN status = 'completed' AND original_planned_id IS NULL THEN 'spontaneous'
  ELSE 'unknown'
END
WHERE execution_type IS NULL;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_training_sessions_original_planned_id ON training_sessions(original_planned_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_execution_type ON training_sessions(execution_type);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_status ON training_sessions(user_id, training_date, status);

-- 6. VERIFICAR DADOS
SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  execution_type,
  COUNT(*) as quantidade
FROM training_sessions 
GROUP BY execution_type
ORDER BY quantidade DESC;
