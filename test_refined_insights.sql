-- Script para testar os prompts refinados com ciência moderna
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados para detecção de burnout (Raedeke & Smith)
WITH burnout_analysis AS (
  SELECT 
    p.full_name,
    p.experience_level,
    COUNT(dc.id) as total_checkins,
    AVG(CAST(dc.motivation AS DECIMAL)) as avg_motivation,
    AVG(CAST(dc.sleep_quality AS DECIMAL)) as avg_sleep,
    AVG(CAST(dc.confidence AS DECIMAL)) as avg_confidence,
    AVG(CAST(dc.focus AS DECIMAL)) as avg_focus,
    AVG(CAST(dc.soreness AS DECIMAL)) as avg_soreness,
    -- Detecção de burnout
    CASE 
      WHEN AVG(CAST(dc.motivation AS DECIMAL)) < 3 AND AVG(CAST(dc.sleep_quality AS DECIMAL)) < 4 
      THEN 'ALTO RISCO - Burnout detectado'
      WHEN AVG(CAST(dc.motivation AS DECIMAL)) < 3 OR AVG(CAST(dc.sleep_quality AS DECIMAL)) < 4 
      THEN 'MÉDIO RISCO - Fadiga mental'
      ELSE 'BAIXO RISCO'
    END as burnout_risk,
    -- Detecção de overtraining (Hooper & Mackinnon)
    CASE 
      WHEN AVG(CAST(dc.soreness AS DECIMAL)) > 5 AND AVG(CAST(dc.sleep_quality AS DECIMAL)) < 4 
      THEN 'ALTO RISCO - Overtraining detectado'
      WHEN AVG(CAST(dc.soreness AS DECIMAL)) > 4 OR AVG(CAST(dc.sleep_quality AS DECIMAL)) < 5 
      THEN 'MÉDIO RISCO - Fadiga física'
      ELSE 'BAIXO RISCO'
    END as overtraining_risk
  FROM profiles p
  LEFT JOIN daily_checkins dc ON p.id = dc.user_id 
  WHERE dc.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY p.id, p.full_name, p.experience_level
  HAVING COUNT(dc.id) >= 3
)
SELECT 
  'Análise de Risco - Burnout e Overtraining' as etapa,
  full_name,
  experience_level,
  total_checkins,
  ROUND(avg_motivation, 1) as avg_motivation,
  ROUND(avg_sleep, 1) as avg_sleep,
  ROUND(avg_confidence, 1) as avg_confidence,
  ROUND(avg_focus, 1) as avg_focus,
  ROUND(avg_soreness, 1) as avg_soreness,
  burnout_risk,
  overtraining_risk
FROM burnout_analysis
ORDER BY 
  CASE 
    WHEN burnout_risk LIKE '%ALTO RISCO%' OR overtraining_risk LIKE '%ALTO RISCO%' THEN 1
    WHEN burnout_risk LIKE '%MÉDIO RISCO%' OR overtraining_risk LIKE '%MÉDIO RISCO%' THEN 2
    ELSE 3
  END;

-- 2. Verificar dados para Teoria da Autodeterminação
WITH autonomy_analysis AS (
  SELECT 
    p.full_name,
    p.experience_level,
    p.main_goal,
    -- Autonomia: escolhas do atleta
    COUNT(ts.id) as total_trainings,
    COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_trainings,
    -- Competência: progresso e melhoria
    AVG(CAST(ts.session_satisfaction AS DECIMAL)) as avg_satisfaction,
    AVG(CAST(ts.perceived_effort AS DECIMAL)) as avg_effort,
    -- Conexão: engajamento consistente
    COUNT(DISTINCT DATE(ts.created_at)) as training_days,
    -- Cálculo de autonomia
    CASE 
      WHEN COUNT(ts.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN ts.status = 'completed' THEN 1 END)::DECIMAL / COUNT(ts.id)) * 100, 1)
      ELSE 0 
    END as completion_rate
  FROM profiles p
  LEFT JOIN training_sessions ts ON p.id = ts.user_id 
  WHERE ts.created_at >= NOW() - INTERVAL '14 days'
  GROUP BY p.id, p.full_name, p.experience_level, p.main_goal
)
SELECT 
  'Análise - Teoria da Autodeterminação' as etapa,
  full_name,
  experience_level,
  main_goal,
  total_trainings,
  completed_trainings,
  ROUND(avg_satisfaction, 1) as avg_satisfaction,
  ROUND(avg_effort, 1) as avg_effort,
  training_days,
  completion_rate || '%' as completion_rate,
  CASE 
    WHEN completion_rate >= 80 AND avg_satisfaction >= 7 THEN 'ALTA AUTONOMIA'
    WHEN completion_rate >= 60 AND avg_satisfaction >= 6 THEN 'MÉDIA AUTONOMIA'
    ELSE 'BAIXA AUTONOMIA'
  END as autonomy_level
