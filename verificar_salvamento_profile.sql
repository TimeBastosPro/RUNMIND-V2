-- Script para verificar se os dados do perfil estão sendo salvos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar perfil da Aline
SELECT 
  'Perfil da Aline - Dados Pessoais' as info,
  p.id,
  p.full_name,
  p.date_of_birth,
  p.weight_kg,
  p.height_cm,
  p.experience_level,
  p.main_goal,
  p.context_type,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- ID da Aline

-- 2. Verificar respostas PAR-Q+
SELECT 
  'PAR-Q+ da Aline' as info,
  p.id,
  p.full_name,
  p.parq_answers,
  jsonb_pretty(p.parq_answers) as parq_formatted
FROM profiles p
WHERE p.id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- ID da Aline

-- 3. Verificar preferências de treino
SELECT 
  'Preferências de Treino da Aline' as info,
  p.id,
  p.full_name,
  p.training_days,
  p.preferred_training_period,
  p.terrain_preference,
  p.work_stress_level,
  p.sleep_consistency,
  p.wakeup_feeling,
  p.hydration_habit,
  p.recovery_habit,
  p.stress_management
FROM profiles p
WHERE p.id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- ID da Aline

-- 4. Verificar últimas atualizações (para ver se os dados estão sendo persistidos)
SELECT 
  'Histórico de Updates' as info,
  p.id,
  p.full_name,
  p.updated_at,
  extract(epoch from (now() - p.updated_at))/60 as minutes_since_update
FROM profiles p
WHERE p.id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- ID da Aline

-- 5. Verificar se há campos nulos que deveriam ter dados
SELECT 
  'Campos Nulos' as info,
  CASE WHEN p.training_days IS NULL THEN 'training_days' ELSE NULL END,
  CASE WHEN p.parq_answers IS NULL THEN 'parq_answers' ELSE NULL END,
  CASE WHEN p.preferred_training_period IS NULL THEN 'preferred_training_period' ELSE NULL END,
  CASE WHEN p.terrain_preference IS NULL THEN 'terrain_preference' ELSE NULL END,
  CASE WHEN p.work_stress_level IS NULL THEN 'work_stress_level' ELSE NULL END,
  CASE WHEN p.sleep_consistency IS NULL THEN 'sleep_consistency' ELSE NULL END
FROM profiles p
WHERE p.id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- ID da Aline

-- 6. Verificar políticas RLS para updates
SELECT 
  'Políticas RLS para profiles' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. Testar se é possível fazer UPDATE na tabela profiles
-- (Execute apenas se necessário para debug)
/*
UPDATE profiles 
SET updated_at = NOW()
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad';
*/
