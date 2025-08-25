-- VERIFICAR CHECK-IN DE HOJE E INSIGHTS
-- Este script verifica se o check-in de hoje foi feito e se o insight foi gerado

-- 1. VERIFICAR CHECK-INS DE HOJE
SELECT 
  'CHECK-INS HOJE' as tipo,
  COUNT(*) as quantidade
FROM daily_checkins 
WHERE DATE(date) = CURRENT_DATE

UNION ALL

SELECT 
  'CHECK-INS ÚLTIMOS 7 DIAS' as tipo,
  COUNT(*) as quantidade
FROM daily_checkins 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- 2. MOSTRAR CHECK-INS RECENTES
SELECT 
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  created_at
FROM daily_checkins 
ORDER BY created_at DESC
LIMIT 10;

-- 3. VERIFICAR INSIGHTS DE HOJE
SELECT 
  'INSIGHTS HOJE' as tipo,
  COUNT(*) as quantidade
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT 
  'INSIGHTS ÚLTIMOS 7 DIAS' as tipo,
  COUNT(*) as quantidade
FROM insights 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 4. MOSTRAR INSIGHTS RECENTES
SELECT 
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 100) as preview
FROM insights 
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR SE HÁ CHECK-INS SEM INSIGHTS CORRESPONDENTES
SELECT 
  'CHECK-INS SEM INSIGHTS' as tipo,
  COUNT(*) as quantidade
FROM daily_checkins dc
LEFT JOIN insights i ON dc.user_id = i.user_id 
  AND DATE(dc.date) = DATE(i.created_at)
  AND i.context_type = 'daily_checkin'
WHERE DATE(dc.date) = CURRENT_DATE
  AND i.id IS NULL;

-- 6. MOSTRAR CHECK-INS SEM INSIGHTS
SELECT 
  dc.id as checkin_id,
  dc.user_id,
  dc.date,
  dc.sleep_quality,
  dc.soreness,
  dc.motivation,
  dc.created_at as checkin_created,
  i.id as insight_id,
  i.created_at as insight_created
FROM daily_checkins dc
LEFT JOIN insights i ON dc.user_id = i.user_id 
  AND DATE(dc.date) = DATE(i.created_at)
  AND i.context_type = 'daily_checkin'
WHERE DATE(dc.date) = CURRENT_DATE
  AND i.id IS NULL
ORDER BY dc.created_at DESC;

-- 7. VERIFICAR USUÁRIO ATUAL
SELECT 
  'USUÁRIO ATUAL' as tipo,
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 8. CONCLUSÃO
DO $$
DECLARE
  checkins_hoje INTEGER;
  insights_hoje INTEGER;
  checkins_sem_insights INTEGER;
BEGIN
  -- Contar check-ins de hoje
  SELECT COUNT(*) INTO checkins_hoje
  FROM daily_checkins 
  WHERE DATE(date) = CURRENT_DATE;
  
  -- Contar insights de hoje
  SELECT COUNT(*) INTO insights_hoje
  FROM insights 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Contar check-ins sem insights
  SELECT COUNT(*) INTO checkins_sem_insights
  FROM daily_checkins dc
  LEFT JOIN insights i ON dc.user_id = i.user_id 
    AND DATE(dc.date) = DATE(i.created_at)
    AND i.context_type = 'daily_checkin'
  WHERE DATE(dc.date) = CURRENT_DATE
    AND i.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO CHECK-IN DE HOJE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Check-ins hoje: %', checkins_hoje;
  RAISE NOTICE 'Insights hoje: %', insights_hoje;
  RAISE NOTICE 'Check-ins sem insights: %', checkins_sem_insights;
  RAISE NOTICE '';
  
  IF checkins_hoje = 0 THEN
    RAISE NOTICE '❌ NENHUM CHECK-IN FEITO HOJE';
    RAISE NOTICE 'Faça um check-in diário para gerar insights automáticos';
  ELSIF checkins_sem_insights > 0 THEN
    RAISE NOTICE '⚠️ CHECK-INS SEM INSIGHTS DETECTADOS';
    RAISE NOTICE 'O trigger automático não está funcionando';
  ELSE
    RAISE NOTICE '✅ SISTEMA FUNCIONANDO CORRETAMENTE';
    RAISE NOTICE 'Check-ins e insights estão sincronizados';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