FROM autonomy_analysis
ORDER BY completion_rate DESC;

-- 3. Verificar dados para Teoria da Autoeficácia (Bandura)
WITH self_efficacy_analysis AS (
  SELECT 
    p.full_name,
    p.experience_level,
    -- Experiências de sucesso
    COUNT(CASE WHEN ts.session_satisfaction >= 7 THEN 1 END) as high_satisfaction_sessions,
    COUNT(CASE WHEN ts.session_satisfaction < 5 THEN 1 END) as low_satisfaction_sessions,
    -- Progresso gradual
    AVG(CAST(ts.distance_km AS DECIMAL)) as avg_distance,
    MAX(CAST(ts.distance_km AS DECIMAL)) as max_distance,
    -- Confiança em diferentes condições
    AVG(CAST(dc.confidence AS DECIMAL)) as avg_confidence,
    AVG(CAST(dc.motivation AS DECIMAL)) as avg_motivation,
    -- Cálculo de autoeficácia
    CASE 
      WHEN COUNT(ts.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN ts.session_satisfaction >= 7 THEN 1 END)::DECIMAL / COUNT(ts.id)) * 100, 1)
      ELSE 0 
    END as success_rate
  FROM profiles p
  LEFT JOIN training_sessions ts ON p.id = ts.user_id 
  LEFT JOIN daily_checkins dc ON p.id = dc.user_id
  WHERE (ts.created_at >= NOW() - INTERVAL '14 days' OR dc.created_at >= NOW() - INTERVAL '7 days')
  GROUP BY p.id, p.full_name, p.experience_level
)
SELECT 
  'Análise - Teoria da Autoeficácia' as etapa,
  full_name,
  experience_level,
  high_satisfaction_sessions,
  low_satisfaction_sessions,
  ROUND(avg_distance, 1) as avg_distance_km,
  ROUND(max_distance, 1) as max_distance_km,
  ROUND(avg_confidence, 1) as avg_confidence,
  ROUND(avg_motivation, 1) as avg_motivation,
  success_rate || '%' as success_rate,
  CASE 
    WHEN success_rate >= 70 AND avg_confidence >= 4 THEN 'ALTA AUTOEFICÁCIA'
    WHEN success_rate >= 50 AND avg_confidence >= 3 THEN 'MÉDIA AUTOEFICÁCIA'
    ELSE 'BAIXA AUTOEFICÁCIA'
  END as self_efficacy_level
FROM self_efficacy_analysis
ORDER BY success_rate DESC;

