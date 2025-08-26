-- Script para analisar testes de performance e fórmulas científicas
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

-- Verificar estrutura da tabela fitness_tests
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'fitness_tests'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela profiles (dados fisiológicos)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
  AND column_name IN ('height_cm', 'weight_kg', 'date_of_birth', 'gender', 'max_heart_rate', 'resting_heart_rate')
ORDER BY ordinal_position;

-- ========================================
-- PASSO 2: ANALISAR DADOS DOS TESTES
-- ========================================

-- Verificar todos os testes de performance registrados
SELECT 
  ft.id,
  ft.user_id,
  p.full_name,
  ft.protocol_name,
  ft.test_date,
  ft.distance_meters,
  ft.time_seconds,
  ft.final_heart_rate,
  ft.calculated_vo2max,
  ft.calculated_vam,
  ft.created_at,
  -- Dados do perfil para validação
  p.height_cm,
  p.weight_kg,
  p.date_of_birth,
  p.gender,
  p.max_heart_rate,
  p.resting_heart_rate
FROM fitness_tests ft
LEFT JOIN profiles p ON ft.user_id = p.id
ORDER BY ft.test_date DESC, ft.created_at DESC;

-- ========================================
-- PASSO 3: VALIDAR FÓRMULAS IMPLEMENTADAS
-- ========================================

-- Teste 1: Validar fórmula de Cooper (12 min)
-- VO2max = (distância - 504.9) / 44.73
WITH cooper_tests AS (
  SELECT 
    ft.*,
    p.date_of_birth,
    p.gender,
    -- Cálculo manual para comparação
    CASE 
      WHEN ft.distance_meters IS NOT NULL THEN 
        (ft.distance_meters - 504.9) / 44.73
      ELSE NULL 
    END as manual_vo2max_cooper
  FROM fitness_tests ft
  LEFT JOIN profiles p ON ft.user_id = p.id
  WHERE ft.protocol_name LIKE '%Cooper%'
)
SELECT 
  id,
  protocol_name,
  distance_meters,
  calculated_vo2max as vo2max_calculado,
  manual_vo2max_cooper as vo2max_manual,
  CASE 
    WHEN ABS(calculated_vo2max - manual_vo2max_cooper) < 0.1 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as validacao
FROM cooper_tests
WHERE distance_meters IS NOT NULL;

-- Teste 2: Validar fórmula de 3km
-- VO2max = 80 - (pace_min/km - 3.5) × 8
WITH test_3km AS (
  SELECT 
    ft.*,
    -- Cálculo manual para comparação
    CASE 
      WHEN ft.time_seconds IS NOT NULL THEN 
        80 - ((ft.time_seconds / 60.0 / 3.0) - 3.5) * 8
      ELSE NULL 
    END as manual_vo2max_3km
  FROM fitness_tests ft
  WHERE ft.protocol_name LIKE '%3km%'
)
SELECT 
  id,
  protocol_name,
  time_seconds,
  calculated_vo2max as vo2max_calculado,
  manual_vo2max_3km as vo2max_manual,
  CASE 
    WHEN ABS(calculated_vo2max - manual_vo2max_3km) < 0.1 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as validacao
FROM test_3km
WHERE time_seconds IS NOT NULL;

-- Teste 3: Validar fórmula de Rockport
-- VO2max = 132.853 - (0.0769 × peso) - (0.3877 × idade) + (6.315 × gênero) - (3.2649 × tempo) - (0.1565 × FC)
WITH rockport_tests AS (
  SELECT 
    ft.*,
    p.weight_kg,
    p.date_of_birth,
    p.gender,
    -- Cálculo da idade
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::date)) as idade,
    -- Cálculo manual para comparação
    CASE 
      WHEN ft.time_seconds IS NOT NULL AND p.weight_kg IS NOT NULL AND p.date_of_birth IS NOT NULL AND p.gender IS NOT NULL AND ft.final_heart_rate IS NOT NULL THEN
        132.853 - (0.0769 * p.weight_kg) - (0.3877 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::date))) + 
        (6.315 * CASE WHEN p.gender = 'male' THEN 1 ELSE 0 END) - 
        (3.2649 * (ft.time_seconds / 60.0)) - (0.1565 * ft.final_heart_rate)
      ELSE NULL 
    END as manual_vo2max_rockport
  FROM fitness_tests ft
  LEFT JOIN profiles p ON ft.user_id = p.id
  WHERE ft.protocol_name LIKE '%Rockport%'
)
SELECT 
  id,
  protocol_name,
  time_seconds,
  final_heart_rate,
  weight_kg,
  idade,
  gender,
  calculated_vo2max as vo2max_calculado,
  manual_vo2max_rockport as vo2max_manual,
  CASE 
    WHEN ABS(calculated_vo2max - manual_vo2max_rockport) < 0.1 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as validacao
