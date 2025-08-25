-- TESTE DIRETO DA EDGE FUNCTION
-- Este script testa se a Edge Function está funcionando

-- 1. VERIFICAR CHECK-IN MAIS RECENTE
SELECT 
  'CHECK-IN MAIS RECENTE' as tipo,
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
LIMIT 1;

-- 2. VERIFICAR SE EXISTE INSIGHT PARA HOJE
SELECT 
  'INSIGHTS DE HOJE' as tipo,
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 100) as preview
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 3. VERIFICAR SE EXISTE INSIGHT PARA O CHECK-IN MAIS RECENTE
WITH checkin_recente AS (
  SELECT id, user_id, date, created_at
  FROM daily_checkins 
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'INSIGHT PARA CHECK-IN RECENTE' as tipo,
  i.id,
  i.user_id,
  i.insight_type,
  i.context_type,
  i.generated_by,
  i.created_at,
  LEFT(i.insight_text, 100) as preview
FROM insights i
JOIN checkin_recente c ON i.user_id = c.user_id 
  AND DATE(i.created_at) = DATE(c.created_at)
  AND i.context_type = 'daily_checkin'
ORDER BY i.created_at DESC;

-- 4. DIAGNÓSTICO DIRETO
DO $$
DECLARE
  checkin_recente RECORD;
  insight_hoje RECORD;
  insight_checkin RECORD;
BEGIN
  -- Pegar check-in mais recente
  SELECT * INTO checkin_recente
  FROM daily_checkins 
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Verificar insight de hoje
  SELECT * INTO insight_hoje
  FROM insights 
  WHERE DATE(created_at) = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Verificar insight para o check-in recente
  SELECT * INTO insight_checkin
  FROM insights i
  WHERE i.user_id = checkin_recente.user_id 
    AND DATE(i.created_at) = DATE(checkin_recente.created_at)
    AND i.context_type = 'daily_checkin'
  ORDER BY i.created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO DIRETO - EDGE FUNCTION';
  RAISE NOTICE '========================================';
  
  IF checkin_recente.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM CHECK-IN ENCONTRADO';
  ELSE
    RAISE NOTICE '✅ Check-in recente: %', checkin_recente.created_at;
    RAISE NOTICE '   User ID: %', checkin_recente.user_id;
    RAISE NOTICE '   Data: %', checkin_recente.date;
  END IF;
  
  IF insight_hoje.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM INSIGHT DE HOJE';
  ELSE
    RAISE NOTICE '✅ Insight de hoje: %', insight_hoje.created_at;
    RAISE NOTICE '   Gerado por: %', insight_hoje.generated_by;
  END IF;
  
  IF insight_checkin.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM INSIGHT PARA CHECK-IN RECENTE';
    RAISE NOTICE '⚠️ A EDGE FUNCTION NÃO ESTÁ FUNCIONANDO!';
  ELSE
    RAISE NOTICE '✅ Insight para check-in: %', insight_checkin.created_at;
    RAISE NOTICE '   Gerado por: %', insight_checkin.generated_by;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 CONCLUSÃO:';
  IF insight_checkin.id IS NULL THEN
    RAISE NOTICE '❌ O TRIGGER AUTOMÁTICO ESTÁ FALHANDO';
    RAISE NOTICE '❌ A EDGE FUNCTION NÃO ESTÁ SENDO CHAMADA';
    RAISE NOTICE '❌ OU ESTÁ FALHANDO SILENCIOSAMENTE';
  ELSE
    RAISE NOTICE '✅ O SISTEMA ESTÁ FUNCIONANDO';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
