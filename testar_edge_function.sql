-- TESTAR EDGE FUNCTION DE INSIGHTS
-- Este script verifica se a Edge Function está funcionando

-- 1. VERIFICAR SE A EDGE FUNCTION EXISTE
SELECT 
  'EDGE FUNCTIONS' as tipo,
  name,
  status
FROM supabase_functions.hooks 
WHERE name LIKE '%insight%';

-- 2. VERIFICAR CHECK-IN MAIS RECENTE
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

-- 3. VERIFICAR TREINOS COMPLETADOS RECENTES
SELECT 
  'TREINOS COMPLETADOS' as tipo,
  COUNT(*) as quantidade
FROM training_sessions 
WHERE status = 'completed'
  AND training_date >= CURRENT_DATE - INTERVAL '42 days';

-- 4. VERIFICAR TREINO PLANEJADO PARA HOJE
SELECT 
  'TREINO PLANEJADO HOJE' as tipo,
  id,
  title,
  modalidade,
  status,
  training_date
FROM training_sessions 
WHERE training_date = CURRENT_DATE
  AND status = 'planned'
ORDER BY created_at DESC
LIMIT 1;

-- 5. VERIFICAR PERFIL DO USUÁRIO
SELECT 
  'PERFIL USUÁRIO' as tipo,
  id,
  full_name,
  email,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 1;

-- 6. VERIFICAR INSIGHTS RECENTES
SELECT 
  'INSIGHTS RECENTES' as tipo,
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 100) as preview
FROM insights 
ORDER BY created_at DESC
LIMIT 5;

-- 7. DIAGNÓSTICO COMPLETO
DO $$
DECLARE
  checkin_recente RECORD;
  treinos_count INTEGER;
  treino_hoje RECORD;
  perfil_usuario RECORD;
  insights_count INTEGER;
BEGIN
  -- Pegar check-in mais recente
  SELECT * INTO checkin_recente
  FROM daily_checkins 
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Contar treinos completados
  SELECT COUNT(*) INTO treinos_count
  FROM training_sessions 
  WHERE status = 'completed'
    AND training_date >= CURRENT_DATE - INTERVAL '42 days';
  
  -- Pegar treino planejado para hoje
  SELECT * INTO treino_hoje
  FROM training_sessions 
  WHERE training_date = CURRENT_DATE
    AND status = 'planned'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Pegar perfil do usuário
  SELECT * INTO perfil_usuario
  FROM profiles 
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Contar insights
  SELECT COUNT(*) INTO insights_count
  FROM insights 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO EDGE FUNCTION';
  RAISE NOTICE '========================================';
  
  IF checkin_recente.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM CHECK-IN ENCONTRADO';
  ELSE
    RAISE NOTICE '✅ Check-in recente: ID %, User: %', checkin_recente.id, checkin_recente.user_id;
    RAISE NOTICE '   Dados: Sono=%, Dores=%, Motivação=%', 
      checkin_recente.sleep_quality, 
      checkin_recente.soreness, 
      checkin_recente.motivation;
  END IF;
  
  RAISE NOTICE '✅ Treinos completados (42 dias): %', treinos_count;
  
  IF treino_hoje.id IS NULL THEN
    RAISE NOTICE '⚠️ NENHUM TREINO PLANEJADO PARA HOJE';
  ELSE
    RAISE NOTICE '✅ Treino planejado hoje: %', treino_hoje.title;
  END IF;
  
  IF perfil_usuario.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM PERFIL ENCONTRADO';
  ELSE
    RAISE NOTICE '✅ Perfil usuário: % (%%)', perfil_usuario.full_name, perfil_usuario.email;
  END IF;
  
  RAISE NOTICE '✅ Insights hoje: %', insights_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Faça um novo check-in na aplicação';
  RAISE NOTICE '2. Monitore o console para ver os logs';
  RAISE NOTICE '3. Verifique se a Edge Function é chamada';
  RAISE NOTICE '4. Confirme se o insight aparece na aba Insights';
  
  RAISE NOTICE '========================================';
END $$;
