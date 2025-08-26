-- Script simples para verificar dados de insights
-- Execute este script no Supabase SQL Editor

-- ========================================
-- VERIFICAR DADOS EXISTENTES
-- ========================================

-- 1. Verificar usuários
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Verificar treinos realizados
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

-- 3. Verificar check-ins diários
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

-- 4. Verificar insights existentes
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

-- 5. Verificar triggers existentes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%insight%';

-- ========================================
-- INSTRUÇÕES PARA TESTE
-- ========================================

-- Para testar o fluxo de insights:
-- 1. Vá para o app
-- 2. Registre um novo treino como realizado
-- 3. Verifique se aparece um insight na aba Insights
-- 4. Monitore os logs no console do navegador
