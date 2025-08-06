-- Script para corrigir dados existentes de check-in
-- Execute este script no Supabase SQL Editor para corrigir os dados

-- 1. Primeiro, vamos verificar se há dados com nomes de colunas antigos
SELECT 
    id,
    date,
    sleep_quality,
    soreness,
    emocional,
    motivation,
    focus,
    confidence
FROM daily_checkins 
WHERE sleep_quality IS NOT NULL 
   OR soreness IS NOT NULL 
   OR emocional IS NOT NULL 
   OR motivation IS NOT NULL 
   OR focus IS NOT NULL 
   OR confidence IS NOT NULL
LIMIT 10;

-- 2. Atualizar dados existentes para usar os nomes corretos das colunas
-- (Execute apenas se houver dados com nomes antigos)

-- Atualizar sleep_quality para sleep_quality_score
UPDATE daily_checkins 
SET sleep_quality_score = sleep_quality 
WHERE sleep_quality IS NOT NULL 
  AND sleep_quality_score IS NULL;

-- Atualizar soreness para soreness_score
UPDATE daily_checkins 
SET soreness_score = soreness 
WHERE soreness IS NOT NULL 
  AND soreness_score IS NULL;

-- Atualizar emocional para mood_score
UPDATE daily_checkins 
SET mood_score = emocional 
WHERE emocional IS NOT NULL 
  AND mood_score IS NULL;

-- Atualizar motivation para energy_score (se não houver mood_score)
UPDATE daily_checkins 
SET energy_score = motivation 
WHERE motivation IS NOT NULL 
  AND energy_score IS NULL;

-- Atualizar focus para focus_score
UPDATE daily_checkins 
SET focus_score = focus 
WHERE focus IS NOT NULL 
  AND focus_score IS NULL;

-- Atualizar confidence para confidence_score
UPDATE daily_checkins 
SET confidence_score = confidence 
WHERE confidence IS NOT NULL 
  AND confidence_score IS NULL;

-- 3. Verificar se a migração foi bem-sucedida
SELECT 
    COUNT(*) as total_records,
    COUNT(sleep_quality_score) as sleep_quality_count,
    COUNT(soreness_score) as soreness_count,
    COUNT(mood_score) as mood_count,
    COUNT(confidence_score) as confidence_count,
    COUNT(focus_score) as focus_count,
    COUNT(energy_score) as energy_count
FROM daily_checkins;

-- 4. Mostrar alguns registros corrigidos
SELECT 
    id,
    date,
    sleep_quality_score,
    soreness_score,
    mood_score,
    confidence_score,
    focus_score,
    energy_score
FROM daily_checkins 
ORDER BY created_at DESC 
LIMIT 5; 