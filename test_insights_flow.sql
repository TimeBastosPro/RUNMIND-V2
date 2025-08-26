-- Script para testar o fluxo completo de insights
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR DADOS EXISTENTES
-- ========================================

-- Verificar usuários
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- Verificar treinos realizados
SELECT 
  id,
  user_id,
  title,
  training_type,
  status,
  training_date,
  perceived_effort,
  session_satisfaction,
  created_at
FROM training_sessions 
WHERE status = 'completed'
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar check-ins diários
SELECT 
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  created_at
FROM daily_checkins 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar insights existentes
SELECT 
  id,
  user_id,
  insight_text,
  insight_type,
  context_type,
  confidence_score,
  created_at
FROM insights 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- PASSO 2: VERIFICAR EDGE FUNCTIONS
-- ========================================

-- Verificar se as Edge Functions estão registradas
SELECT 
  name,
  version,
  status
FROM supabase_functions.hooks 
WHERE name LIKE '%insight%';

-- ========================================
-- PASSO 3: SIMULAR DADOS PARA TESTE
-- ========================================

-- Inserir um check-in de teste (se não existir)
INSERT INTO daily_checkins (
  user_id, 
  date, 
  sleep_quality, 
  soreness, 
  motivation, 
  confidence, 
  focus, 
  emocional
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad',
  CURRENT_DATE,
  6,
  3,
  4,
  4,
  4,
  4
) ON CONFLICT (user_id, date) DO NOTHING;

-- Inserir um treino de teste (se não existir)
INSERT INTO training_sessions (
  user_id,
  training_date,
  title,
  training_type,
  status,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad',
  CURRENT_DATE,
  'Treino de Teste para Insights',
  'corrida',
  'completed',
  7,
  4,
  5.0,
  30
) ON CONFLICT DO NOTHING;

-- ========================================
-- PASSO 4: VERIFICAR TRIGGERS
-- ========================================

-- Verificar triggers existentes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%insight%';

-- ========================================
-- PASSO 5: TESTAR MANUALMENTE
-- ========================================

-- Simular chamada da Edge Function manualmente
-- (Execute isso em uma nova aba do SQL Editor)

-- SELECT 
--   net.http_post(
--     url := 'https://dxzqfbslxtkxfayhydug.supabase.co/functions/v1/generate-training-assimilation-insight-v2',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'access_token' || '"}',
--     body := json_build_object(
--       'athleteData', json_build_object(
--         'completedTraining', (
--           SELECT row_to_json(t) 
--           FROM training_sessions t 
--           WHERE t.id = (SELECT MAX(id) FROM training_sessions WHERE status = 'completed')
--         )
--       )
--     )::text
--   );

-- ========================================
-- PASSO 6: VERIFICAR LOGS
-- ========================================

-- Verificar logs de Edge Functions (se disponível)
-- SELECT * FROM supabase_functions.logs 
-- WHERE function_name LIKE '%insight%'
-- ORDER BY created_at DESC 
-- LIMIT 10;
