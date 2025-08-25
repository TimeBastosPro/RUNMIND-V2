-- CORREÇÃO RÁPIDA FINAL DO SISTEMA DE INSIGHTS
-- Script simples e direto para resolver os problemas principais

-- 1. CORRIGIR DADOS DE TREINOS (ESSENCIAL)
UPDATE training_sessions 
SET 
  modalidade = COALESCE(modalidade, 'corrida'),
  effort_level = COALESCE(effort_level, 3),
  duracao_horas = COALESCE(duracao_horas, '0'),
  duracao_minutos = COALESCE(duracao_minutos, '30'),
  distancia_m = COALESCE(distancia_m, 5000),
  status = COALESCE(status, 'planned')
WHERE modalidade IS NULL 
   OR effort_level IS NULL 
   OR duracao_horas IS NULL 
   OR duracao_minutos IS NULL
   OR distancia_m IS NULL
   OR status IS NULL;

-- 2. CONVERTER DISTÂNCIAS E DURAÇÕES
UPDATE training_sessions 
SET distance_km = distancia_m / 1000.0
WHERE distance_km IS NULL AND distancia_m IS NOT NULL;

UPDATE training_sessions 
SET duration_minutes = 
  COALESCE(CAST(duracao_horas AS INTEGER), 0) * 60 + 
  COALESCE(CAST(duracao_minutos AS INTEGER), 0)
WHERE duration_minutes IS NULL;

-- 3. CORRIGIR DATAS
UPDATE training_sessions 
SET training_date = DATE(created_at)
WHERE training_date IS NULL;

-- 4. CORRIGIR ESFORÇO PERCEBIDO
UPDATE training_sessions 
SET perceived_effort = COALESCE(perceived_effort, effort_level)
WHERE perceived_effort IS NULL AND effort_level IS NOT NULL;

-- 5. VERIFICAR CORREÇÕES
SELECT 
  'CORREÇÃO RÁPIDA' as tipo,
  'Treinos corrigidos' as status,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE modalidade IS NOT NULL 
   AND effort_level IS NOT NULL 
   AND duracao_horas IS NOT NULL 
   AND duracao_minutos IS NOT NULL
   AND distancia_m IS NOT NULL
   AND status IS NOT NULL;

-- 6. MOSTRAR EXEMPLO DE DADOS
SELECT 
  id,
  title,
  modalidade,
  status,
  distance_km,
  duration_minutes,
  perceived_effort,
  training_date
FROM training_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. CRIAR ÍNDICES SIMPLES
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date ON training_sessions(user_id, training_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

-- 8. VERIFICAÇÃO FINAL
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO RÁPIDA CONCLUÍDA ===';
  RAISE NOTICE '✅ Dados de treinos corrigidos';
  RAISE NOTICE '✅ Distâncias e durações calculadas';
  RAISE NOTICE '✅ Status e datas corrigidos';
  RAISE NOTICE '✅ Índices criados';
  RAISE NOTICE '=== SISTEMA PRONTO PARA USO ===';
END $$;
