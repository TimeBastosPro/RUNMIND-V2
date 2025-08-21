-- Script para testar as correções dos insights automáticos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a geração automática está funcionando
SELECT 
  'Verificação - Geração Automática de Insights' as etapa,
  p.full_name,
  p.email,
  
  -- Check-ins de hoje
  (SELECT COUNT(*) FROM daily_checkins dc 
   WHERE dc.user_id = p.id 
   AND dc.created_at >= CURRENT_DATE) as checkins_hoje,
  
  -- Insights gerados hoje
  (SELECT COUNT(*) FROM insights i 
   WHERE i.user_id = p.id 
   AND i.created_at >= CURRENT_DATE) as insights_hoje,
  
  -- Treinos completados hoje
  (SELECT COUNT(*) FROM training_sessions ts 
   WHERE ts.user_id = p.id 
   AND ts.status = 'completed'
   AND ts.created_at >= CURRENT_DATE) as treinos_hoje,
  
  -- Reflexões semanais da semana atual
  (SELECT COUNT(*) FROM weekly_reflections wr 
   WHERE wr.user_id = p.id 
   AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date) as reflexoes_semana_atual,
  
  -- Status da geração automática
  CASE 
    WHEN (SELECT COUNT(*) FROM daily_checkins dc WHERE dc.user_id = p.id AND dc.created_at >= CURRENT_DATE) > 0
    AND (SELECT COUNT(*) FROM insights i WHERE i.user_id = p.id AND i.created_at >= CURRENT_DATE) > 0
    THEN '✅ Check-in + Insight automático funcionando'
    WHEN (SELECT COUNT(*) FROM daily_checkins dc WHERE dc.user_id = p.id AND dc.created_at >= CURRENT_DATE) > 0
    THEN '⚠️ Check-in feito, mas sem insight automático'
    ELSE '⏳ Nenhum check-in hoje'
  END as status_geracao_automatica
  
FROM profiles p
WHERE p.email = 'aline@gmail.com';

-- 2. Verificar scores de confiança dinâmicos
SELECT 
  'Verificação - Scores de Confiança Dinâmicos' as etapa,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  ROUND(i.confidence_score * 100, 1) || '%' as confidence_percentage,
  i.created_at,
  p.full_name,
  
  -- Análise da qualidade dos dados
  CASE 
    WHEN i.confidence_score >= 0.85 THEN '🟢 Alta confiança'
    WHEN i.confidence_score >= 0.75 THEN '🟡 Média confiança'
    WHEN i.confidence_score >= 0.65 THEN '🟠 Baixa confiança'
    ELSE '🔴 Muito baixa confiança'
  END as qualidade_insight
  
FROM insights i
JOIN profiles p ON i.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. Verificar insights contextuais específicos
SELECT 
  'Verificação - Insights Contextuais' as etapa,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  i.created_at,
  
  -- Identificar contexto baseado no texto
  CASE 
    WHEN i.insight_text ILIKE '%check-in%' OR i.insight_text ILIKE '%sono%' OR i.insight_text ILIKE '%motivação%'
    THEN '📅 Check-in Diário'
    WHEN i.insight_text ILIKE '%treino%' OR i.insight_text ILIKE '%esforço%' OR i.insight_text ILIKE '%satisfação%'
    THEN '🏃‍♀️ Feedback Pós-Treino'
    WHEN i.insight_text ILIKE '%semana%' OR i.insight_text ILIKE '%consistência%' OR i.insight_text ILIKE '%progresso%'
    THEN '📊 Reflexão Semanal'
    WHEN i.insight_text ILIKE '%alerta%' OR i.insight_text ILIKE '%cuidado%' OR i.insight_text ILIKE '%recuperação%'
    THEN '⚠️ Alerta'
    ELSE '🤖 Insight Geral'
  END as contexto_identificado
  
FROM insights i
JOIN profiles p ON i.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY i.created_at DESC
LIMIT 15;

