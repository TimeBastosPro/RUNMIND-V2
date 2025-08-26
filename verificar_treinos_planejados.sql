-- VERIFICAR TREINOS PLANEJADOS VS REALIZADOS
-- Este script ajuda a identificar se há mistura de dados

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  'ESTRUTURA' as tipo,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions'
AND column_name IN (
  'id', 'user_id', 'training_date', 'status', 'title',
  'distance_km', 'duration_minutes', 'perceived_effort',
  'modalidade', 'treino_tipo', 'terreno', 'esforco',
  'elevation_gain_meters', 'elevation_loss_meters'
)
ORDER BY column_name;

-- 2. CONTAR TREINOS POR STATUS
SELECT 
  'CONTAGEM' as tipo,
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN training_date >= CURRENT_DATE THEN 1 END) as hoje_ou_futuro,
  COUNT(CASE WHEN training_date < CURRENT_DATE THEN 1 END) as passado
FROM training_sessions
GROUP BY status
ORDER BY status;

-- 3. VERIFICAR TREINOS DE HOJE
SELECT 
  'HOJE' as tipo,
  id,
  user_id,
  training_date,
  status,
  title,
  modalidade,
  treino_tipo,
  distance_km,
  duration_minutes,
  perceived_effort,
  elevation_gain_meters,
  elevation_loss_meters,
  created_at
FROM training_sessions
WHERE training_date = CURRENT_DATE
ORDER BY created_at DESC;

-- 4. VERIFICAR PRÓXIMOS TREINOS PLANEJADOS
SELECT 
  'PROXIMOS_PLANEJADOS' as tipo,
  id,
  user_id,
  training_date,
  status,
  title,
  modalidade,
  treino_tipo,
  distance_km,
  duration_minutes,
  perceived_effort,
  elevation_gain_meters,
  elevation_loss_meters,
  created_at
FROM training_sessions
WHERE status = 'planned' 
AND training_date >= CURRENT_DATE
ORDER BY training_date ASC, created_at DESC;

-- 5. VERIFICAR ÚLTIMOS TREINOS REALIZADOS
SELECT 
  'ULTIMOS_REALIZADOS' as tipo,
  id,
  user_id,
  training_date,
  status,
  title,
  modalidade,
  treino_tipo,
  distance_km,
  duration_minutes,
  perceived_effort,
  elevation_gain_meters,
  elevation_loss_meters,
  created_at
FROM training_sessions
WHERE status = 'completed'
ORDER BY training_date DESC, created_at DESC
LIMIT 5;

-- 6. VERIFICAR POSSÍVEIS PROBLEMAS
SELECT 
  'PROBLEMAS' as tipo,
  'Treinos sem status' as problema,
  COUNT(*) as total
FROM training_sessions
WHERE status IS NULL

UNION ALL

SELECT 
  'PROBLEMAS' as tipo,
  'Treinos sem data' as problema,
  COUNT(*) as total
FROM training_sessions
WHERE training_date IS NULL

UNION ALL

SELECT 
  'PROBLEMAS' as tipo,
  'Treinos realizados sem esforço' as problema,
  COUNT(*) as total
FROM training_sessions
WHERE status = 'completed' AND perceived_effort IS NULL

UNION ALL

SELECT 
  'PROBLEMAS' as tipo,
  'Treinos planejados com esforço' as problema,
  COUNT(*) as total
FROM training_sessions
WHERE status = 'planned' AND perceived_effort IS NOT NULL;

-- 7. VERIFICAR DADOS ESPECÍFICOS DE UM USUÁRIO (substitua o user_id)
SELECT 
  'USUARIO_ESPECIFICO' as tipo,
  id,
  training_date,
  status,
  title,
  modalidade,
  treino_tipo,
  distance_km,
  duration_minutes,
  perceived_effort,
  elevation_gain_meters,
  elevation_loss_meters,
  created_at
FROM training_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- Substitua pelo user_id real
ORDER BY training_date DESC, created_at DESC;