FROM rockport_tests
WHERE manual_vo2max_rockport IS NOT NULL;

-- ========================================
-- PASSO 4: VALIDAR CÁLCULO DE VAM
-- ========================================

-- VAM = VO2max / 3.5
SELECT 
  id,
  protocol_name,
  calculated_vo2max,
  calculated_vam as vam_calculado,
  (calculated_vo2max / 3.5) as vam_manual,
  CASE 
    WHEN ABS(calculated_vam - (calculated_vo2max / 3.5)) < 0.01 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as validacao_vam
FROM fitness_tests
WHERE calculated_vo2max IS NOT NULL;

-- ========================================
-- PASSO 5: VALIDAR FÓRMULA DE TANAKA
-- ========================================

-- FCmax = 208 - (0.7 × idade)
SELECT 
  p.id,
  p.full_name,
  p.date_of_birth,
  p.max_heart_rate as fc_max_calculada,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::date)) as idade,
  (208 - (0.7 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::date)))) as fc_max_manual,
  CASE 
    WHEN p.max_heart_rate = (208 - (0.7 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth::date)))) THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as validacao_tanaka
FROM profiles p
WHERE p.date_of_birth IS NOT NULL AND p.max_heart_rate IS NOT NULL;

-- ========================================
-- PASSO 6: VERIFICAR ZONAS DE TREINO
-- ========================================

-- Verificar se há dados suficientes para calcular zonas
SELECT 
  p.id,
  p.full_name,
  p.max_heart_rate,
  p.resting_heart_rate,
  CASE 
    WHEN p.max_heart_rate IS NOT NULL AND p.resting_heart_rate IS NOT NULL THEN '✅ Dados completos'
    WHEN p.max_heart_rate IS NOT NULL THEN '⚠️ Falta FC Repouso'
    WHEN p.resting_heart_rate IS NOT NULL THEN '⚠️ Falta FC Máxima'
    ELSE '❌ Dados insuficientes'
  END as status_zonas_fc,
  CASE 
    WHEN EXISTS (SELECT 1 FROM fitness_tests ft WHERE ft.user_id = p.id AND ft.calculated_vo2max IS NOT NULL) THEN '✅ Teste disponível'
    ELSE '❌ Sem teste de performance'
  END as status_zonas_pace
FROM profiles p
WHERE p.id IN (SELECT DISTINCT user_id FROM fitness_tests);

-- ========================================
-- PASSO 7: RESUMO DOS PROBLEMAS ENCONTRADOS
-- ========================================

-- Contar testes por protocolo
SELECT 
  protocol_name,
  COUNT(*) as total_testes,
  AVG(calculated_vo2max) as vo2max_medio,
  AVG(calculated_vam) as vam_medio,
  MIN(test_date) as primeiro_teste,
  MAX(test_date) as ultimo_teste
FROM fitness_tests
GROUP BY protocol_name
ORDER BY total_testes DESC;

-- Verificar testes com valores suspeitos
SELECT 
  id,
  protocol_name,
  calculated_vo2max,
  calculated_vam,
  CASE 
    WHEN calculated_vo2max < 20 OR calculated_vo2max > 100 THEN '⚠️ VO2max suspeito'
    WHEN calculated_vam < 5 OR calculated_vam > 25 THEN '⚠️ VAM suspeita'
    ELSE '✅ Valores normais'
  END as observacao
FROM fitness_tests
WHERE calculated_vo2max < 20 OR calculated_vo2max > 100 
   OR calculated_vam < 5 OR calculated_vam > 25;
