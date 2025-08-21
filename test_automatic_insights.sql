-- Script para testar a geração automática de insights
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados para insights de check-in diário
WITH daily_checkin_data AS (
  SELECT 
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
    
    -- Check-ins recentes (últimos 7 dias)
    (SELECT jsonb_agg(jsonb_build_object(
      'sleep_quality', dc.sleep_quality,
      'soreness', dc.soreness,
      'motivation', dc.motivation,
      'confidence', dc.confidence,
      'focus', dc.focus,
      'created_at', dc.created_at
    )) FROM daily_checkins dc 
    WHERE dc.user_id = p.id 
    AND dc.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY dc.created_at DESC) as recent_checkins,
    
    -- Próximo treino planejado
    (SELECT jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duracao_minutos,
      'description', ts.title
    ) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    AND ts.status = 'planned'
    AND ts.training_date >= CURRENT_DATE
    ORDER BY ts.training_date ASC 
    LIMIT 1) as planned_training
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Dados para Insight de Check-in Diário' as etapa,
  full_name,
  experience_level,
  main_goal,
  last_checkin,
  recent_checkins,
  planned_training,
  -- Verificar se há dados suficientes
  CASE 
    WHEN last_checkin IS NOT NULL AND recent_checkins IS NOT NULL AND jsonb_array_length(recent_checkins) >= 2 
    THEN '✅ Dados suficientes para insight de check-in'
    ELSE '❌ Dados insuficientes para insight de check-in'
  END as data_sufficiency
FROM daily_checkin_data;

-- 2. Verificar dados para insights de feedback pós-treino
WITH training_feedback_data AS (
  SELECT 
    p.full_name,
    p.experience_level,
    -- Treino mais recente completado
    (SELECT jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duracao_minutos,
      'perceived_effort', ts.perceived_effort,
      'session_satisfaction', ts.session_satisfaction,
      'avg_heart_rate', ts.avg_heart_rate,
      'elevation_gain_meters', ts.elevation_gain_meters,
      'created_at', ts.created_at
    ) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    AND ts.status = 'completed'
    ORDER BY ts.created_at DESC 
    LIMIT 1) as last_completed_training,
    
    -- Treinos recentes (últimos 5)
    (SELECT jsonb_agg(jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duracao_minutos,
      'perceived_effort', ts.perceived_effort,
      'session_satisfaction', ts.session_satisfaction,
      'avg_heart_rate', ts.avg_heart_rate,
      'elevation_gain_meters', ts.elevation_gain_meters,
      'created_at', ts.created_at
    )) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    AND ts.status = 'completed'
    ORDER BY ts.created_at DESC 
    LIMIT 5) as recent_trainings
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Dados para Insight de Feedback Pós-Treino' as etapa,
  full_name,
  experience_level,
  last_completed_training,
  recent_trainings,
  -- Verificar se há dados suficientes
  CASE 
    WHEN last_completed_training IS NOT NULL AND recent_trainings IS NOT NULL AND jsonb_array_length(recent_trainings) >= 1 
    THEN '✅ Dados suficientes para insight de feedback'
    ELSE '❌ Dados insuficientes para insight de feedback'
  END as data_sufficiency
FROM training_feedback_data;

