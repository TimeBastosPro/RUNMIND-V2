-- Script para verificar problemas de perfil e insights
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

-- Verificar se a tabela profiles existe e sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar se a tabela profile_preferences existe (deve retornar 0 linhas)
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'profile_preferences';

-- ========================================
-- PASSO 2: VERIFICAR DADOS DO USUÁRIO
-- ========================================

-- Verificar dados do perfil do usuário
SELECT 
  id,
  email,
  full_name,
  experience_level,
  main_goal,
  context_type,
  onboarding_completed,
  user_type,
  date_of_birth,
  weight_kg,
  height_cm,
  parq_answers,
  training_days,
  preferred_training_period,
  terrain_preference,
  work_stress_level,
  sleep_consistency,
  wakeup_feeling,
  hydration_habit,
  recovery_habit,
  stress_management,
  created_at,
  updated_at
FROM profiles 
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- Verificar se o usuário é treinador
SELECT 
  id,
  user_id,
  full_name,
  email,
  cref,
  created_at
FROM coaches 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- ========================================
-- PASSO 3: VERIFICAR DADOS DO DIA 24
-- ========================================

-- Verificar check-in do dia 24
SELECT 
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus,
  created_at
FROM daily_checkins 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND date = '2025-08-24';

-- Verificar treino do dia 24
SELECT 
  id,
  user_id,
  title,
  training_type,
  status,
  training_date,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes,
  created_at
FROM training_sessions 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND training_date = '2025-08-24'
ORDER BY created_at DESC;

-- ========================================
-- PASSO 4: VERIFICAR INSIGHTS EXISTENTES
-- ========================================

-- Verificar insights do usuário
SELECT 
  id,
  user_id,
  insight_type,
  content,
  created_at
FROM insights 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- PASSO 5: CRIAR DADOS DE TESTE (se necessário)
-- ========================================

-- Inserir check-in do dia 24 (se não existir)
INSERT INTO daily_checkins (
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad',
  '2025-08-24',
  7,
  3,
  8,
  7,
  6
) ON CONFLICT (user_id, date) DO NOTHING;

-- Inserir treino do dia 24 (se não existir)
INSERT INTO training_sessions (
  user_id,
  title,
  training_type,
  status,
  training_date,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad',
  'Treino de Resistência',
  'completed',
  'completed',
  '2025-08-24',
  7,
  5,
  10.5,
  65
) ON CONFLICT (user_id, training_date) DO NOTHING;

-- ========================================
-- PASSO 6: VERIFICAR DADOS APÓS INSERÇÃO
-- ========================================

-- Verificar check-in do dia 24 (após inserção)
SELECT 
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus,
  created_at
FROM daily_checkins 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND date = '2025-08-24';

-- Verificar treino do dia 24 (após inserção)
SELECT 
  id,
  user_id,
  title,
  training_type,
  status,
  training_date,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes,
  created_at
FROM training_sessions 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND training_date = '2025-08-24'
ORDER BY created_at DESC;

-- ========================================
-- PASSO 7: INSTRUÇÕES PARA TESTE
-- ========================================

-- Após executar este script:
-- 1. Verifique se os dados foram inseridos corretamente
-- 2. No app, tente marcar o treino do dia 24 como realizado
-- 3. Monitore o console para ver os logs de insight
-- 4. Verifique se o insight foi gerado na tabela insights
