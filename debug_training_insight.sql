-- Script para debugar o fluxo de insights de treino
-- Execute este script no Supabase SQL Editor

-- 1. Verificar treinos realizados recentes
SELECT 
  'Treinos realizados hoje' as info,
  ts.id,
  ts.title,
  ts.training_type,
  ts.status,
  ts.perceived_effort,
  ts.session_satisfaction,
  ts.user_id,
  p.full_name as athlete_name,
  ts.created_at,
  ts.updated_at
FROM training_sessions ts
LEFT JOIN profiles p ON ts.user_id = p.id
WHERE ts.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' -- ID da Aline
  AND ts.status = 'completed'
  AND DATE(ts.training_date) = CURRENT_DATE
ORDER BY ts.updated_at DESC;

-- 2. Verificar insights de assimilação gerados hoje
SELECT 
  'Insights de assimilação hoje' as info,
  i.id,
  i.insight_type,
  i.context_type,
  i.insight_text,
  i.confidence_score,
  i.generated_by,
  i.user_id,
  p.full_name as athlete_name,
  i.created_at
FROM insights i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' -- ID da Aline
  AND i.context_type = 'training_assimilation'
  AND DATE(i.created_at) = CURRENT_DATE
ORDER BY i.created_at DESC;

-- 3. Verificar todos os insights de hoje (para comparar)
SELECT 
  'Todos os insights de hoje' as info,
  i.id,
  i.insight_type,
  i.context_type,
  i.insight_text,
  i.confidence_score,
  i.generated_by,
  i.user_id,
  p.full_name as athlete_name,
  i.created_at
FROM insights i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' -- ID da Aline
  AND DATE(i.created_at) = CURRENT_DATE
ORDER BY i.created_at DESC;

-- 4. Verificar check-ins de hoje (para confirmar que estão funcionando)
SELECT 
  'Check-ins de hoje' as info,
  dc.id,
  dc.sleep_quality,
  dc.soreness,
  dc.motivation,
  dc.focus,
  dc.confidence,
  dc.user_id,
  p.full_name as athlete_name,
  dc.date,
  dc.created_at
FROM daily_checkins dc
LEFT JOIN profiles p ON dc.user_id = p.id
WHERE dc.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' -- ID da Aline
  AND dc.date = CURRENT_DATE
ORDER BY dc.created_at DESC;

-- 5. Verificar se a Edge Function está sendo registrada nos logs
-- (Esta query pode não retornar dados se os logs não estiverem habilitados)
SELECT 
  'Logs de Edge Functions' as info,
  *
FROM postgres_logs
WHERE log_message ILIKE '%generate-training-assimilation-insight%'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 10;