-- 4. Verificar dados para insights semanais
SELECT 
  'Verificação - Dados para Insights Semanais' as etapa,
  p.full_name,
  
  -- Treinos da semana atual
  (SELECT COUNT(*) FROM training_sessions ts 
   WHERE ts.user_id = p.id 
   AND ts.created_at >= DATE_TRUNC('week', CURRENT_DATE)
   AND ts.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days') as treinos_semana_atual,
  
  -- Treinos completados da semana
  (SELECT COUNT(*) FROM training_sessions ts 
   WHERE ts.user_id = p.id 
   AND ts.status = 'completed'
   AND ts.created_at >= DATE_TRUNC('week', CURRENT_DATE)
   AND ts.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days') as treinos_completados_semana,
  
  -- Reflexão semanal da semana atual
  (SELECT wr.enjoyment || '/' || wr.progress || '/' || wr.confidence 
   FROM weekly_reflections wr 
   WHERE wr.user_id = p.id 
   AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date
   LIMIT 1) as reflexao_semana_atual,
  
  -- Status para insight semanal
  CASE 
    WHEN (SELECT COUNT(*) FROM training_sessions ts 
          WHERE ts.user_id = p.id 
          AND ts.created_at >= DATE_TRUNC('week', CURRENT_DATE)
          AND ts.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days') >= 1
    THEN '✅ Dados suficientes para insight semanal'
    ELSE '❌ Dados insuficientes para insight semanal'
  END as status_insight_semanal
  
FROM profiles p
WHERE p.email = 'aline@gmail.com';

-- 5. Simular fluxo completo corrigido
WITH fluxo_corrigido AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    
    -- Simular check-in diário com insight automático
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM daily_checkins dc 
        WHERE dc.user_id = p.id 
        AND dc.created_at >= CURRENT_DATE
      ) AND EXISTS (
        SELECT 1 FROM insights i 
        WHERE i.user_id = p.id 
        AND i.created_at >= CURRENT_DATE
      ) THEN '✅ Check-in + Insight automático funcionando'
      WHEN EXISTS (
        SELECT 1 FROM daily_checkins dc 
        WHERE dc.user_id = p.id 
        AND dc.created_at >= CURRENT_DATE
      ) THEN '⚠️ Check-in feito, mas insight falhou'
      ELSE '⏳ Nenhum check-in hoje'
    END as status_checkin_automatico,
    
    -- Simular feedback pós-treino com insight automático
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.user_id = p.id 
        AND ts.status = 'completed'
        AND ts.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ) AND EXISTS (
        SELECT 1 FROM insights i 
        WHERE i.user_id = p.id 
        AND i.insight_text ILIKE '%treino%'
        AND i.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ) THEN '✅ Feedback + Insight automático funcionando'
      WHEN EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.user_id = p.id 
        AND ts.status = 'completed'
        AND ts.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ) THEN '⚠️ Feedback feito, mas insight falhou'
      ELSE '⏳ Nenhum feedback hoje'
    END as status_feedback_automatico,
    
    -- Simular reflexão semanal com insight automático
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM weekly_reflections wr 
        WHERE wr.user_id = p.id 
        AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date
      ) AND EXISTS (
        SELECT 1 FROM insights i 
        WHERE i.user_id = p.id 
        AND i.insight_text ILIKE '%semana%'
        AND i.created_at >= DATE_TRUNC('week', CURRENT_DATE)
      ) THEN '✅ Reflexão + Insight automático funcionando'
      WHEN EXISTS (
        SELECT 1 FROM weekly_reflections wr 
        WHERE wr.user_id = p.id 
        AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date
      ) THEN '⚠️ Reflexão feita, mas insight falhou'
      ELSE '⏳ Nenhuma reflexão esta semana'
    END as status_reflexao_automatico
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Simulação - Fluxo Corrigido' as etapa,
  full_name,
  email,
  status_checkin_automatico,
  status_feedback_automatico,
  status_reflexao_automatico,
  
  -- Status geral do sistema
  CASE 
    WHEN status_checkin_automatico LIKE '✅%' 
    AND status_feedback_automatico LIKE '✅%' 
    AND status_reflexao_automatico LIKE '✅%'
    THEN '🎉 Sistema 100% funcional'
    WHEN status_checkin_automatico LIKE '✅%' 
    OR status_feedback_automatico LIKE '✅%' 
    OR status_reflexao_automatico LIKE '✅%'
    THEN '🔄 Sistema parcialmente funcional'
    ELSE '❌ Sistema com problemas'
  END as status_geral_sistema
  
FROM fluxo_corrigido;
