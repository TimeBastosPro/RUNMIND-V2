-- Script para testar o fluxo de insights
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
-- PASSO 2: CRIAR DADOS DE TESTE
-- ========================================

-- Inserir um check-in de teste (se não existir)
-- Nota: Removido ON CONFLICT pois a tabela pode não ter constraint única
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
);

-- Inserir um treino de teste para insights
-- Nota: Removido ON CONFLICT pois a tabela pode não ter constraint única
INSERT INTO training_sessions (
  user_id,
  training_date,
  title,
  training_type,
  status,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes,
  avg_heart_rate,
  elevation_gain_meters
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad',
  CURRENT_DATE,
  'Teste de Insights - Corrida',
  'corrida',
  'completed',
  7,
  4,
  8.5,
  45,
  145,
  120
);

-- ========================================
-- PASSO 3: VERIFICAR DADOS INSERIDOS
-- ========================================

-- Verificar o treino inserido
SELECT 
  id,
  user_id,
  title,
  training_type,
  status,
  perceived_effort,
  session_satisfaction,
  distance_km,
  duration_minutes,
  created_at
FROM training_sessions 
WHERE title = 'Teste de Insights - Corrida'
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar check-in do dia
SELECT 
  id,
  user_id,
  date,
  sleep_quality,
  soreness,
  motivation,
  confidence,
  focus
FROM daily_checkins 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND date = CURRENT_DATE;

-- ========================================
-- PASSO 4: VERIFICAR INSIGHTS EXISTENTES
-- ========================================

-- Verificar insights já gerados para este usuário
SELECT 
  id,
  user_id,
  insight_text,
  insight_type,
  context_type,
  confidence_score,
  created_at
FROM insights 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND context_type = 'training_assimilation'
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- PASSO 5: VERIFICAR TRIGGERS
-- ========================================

-- Verificar triggers existentes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%insight%';

-- ========================================
-- PASSO 6: INSTRUÇÕES PARA TESTE MANUAL
-- ========================================

-- Para testar o fluxo completo:
-- 1. Execute este script para criar dados de teste
-- 2. Vá para o app e registre um novo treino
-- 3. Verifique se aparece um insight na aba Insights
-- 4. Monitore os logs no console do navegador
