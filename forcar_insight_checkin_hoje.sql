-- FORÇAR INSIGHT PARA CHECK-IN DE HOJE
-- Este script força a geração de insight para o check-in de hoje

-- 1. VERIFICAR CHECK-IN DE HOJE
SELECT 
  'CHECK-IN DE HOJE' as tipo,
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  created_at
FROM daily_checkins 
WHERE DATE(date) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- 2. VERIFICAR SE JÁ EXISTE INSIGHT PARA HOJE
SELECT 
  'INSIGHT DE HOJE' as tipo,
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 100) as preview
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE
  AND context_type = 'daily_checkin'
ORDER BY created_at DESC
LIMIT 1;

-- 3. FORÇAR GERAÇÃO DE INSIGHT PARA CHECK-IN DE HOJE
DO $$
DECLARE
  checkin_hoje RECORD;
  user_id_hoje UUID;
  insight_id UUID;
BEGIN
  -- Pegar o check-in de hoje
  SELECT * INTO checkin_hoje
  FROM daily_checkins 
  WHERE DATE(date) = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF checkin_hoje.id IS NULL THEN
    RAISE NOTICE '❌ NENHUM CHECK-IN ENCONTRADO PARA HOJE';
    RAISE NOTICE 'Faça um check-in diário primeiro';
    RETURN;
  END IF;
  
  user_id_hoje := checkin_hoje.user_id;
  
  RAISE NOTICE '✅ Check-in de hoje encontrado: ID %, User: %', checkin_hoje.id, user_id_hoje;
  RAISE NOTICE 'Dados: Sono=%, Dores=%, Motivação=%, Confiança=%', 
    checkin_hoje.sleep_quality, 
    checkin_hoje.soreness, 
    checkin_hoje.motivation, 
    checkin_hoje.confidence;
  
  -- Verificar se já existe insight para hoje
  IF EXISTS (
    SELECT 1 FROM insights 
    WHERE user_id = user_id_hoje 
      AND DATE(created_at) = CURRENT_DATE 
      AND context_type = 'daily_checkin'
  ) THEN
    RAISE NOTICE '⚠️ JÁ EXISTE INSIGHT PARA HOJE';
    RETURN;
  END IF;
  
  -- Gerar insight baseado nos dados do check-in
  INSERT INTO insights (
    user_id,
    insight_type,
    insight_text,
    context_type,
    confidence_score,
    generated_by,
    created_at
  ) VALUES (
    user_id_hoje,
    'ai_analysis',
    CASE 
      WHEN checkin_hoje.sleep_quality >= 6 AND checkin_hoje.motivation >= 4 THEN
        '🎯 Excelente estado hoje! Seu sono de ' || checkin_hoje.sleep_quality || '/7 e motivação de ' || checkin_hoje.motivation || '/5 indicam que você está pronto para um treino produtivo. Aproveite essa energia positiva e mantenha o foco nos seus objetivos!'
      WHEN checkin_hoje.soreness >= 5 THEN
        '⚠️ Atenção às dores! Com nível de ' || checkin_hoje.soreness || '/7, sugiro um treino mais leve hoje, focando na recuperação. Priorize alongamentos e atividades de baixo impacto para permitir que seu corpo se recupere adequadamente.'
      WHEN checkin_hoje.motivation <= 3 THEN
        '💪 Motivação baixa detectada (' || checkin_hoje.motivation || '/5), mas isso é normal! Sugiro começar com uma atividade que você gosta, mesmo que seja apenas uma caminhada leve. O importante é manter a consistência, não a intensidade.'
      ELSE
        '📊 Estado equilibrado hoje! Sono: ' || checkin_hoje.sleep_quality || '/7, Dores: ' || checkin_hoje.soreness || '/7, Motivação: ' || checkin_hoje.motivation || '/5. Continue monitorando esses indicadores para otimizar seus treinos.'
    END,
    'daily_checkin',
    0.95,
    'system',
    NOW()
  ) RETURNING id INTO insight_id;
  
  RAISE NOTICE '✅ INSIGHT FORÇADO CRIADO COM SUCESSO!';
  RAISE NOTICE 'ID do insight: %', insight_id;
  RAISE NOTICE 'User ID: %', user_id_hoje;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 AGORA TESTE:';
  RAISE NOTICE '1. Vá para a aba Insights na aplicação';
  RAISE NOTICE '2. Use o botão "🔄 Recarregar"';
  RAISE NOTICE '3. Verifique se o insight de hoje aparece';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Para limpar este teste depois, execute:';
  RAISE NOTICE 'DELETE FROM insights WHERE id = ''%'';', insight_id;
  
END $$;

-- 4. VERIFICAR RESULTADO
SELECT 
  'VERIFICAÇÃO FINAL' as tipo,
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 100) as preview
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE
  AND context_type = 'daily_checkin'
ORDER BY created_at DESC;
