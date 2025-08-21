-- Script para testar e verificar a geração de insights
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados de check-ins recentes
SELECT 
  'Check-ins recentes' as etapa,
  COUNT(*) as total_checkins,
  AVG(CAST(sleep_quality AS DECIMAL)) as avg_sleep,
  AVG(CAST(motivation AS DECIMAL)) as avg_motivation,
  AVG(CAST(soreness AS DECIMAL)) as avg_soreness,
  AVG(CAST(confidence AS DECIMAL)) as avg_confidence,
  AVG(CAST(focus AS DECIMAL)) as avg_focus
FROM daily_checkins 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 2. Verificar dados de treinos recentes
SELECT 
  'Treinos recentes' as etapa,
  COUNT(*) as total_treinos,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as treinos_completados,
  AVG(CAST(perceived_effort AS DECIMAL)) as avg_esforco,
  AVG(CAST(session_satisfaction AS DECIMAL)) as avg_satisfacao
FROM training_sessions 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 3. Verificar perfil do usuário
SELECT 
  'Perfil do usuário' as etapa,
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

-- 4. Verificar insights existentes
SELECT 
  'Insights existentes' as etapa,
  COUNT(*) as total_insights,
  insight_type,
  generated_by,
  AVG(confidence_score) as avg_confianca,
  MIN(created_at) as primeiro_insight,
  MAX(created_at) as ultimo_insight
FROM insights 
GROUP BY insight_type, generated_by
ORDER BY insight_type;

-- 5. Verificar dados completos para geração de insight
WITH user_data AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    p.experience_level,
    p.main_goal,
    p.context_type,
    p.weight_kg,
    p.height_cm,
    p.training_days,
    p.preferred_training_period,
    p.terrain_preference,
    
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
    
    -- Check-ins recentes (últimos 3)
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
    LIMIT 3) as recent_checkins,
    
    -- Treinos recentes (últimos 5)
    (SELECT jsonb_agg(jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duration_minutes,
      'perceived_effort', ts.perceived_effort,
      'session_satisfaction', ts.session_satisfaction,
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
  'Dados completos para insight' as etapa,
  user_id,
  full_name,
  experience_level,
  main_goal,
  last_checkin,
  recent_checkins,
  recent_trainings,
  planned_training
FROM user_data;

-- 6. Verificar se há dados suficientes para gerar insights
SELECT 
  'Verificação de dados' as etapa,
  p.full_name,
  COUNT(dc.id) as total_checkins,
  COUNT(ts.id) as total_treinos,
  COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as treinos_completados,
  COUNT(CASE WHEN ts.status = 'planned' THEN 1 END) as treinos_planejados,
  CASE 
    WHEN COUNT(dc.id) >= 3 AND COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) >= 1 
    THEN 'Dados suficientes para insight'
    ELSE 'Dados insuficientes para insight'
  END as status_insight
FROM profiles p
LEFT JOIN daily_checkins dc ON p.id = dc.user_id AND dc.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN training_sessions ts ON p.id = ts.user_id AND ts.created_at >= NOW() - INTERVAL '7 days'
WHERE p.email = 'aline@gmail.com'
GROUP BY p.id, p.full_name;
