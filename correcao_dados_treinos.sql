-- CORREÇÃO DE DADOS DE TREINOS PARA INSIGHTS
-- Este script corrige os dados inconsistentes que impedem o funcionamento correto

-- 1. VERIFICAR DADOS PROBLEMÁTICOS
SELECT 
  'DIAGNÓSTICO INICIAL' as etapa,
  'Treinos com dados inconsistentes' as problema,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE modalidade IS NULL 
   OR effort_level IS NULL 
   OR duracao_horas IS NULL 
   OR duracao_minutos IS NULL
   OR distancia_m IS NULL;

-- 2. CORRIGIR CAMPOS OBRIGATÓRIOS
UPDATE training_sessions 
SET 
  modalidade = COALESCE(modalidade, 'corrida'),
  effort_level = COALESCE(effort_level, 3),
  duracao_horas = COALESCE(duracao_horas, '0'),
  duracao_minutos = COALESCE(duracao_minutos, '30'),
  distancia_m = COALESCE(distancia_m, 5000),
  intensidade = COALESCE(intensidade, 'moderada'),
  terreno = COALESCE(terreno, 'asfalto'),
  percurso = COALESCE(percurso, 'rua'),
  treino_tipo = COALESCE(treino_tipo, 'resistência')
WHERE modalidade IS NULL 
   OR effort_level IS NULL 
   OR duracao_horas IS NULL 
   OR duracao_minutos IS NULL
   OR distancia_m IS NULL;

-- 3. CONVERTER DISTÂNCIA DE METROS PARA KM
UPDATE training_sessions 
SET distance_km = distancia_m / 1000.0
WHERE distance_km IS NULL AND distancia_m IS NOT NULL;

-- 4. CALCULAR DURAÇÃO EM MINUTOS
UPDATE training_sessions 
SET duration_minutes = 
  COALESCE(CAST(duracao_horas AS INTEGER), 0) * 60 + 
  COALESCE(CAST(duracao_minutos AS INTEGER), 0)
WHERE duration_minutes IS NULL;

-- 5. CORRIGIR DATAS DE TREINO
UPDATE training_sessions 
SET training_date = COALESCE(training_date, created_at::date)
WHERE training_date IS NULL;

-- 6. VERIFICAR CORREÇÕES
SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'Treinos corrigidos' as status,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE modalidade IS NOT NULL 
   AND effort_level IS NOT NULL 
   AND duracao_horas IS NOT NULL 
   AND duracao_minutos IS NOT NULL
   AND distancia_m IS NOT NULL;

-- 7. MOSTRAR EXEMPLO DE DADOS CORRIGIDOS
SELECT 
  id,
  title,
  modalidade,
  effort_level,
  duracao_horas,
  duracao_minutos,
  distancia_m,
  distance_km,
  duration_minutes,
  training_date,
  status
FROM training_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date ON training_sessions(user_id, training_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_modalidade ON training_sessions(modalidade);

-- 9. VERIFICAÇÃO DE INTEGRIDADE
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO DE DADOS DE TREINOS CONCLUÍDA ===';
  RAISE NOTICE '1. Campos obrigatórios preenchidos';
  RAISE NOTICE '2. Distâncias convertidas para KM';
  RAISE NOTICE '3. Durações calculadas em minutos';
  RAISE NOTICE '4. Datas de treino corrigidas';
  RAISE NOTICE '5. Índices de performance criados';
  RAISE NOTICE '=== SISTEMA DE INSIGHTS DEVE FUNCIONAR AGORA ===';
END $$;