-- 4. Verificar dados para Mindset de Crescimento (Dweck)
WITH growth_mindset_analysis AS (
  SELECT 
    p.full_name,
    p.experience_level,
    -- Aprendizado através de desafios
    COUNT(CASE WHEN ts.perceived_effort >= 7 THEN 1 END) as challenging_sessions,
    COUNT(CASE WHEN ts.perceived_effort <= 4 THEN 1 END) as easy_sessions,
    -- Persistência após dificuldades
    COUNT(CASE WHEN ts.session_satisfaction < 5 AND ts.status = 'completed' THEN 1 END) as completed_despite_low_satisfaction,
    -- Progresso ao longo do tempo
    AVG(CAST(ts.session_satisfaction AS DECIMAL)) as avg_satisfaction,
    STDDEV(CAST(ts.session_satisfaction AS DECIMAL)) as satisfaction_variability,
    -- Adaptação a diferentes condições
    COUNT(DISTINCT ts.training_type) as variety_of_training_types,
    -- Cálculo de mindset de crescimento
    CASE 
      WHEN COUNT(ts.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN ts.perceived_effort >= 7 THEN 1 END)::DECIMAL / COUNT(ts.id)) * 100, 1)
      ELSE 0 
    END as challenge_acceptance_rate
  FROM profiles p
  LEFT JOIN training_sessions ts ON p.id = ts.user_id 
  WHERE ts.created_at >= NOW() - INTERVAL '21 days'
  GROUP BY p.id, p.full_name, p.experience_level
)
SELECT 
  'Análise - Mindset de Crescimento' as etapa,
  full_name,
  experience_level,
  challenging_sessions,
  easy_sessions,
  completed_despite_low_satisfaction,
  ROUND(avg_satisfaction, 1) as avg_satisfaction,
  ROUND(satisfaction_variability, 2) as satisfaction_variability,
  variety_of_training_types,
  challenge_acceptance_rate || '%' as challenge_acceptance_rate,
  CASE 
    WHEN challenge_acceptance_rate >= 60 AND completed_despite_low_satisfaction > 0 THEN 'MINDSET DE CRESCIMENTO'
    WHEN challenge_acceptance_rate >= 40 THEN 'MINDSET MISTO'
    ELSE 'MINDSET FIXO'
  END as growth_mindset_level
FROM growth_mindset_analysis
ORDER BY challenge_acceptance_rate DESC;

-- 5. Simular insights refinados com dados reais
WITH refined_insight_data AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    p.experience_level,
    p.main_goal,
    
    -- Dados para prompt de check-in diário
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
    
    -- Check-ins recentes para análise de tendências
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
    
    -- Treinos recentes para análise de carga
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
  'Dados para Insights Refinados' as etapa,
  user_id,
  full_name,
  experience_level,
  main_goal,
  last_checkin,
  recent_checkins,
  recent_trainings,
  planned_training,
  -- Análise de risco automática
  CASE 
    WHEN (last_checkin->>'motivation')::DECIMAL < 3 AND (last_checkin->>'sleep_quality')::DECIMAL < 4 
    THEN 'ALTO RISCO - Burnout'
    WHEN (last_checkin->>'motivation')::DECIMAL < 3 OR (last_checkin->>'sleep_quality')::DECIMAL < 4 
    THEN 'MÉDIO RISCO - Fadiga'
    ELSE 'BAIXO RISCO'
  END as risk_assessment
FROM refined_insight_data;

-- 6. Verificar se há dados suficientes para insights refinados
SELECT 
  'Verificação - Dados para Insights Refinados' as etapa,
  p.full_name,
  COUNT(dc.id) as total_checkins,
  COUNT(ts.id) as total_trainings,
  COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_trainings,
  -- Dados mínimos para análise de tendências
  CASE 
    WHEN COUNT(dc.id) >= 5 THEN '✅ Suficiente para análise de burnout'
    WHEN COUNT(dc.id) >= 3 THEN '⚠️ Mínimo para análise básica'
    ELSE '❌ Insuficiente'
  END as burnout_analysis,
  -- Dados mínimos para análise de carga
  CASE 
    WHEN COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) >= 3 THEN '✅ Suficiente para análise de carga'
    WHEN COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) >= 1 THEN '⚠️ Mínimo para análise básica'
    ELSE '❌ Insuficiente'
  END as load_analysis,
  -- Dados mínimos para psicologia esportiva
  CASE 
    WHEN COUNT(dc.id) >= 3 AND COUNT(ts.id) >= 2 THEN '✅ Suficiente para psicologia esportiva'
    WHEN COUNT(dc.id) >= 2 OR COUNT(ts.id) >= 1 THEN '⚠️ Mínimo para análise básica'
    ELSE '❌ Insuficiente'
  END as psychology_analysis
FROM profiles p
LEFT JOIN daily_checkins dc ON p.id = dc.user_id AND dc.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN training_sessions ts ON p.id = ts.user_id AND ts.created_at >= NOW() - INTERVAL '7 days'
WHERE p.email = 'aline@gmail.com'
GROUP BY p.id, p.full_name;