-- 3. Verificar dados para insights de reflexão semanal
WITH weekly_summary_data AS (
  SELECT 
    p.full_name,
    p.experience_level,
    p.main_goal,
    
    -- Calcular semana atual (domingo a sábado)
    DATE_TRUNC('week', CURRENT_DATE) as week_start,
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' as week_end,
    
    -- Treinos da semana atual
    (SELECT jsonb_agg(jsonb_build_object(
      'training_type', ts.training_type,
      'distance_km', ts.distance_km,
      'duration_minutes', ts.duracao_minutos,
      'perceived_effort', ts.perceived_effort,
      'session_satisfaction', ts.session_satisfaction,
      'status', ts.status,
      'created_at', ts.created_at
    )) FROM training_sessions ts 
    WHERE ts.user_id = p.id 
    AND ts.created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND ts.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    ORDER BY ts.created_at DESC) as weekly_trainings,
    
    -- Reflexão semanal (se existir)
    (SELECT jsonb_build_object(
      'enjoyment', wr.enjoyment,
      'progress', wr.progress,
      'confidence', wr.confidence,
      'week_start', wr.week_start,
      'created_at', wr.created_at
    ) FROM weekly_reflections wr 
    WHERE wr.user_id = p.id 
    AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date
    LIMIT 1) as weekly_reflection
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Dados para Insight de Reflexão Semanal' as etapa,
  full_name,
  experience_level,
  main_goal,
  week_start,
  week_end,
  weekly_trainings,
  weekly_reflection,
  -- Calcular métricas da semana
  CASE 
    WHEN weekly_trainings IS NOT NULL THEN
      jsonb_build_object(
        'total_trainings', jsonb_array_length(weekly_trainings),
        'completed_trainings', (
          SELECT COUNT(*)::int 
          FROM jsonb_array_elements(weekly_trainings) as t 
          WHERE (t->>'status') = 'completed'
        ),
        'total_distance', (
          SELECT COALESCE(SUM((t->>'distance_km')::numeric), 0) 
          FROM jsonb_array_elements(weekly_trainings) as t 
          WHERE (t->>'status') = 'completed'
        ),
        'avg_effort', (
          SELECT COALESCE(AVG((t->>'perceived_effort')::numeric), 0) 
          FROM jsonb_array_elements(weekly_trainings) as t 
          WHERE (t->>'status') = 'completed' AND (t->>'perceived_effort') IS NOT NULL
        ),
        'avg_satisfaction', (
          SELECT COALESCE(AVG((t->>'session_satisfaction')::numeric), 0) 
          FROM jsonb_array_elements(weekly_trainings) as t 
          WHERE (t->>'status') = 'completed' AND (t->>'session_satisfaction') IS NOT NULL
        )
      )
    ELSE jsonb_build_object(
      'total_trainings', 0,
      'completed_trainings', 0,
      'total_distance', 0,
      'avg_effort', 0,
      'avg_satisfaction', 0
    )
  END as weekly_metrics,
  -- Verificar se há dados suficientes
  CASE 
    WHEN weekly_trainings IS NOT NULL AND jsonb_array_length(weekly_trainings) >= 2 
    THEN '✅ Dados suficientes para insight semanal'
    ELSE '❌ Dados insuficientes para insight semanal'
  END as data_sufficiency
FROM weekly_summary_data;

-- 4. Verificar insights já gerados automaticamente
SELECT 
  'Insights Gerados Automaticamente' as etapa,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  i.source_data,
  i.created_at,
  p.full_name
FROM insights i
JOIN profiles p ON i.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY i.created_at DESC
LIMIT 10;

-- 5. Simular fluxo completo de geração automática
WITH simulation AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    
    -- Simular check-in diário
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM daily_checkins dc 
        WHERE dc.user_id = p.id 
        AND dc.created_at >= CURRENT_DATE
      ) THEN '✅ Check-in diário realizado - Insight gerado automaticamente'
      ELSE '⏳ Check-in diário pendente'
    END as daily_checkin_status,
    
    -- Simular feedback pós-treino
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.user_id = p.id 
        AND ts.status = 'completed'
        AND ts.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ) THEN '✅ Feedback pós-treino realizado - Insight gerado automaticamente'
      ELSE '⏳ Feedback pós-treino pendente'
    END as training_feedback_status,
    
    -- Simular reflexão semanal
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM weekly_reflections wr 
        WHERE wr.user_id = p.id 
        AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE)::date
      ) THEN '✅ Reflexão semanal realizada - Insight gerado automaticamente'
      ELSE '⏳ Reflexão semanal pendente'
    END as weekly_reflection_status
    
  FROM profiles p
  WHERE p.email = 'aline@gmail.com'
)
SELECT 
  'Simulação - Fluxo de Geração Automática' as etapa,
  full_name,
  email,
  daily_checkin_status,
  training_feedback_status,
  weekly_reflection_status,
  -- Status geral
  CASE 
    WHEN daily_checkin_status LIKE '✅%' AND training_feedback_status LIKE '✅%' AND weekly_reflection_status LIKE '✅%'
    THEN '🎉 Fluxo completo - Todos os insights gerados'
    WHEN daily_checkin_status LIKE '✅%' OR training_feedback_status LIKE '✅%' OR weekly_reflection_status LIKE '✅%'
    THEN '🔄 Fluxo parcial - Alguns insights gerados'
    ELSE '⏳ Fluxo pendente - Nenhum insight gerado ainda'
  END as overall_status
FROM simulation;
