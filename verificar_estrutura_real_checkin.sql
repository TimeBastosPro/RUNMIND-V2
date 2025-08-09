-- Script para verificar a estrutura real da tabela daily_checkins
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR ESTRUTURA COMPLETA DA TABELA
SELECT 
  'ESTRUTURA COMPLETA DA TABELA daily_checkins' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'daily_checkins'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES (últimos 5 registros)
SELECT 
  'DADOS EXISTENTES - ÚLTIMOS 5 REGISTROS' as info,
  id,
  user_id,
  date,
  created_at,
  -- Campos relacionados ao sono
  sleep_quality,
  sleep_quality_score,
  -- Campos relacionados ao bem-estar
  soreness_score,
  mood_score,
  confidence_score,
  focus_score,
  energy_score,
  -- Outros campos
  notes
FROM daily_checkins
ORDER BY created_at DESC
LIMIT 5;

-- 3. VERIFICAR QUAIS CAMPOS ESTÃO SENDO USADOS
SELECT 
  'ANÁLISE DE USO DOS CAMPOS' as info,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN sleep_quality IS NOT NULL THEN 1 END) as com_sleep_quality,
  COUNT(CASE WHEN sleep_quality_score IS NOT NULL THEN 1 END) as com_sleep_quality_score,
  COUNT(CASE WHEN soreness_score IS NOT NULL THEN 1 END) as com_soreness_score,
  COUNT(CASE WHEN mood_score IS NOT NULL THEN 1 END) as com_mood_score,
  COUNT(CASE WHEN confidence_score IS NOT NULL THEN 1 END) as com_confidence_score,
  COUNT(CASE WHEN focus_score IS NOT NULL THEN 1 END) as com_focus_score,
  COUNT(CASE WHEN energy_score IS NOT NULL THEN 1 END) as com_energy_score
FROM daily_checkins;

-- 4. VERIFICAR SE EXISTE CAMPO sleep_hours
SELECT 
  'VERIFICAÇÃO DE CAMPO sleep_hours' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'daily_checkins' AND column_name = 'sleep_hours'
    ) THEN 'EXISTE'
    ELSE 'NÃO EXISTE'
  END as sleep_hours_exists; 