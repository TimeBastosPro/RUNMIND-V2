-- Script para testar a nova estrutura de insights contextuais
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela insights
SELECT 
  'Estrutura da tabela insights' as etapa,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'insights' 
ORDER BY ordinal_position;

-- 2. Verificar insights existentes por tipo
SELECT 
  'Insights por tipo' as etapa,
  insight_type,
  generated_by,
  COUNT(*) as total,
  AVG(confidence_score) as avg_confianca,
  MIN(created_at) as primeiro,
  MAX(created_at) as ultimo
FROM insights 
GROUP BY insight_type, generated_by
ORDER BY insight_type;

-- 3. Verificar dados de check-ins recentes para insights de check-in diário
SELECT 
  'Dados para insight de check-in' as etapa,
  COUNT(*) as total_checkins,
  AVG(CAST(sleep_quality AS DECIMAL)) as avg_sono,
  AVG(CAST(soreness AS DECIMAL)) as avg_dores,
  AVG(CAST(motivation AS DECIMAL)) as avg_motivacao,
  AVG(CAST(confidence AS DECIMAL)) as avg_confianca,
  AVG(CAST(focus AS DECIMAL)) as avg_foco
FROM daily_checkins 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 4. Verificar dados de treinos recentes para insights de feedback
SELECT 
  'Dados para insight de feedback de treino' as etapa,
  COUNT(*) as total_treinos,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as treinos_completados,
  AVG(CAST(perceived_effort AS DECIMAL)) as avg_esforco,
  AVG(CAST(session_satisfaction AS DECIMAL)) as avg_satisfacao,
  AVG(CAST(avg_heart_rate AS DECIMAL)) as avg_fc,
  AVG(CAST(elevation_gain_meters AS DECIMAL)) as avg_altimetria
FROM training_sessions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 5. Calcular resumo semanal para insights semanais
WITH weekly_summary AS (
  SELECT 
    DATE_TRUNC('week', created_at) as week_start,
    COUNT(*) as total_trainings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trainings,
    SUM(CAST(distance_km AS DECIMAL)) as total_distance,
    AVG(CAST(perceived_effort AS DECIMAL)) as avg_effort,
    AVG(CAST(session_satisfaction AS DECIMAL)) as avg_satisfaction
  FROM training_sessions 
  WHERE created_at >= NOW() - INTERVAL '4 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
)
SELECT 
  'Resumo semanal para insights' as etapa,
  week_start,
  total_trainings,
  completed_trainings,
  ROUND(total_distance, 2) as total_distance_km,
  ROUND(avg_effort, 1) as avg_effort,
  ROUND(avg_satisfaction, 1) as avg_satisfaction,
  CASE 
    WHEN total_trainings > 0 
    THEN ROUND((completed_trainings::DECIMAL / total_trainings) * 100, 1)
    ELSE 0 
  END as completion_rate
FROM weekly_summary
ORDER BY week_start DESC;

-- 6. Verificar perfil do usuário para personalização
SELECT 
  'Perfil para personalização' as etapa,
  full_name,
  experience_level,
  main_goal,
  context_type,
  weight_kg,
  height_cm,
  training_days,
  preferred_training_period,
  terrain_preference
FROM profiles 
WHERE email = 'aline@gmail.com';

-- 7. Simular dados para teste de insights contextuais
WITH test_data AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    p.experience_level,
    p.main_goal,
    
    -- Último check-in
    (SELECT jsonb_build_object(
      'sleep_quality', dc.sleep_quality,
      'soreness', dc.soreness,
      'motivation', dc.motivation,
      'confidence', dc.confidence,
      'focus', dc.focus,
      'created_at', dc.created_at
    ) FROM daily_checkins dc 
    WHERE dc.user_id = p.id 
    ORDER BY dc.created_at DESC 
    LIMIT 1) as last_checkin,
    
    -- Check-ins recentes (últimos 7)
    (SELECT jsonb_agg(jsonb_build_object(
      'sleep_quality', dc.sleep_quality,
      'soreness', dc.soreness,
      'motivation', dc.motivation,
      'confidence', dc.confidence,
      'focus', dc.focus,
      'created_at', dc.created_at
    )) FROM daily_checkins dc 
    WHERE dc.user_id = p.id 
    ORDER BY dc.created_at DESC 
    LIMIT 7) as recent_checkins,
    
    -- Treinos recentes (últimos 5)
    (SELECT jsonb_agg(jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duration_minutes,
      'perceived_effort', ts.perceived_effort,
      'session_satisfaction', ts.session_satisfaction,
      'avg_heart_rate', ts.avg_heart_rate,
      'elevation_gain_meters', ts.elevation_gain_meters,
      'status', ts.status,
      'created_at', ts.created_at
    )) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    ORDER BY ts.created_at DESC 
    LIMIT 5) as recent_trainings,
    
    -- Próximo treino planejado
    (SELECT jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duration_minutes,
      'description', ts.description
    ) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    AND ts.status = 'planned'
    AND ts.planned_date >= CURRENT_DATE
    ORDER BY ts.planned_date ASC 
    LIMIT 1) as planned_training
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Dados completos para insights contextuais' as etapa,
  user_id,
  full_name,
  experience_level,
  main_goal,
  last_checkin,
  recent_checkins,
  recent_trainings,
  planned_training
FROM test_data;

-- 8. Verificar se há dados suficientes para cada tipo de insight
SELECT 
  'Verificação de dados para insights' as etapa,
  p.full_name,
  COUNT(dc.id) as total_checkins,
  COUNT(ts.id) as total_treinos,
  COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as treinos_completados,
  COUNT(CASE WHEN ts.status = 'planned' THEN 1 END) as treinos_planejados,
  CASE 
    WHEN COUNT(dc.id) >= 2 THEN '✅ Check-in diário'
    ELSE '❌ Check-in diário'
  END as insight_checkin,
  CASE 
    WHEN COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) >= 1 THEN '✅ Feedback treino'
    ELSE '❌ Feedback treino'
  END as insight_feedback,
  CASE 
    WHEN COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) >= 2 THEN '✅ Resumo semanal'
    ELSE '❌ Resumo semanal'
  END as insight_semanal
FROM profiles p
LEFT JOIN daily_checkins dc ON p.id = dc.user_id AND dc.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN training_sessions ts ON p.id = ts.user_id AND ts.created_at >= NOW() - INTERVAL '7 days'
WHERE p.email = 'aline@gmail.com'
GROUP BY p.id, p.full_name;
