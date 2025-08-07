-- Script para diagnosticar o problema específico do relacionamento
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o relacionamento específico que está falhando
SELECT 
  'Relacionamento específico' as info,
  id,
  athlete_id,
  coach_id,
  team_id,
  status,
  requested_at,
  approved_at,
  notes,
  created_at,
  updated_at
FROM athlete_coach_relationships
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se o coach_id está correto
SELECT 
  'Verificação do coach' as info,
  c.id as coach_id,
  c.full_name as coach_name,
  c.user_id as coach_user_id,
  u.email as coach_email
FROM coaches c
JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 3. Verificar se o athlete_id está correto
SELECT 
  'Verificação do atleta' as info,
  p.id as athlete_id,
  p.full_name as athlete_name,
  p.email as athlete_email,
  u.id as user_id
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.full_name LIKE '%Aline%'
ORDER BY p.created_at DESC;

-- 4. Testar UPDATE manual
-- Substitua os IDs pelos valores reais encontrados acima
-- UPDATE athlete_coach_relationships 
-- SET status = 'active', approved_at = NOW()
-- WHERE id = 'ID_DO_RELACIONAMENTO' 
-- AND coach_id = 'ID_DO_COACH'
-- AND status = 'pending';

-- 5. Verificar se há problemas de RLS
SELECT 
  'Políticas RLS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'; 