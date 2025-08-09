-- Script para testar o check-in após correção
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR SE A TABELA ESTÁ CORRETA
SELECT 
  'VERIFICAÇÃO DA TABELA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins'
  AND column_name IN ('sleep_quality', 'sleep_quality_score', 'sleep_hours')
ORDER BY column_name;

-- 2. VERIFICAR DADOS MAIS RECENTES
SELECT 
  'DADOS MAIS RECENTES' as info,
  id,
  user_id,
  date,
  sleep_quality,
  sleep_quality_score,
  sleep_hours,
  soreness_score,
  mood_score,
  confidence_score,
  focus_score,
  energy_score,
  created_at
FROM daily_checkins
ORDER BY created_at DESC
LIMIT 5;

-- 3. VERIFICAR SE HÁ REGISTROS SEM sleep_quality
SELECT 
  'REGISTROS SEM sleep_quality' as info,
  COUNT(*) as total_sem_sleep_quality
FROM daily_checkins
WHERE sleep_quality IS NULL;

-- 4. VERIFICAR ESTRUTURA COMPLETA DA TABELA
SELECT 
  'ESTRUTURA COMPLETA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins'
ORDER BY ordinal_position; 