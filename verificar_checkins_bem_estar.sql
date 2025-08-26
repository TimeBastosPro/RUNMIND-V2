-- VERIFICAR DADOS DE CHECK-IN E BEM-ESTAR
-- Este script ajuda a identificar problemas com a análise de bem-estar

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  'ESTRUTURA' as tipo,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_checkins'
AND column_name IN (
  'id', 'user_id', 'date', 'sleep_quality', 'soreness', 
  'motivation', 'confidence', 'focus', 'emocional', 'notes'
)
ORDER BY column_name;

-- 2. CONTAR CHECK-INS POR DATA
SELECT 
  'CONTAGEM_POR_DATA' as tipo,
  date,
  COUNT(*) as total_checkins,
  COUNT(CASE WHEN sleep_quality IS NOT NULL THEN 1 END) as com_sono,
  COUNT(CASE WHEN soreness IS NOT NULL THEN 1 END) as com_dores,
  COUNT(CASE WHEN motivation IS NOT NULL THEN 1 END) as com_motivacao,
  COUNT(CASE WHEN confidence IS NOT NULL THEN 1 END) as com_confianca,
  COUNT(CASE WHEN focus IS NOT NULL THEN 1 END) as com_foco,
  COUNT(CASE WHEN emocional IS NOT NULL THEN 1 END) as com_energia
FROM daily_checkins
GROUP BY date
ORDER BY date DESC
LIMIT 10;

-- 3. VERIFICAR CHECK-INS DE HOJE
SELECT 
  'HOJE' as tipo,
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus,
  emocional,
  notes,
  created_at
FROM daily_checkins
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- 4. VERIFICAR CHECK-INS DA SEMANA ATUAL
SELECT 
  'SEMANA_ATUAL' as tipo,
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus,
  emocional,
  notes,
  created_at
FROM daily_checkins
WHERE date >= DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' -- Segunda-feira
  AND date <= DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days' -- Domingo
ORDER BY date ASC, created_at DESC;

-- 5. VERIFICAR CHECK-INS DOS ÚLTIMOS 30 DIAS
SELECT 
  'ULTIMOS_30_DIAS' as tipo,
  date,
  COUNT(*) as total,
  AVG(COALESCE(sleep_quality, 0)) as media_sono,
  AVG(COALESCE(soreness, 0)) as media_dores,
  AVG(COALESCE(motivation, 0)) as media_motivacao,
  AVG(COALESCE(confidence, 0)) as media_confianca,
  AVG(COALESCE(focus, 0)) as media_foco,
  AVG(COALESCE(emocional, 0)) as media_energia
FROM daily_checkins
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- 6. VERIFICAR POSSÍVEIS PROBLEMAS
SELECT 
  'PROBLEMAS' as tipo,
  'Check-ins sem data' as problema,
  COUNT(*) as total
FROM daily_checkins
WHERE date IS NULL

UNION ALL

SELECT 
  'PROBLEMAS' as tipo,
  'Check-ins duplicados por dia' as problema,
  COUNT(*) as total
FROM (
  SELECT user_id, date, COUNT(*) as cnt
  FROM daily_checkins
  GROUP BY user_id, date
  HAVING COUNT(*) > 1
) duplicados

UNION ALL

SELECT 
  'PROBLEMAS' as tipo,
  'Check-ins com valores inválidos' as problema,
  COUNT(*) as total
FROM daily_checkins
WHERE (sleep_quality < 0 OR sleep_quality > 10)
   OR (soreness < 0 OR soreness > 10)
   OR (motivation < 0 OR motivation > 10)
   OR (confidence < 0 OR confidence > 10)
   OR (focus < 0 OR focus > 10)
   OR (emocional < 0 OR emocional > 10);

-- 7. VERIFICAR DADOS ESPECÍFICOS DE UM USUÁRIO (substitua o user_id)
SELECT 
  'USUARIO_ESPECIFICO' as tipo,
  id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus,
  emocional,
  notes,
  created_at
FROM daily_checkins
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- Substitua pelo user_id real
ORDER BY date DESC, created_at DESC
LIMIT 20;

-- 8. VERIFICAR SEMANAS COM MAIS DADOS
SELECT 
  'SEMANAS_COM_DADOS' as tipo,
  DATE_TRUNC('week', date) + INTERVAL '1 day' as semana_inicio,
  COUNT(*) as total_checkins,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  AVG(COALESCE(sleep_quality, 0)) as media_sono,
  AVG(COALESCE(soreness, 0)) as media_dores,
  AVG(COALESCE(motivation, 0)) as media_motivacao
FROM daily_checkins
WHERE date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY DATE_TRUNC('week', date)
ORDER BY semana_inicio DESC;
