-- Script para verificar a estrutura da tabela athlete_coach_relationships
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela
SELECT 
  'Estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 2. Verificar se há constraints
SELECT 
  'Constraints da tabela' as info,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'athlete_coach_relationships';

-- 3. Verificar dados atuais
SELECT 
  'Dados atuais' as info,
  id,
  athlete_id,
  coach_id,
  team_id,
  status,
  requested_at,
  approved_at,
  approved_by,
  notes,
  created_at,
  updated_at
FROM athlete_coach_relationships
ORDER BY created_at DESC;

-- 4. Verificar se há problemas com campos obrigatórios
SELECT 
  'Verificação de campos obrigatórios' as info,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN athlete_id IS NULL THEN 1 END) as athlete_id_nulos,
  COUNT(CASE WHEN coach_id IS NULL THEN 1 END) as coach_id_nulos,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as status_nulos,
  COUNT(CASE WHEN created_at IS NULL THEN 1 END) as created_at_nulos
FROM athlete_coach_relationships;

-- 5. Verificar políticas RLS
SELECT 
  'Políticas RLS' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 6. Testar UPDATE simples
UPDATE athlete_coach_relationships 
SET notes = COALESCE(notes, '') || ' - Teste de atualização'
WHERE id = (
  SELECT id FROM athlete_coach_relationships 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 7. Verificar se o UPDATE funcionou
SELECT 
  'Após UPDATE de teste' as info,
  id,
  status,
  notes,
  updated_at
FROM athlete_coach_relationships
ORDER BY created_at DESC
LIMIT 1; 