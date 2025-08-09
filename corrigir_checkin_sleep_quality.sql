-- Script para verificar e corrigir o problema do sleep_quality no check-in
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR ESTRUTURA DA TABELA daily_checkins
SELECT 
  'ESTRUTURA DA TABELA daily_checkins' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT 
  'DADOS EXISTENTES' as info,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN sleep_quality IS NOT NULL THEN 1 END) as com_sleep_quality,
  COUNT(CASE WHEN sleep_quality_score IS NOT NULL THEN 1 END) as com_sleep_quality_score,
  COUNT(CASE WHEN sleep_hours IS NOT NULL THEN 1 END) as com_sleep_hours
FROM daily_checkins;

-- 3. VERIFICAR REGISTROS PROBLEMÁTICOS
SELECT 
  'REGISTROS PROBLEMÁTICOS' as info,
  id,
  user_id,
  date,
  sleep_quality,
  sleep_quality_score,
  sleep_hours,
  soreness,
  soreness_score,
  mood_score,
  confidence_score,
  focus_score,
  energy_score,
  created_at
FROM daily_checkins
WHERE sleep_quality IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. CORRIGIR DADOS EXISTENTES - COPIAR sleep_quality_score PARA sleep_quality
UPDATE daily_checkins 
SET 
  sleep_quality = sleep_quality_score
WHERE sleep_quality IS NULL 
  AND sleep_quality_score IS NOT NULL;

-- 5. CORRIGIR DADOS EXISTENTES - COPIAR sleep_hours PARA sleep_quality (se necessário)
UPDATE daily_checkins 
SET 
  sleep_quality = sleep_hours
WHERE sleep_quality IS NULL 
  AND sleep_hours IS NOT NULL;

-- 6. VERIFICAR APÓS CORREÇÃO
SELECT 
  'APÓS CORREÇÃO' as info,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN sleep_quality IS NOT NULL THEN 1 END) as com_sleep_quality,
  COUNT(CASE WHEN sleep_quality IS NULL THEN 1 END) as sem_sleep_quality
FROM daily_checkins;

-- 7. VERIFICAR SE AINDA HÁ PROBLEMAS
SELECT 
  'VERIFICAÇÃO FINAL' as info,
  id,
  user_id,
  date,
  sleep_quality,
  sleep_quality_score,
  sleep_hours,
  created_at
FROM daily_checkins
WHERE sleep_quality IS NULL
ORDER BY created_at DESC
LIMIT 5; 