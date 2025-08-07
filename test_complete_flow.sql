-- Script para testar o fluxo completo de relacionamentos
-- Execute este script no Supabase SQL Editor

-- 1. LIMPAR DADOS EXISTENTES PARA TESTE LIMPO
DELETE FROM athlete_coach_relationships WHERE id IS NOT NULL;
DELETE FROM teams WHERE id IS NOT NULL;
DELETE FROM coaches WHERE id IS NOT NULL;

-- 2. VERIFICAR USUÁRIOS DISPONÍVEIS
SELECT 
  'Usuários disponíveis para teste' as info,
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.email as profile_email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 3. CRIAR TREINADOR DE TESTE (se não existir)
INSERT INTO coaches (user_id, full_name, email, bio, experience_years, specialties, is_active)
SELECT 
  u.id as user_id,
  COALESCE(p.full_name, 'Treinador Teste') as full_name,
  u.email,
  'Treinador de teste para verificar o fluxo' as bio,
  5 as experience_years,
  ARRAY['corrida', 'treinamento funcional'] as specialties,
  true as is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@%'
  AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.user_id = u.id)
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- 4. VERIFICAR TREINADORES CRIADOS
SELECT 
  'Treinadores criados' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  u.email as auth_email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 5. CRIAR RELACIONAMENTO DE TESTE
INSERT INTO athlete_coach_relationships (athlete_id, coach_id, status, notes)
SELECT 
  u.id as athlete_id,
  c.id as coach_id,
  'pending' as status,
  'Solicitação de teste - ' || NOW()::text as notes
FROM auth.users u
CROSS JOIN coaches c
WHERE u.email != c.email
  AND u.id != c.user_id
  AND NOT EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr 
    WHERE acr.athlete_id = u.id AND acr.coach_id = c.id
  )
LIMIT 1
ON CONFLICT (athlete_id, coach_id) DO NOTHING;

-- 6. VERIFICAR RELACIONAMENTO CRIADO
SELECT 
  'Relacionamento criado' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.notes,
  acr.created_at,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 7. CRIAR VIEWS SE NÃO EXISTIREM
DROP VIEW IF EXISTS active_athlete_coach_relationships;
CREATE VIEW active_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  acr.created_at,
  acr.updated_at,
  COALESCE(p.full_name, 'Nome não informado') as athlete_name,
  COALESCE(p.email, 'Email não informado') as athlete_email,
  COALESCE(c.full_name, 'Nome não informado') as coach_name,
  COALESCE(c.email, 'Email não informado') as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');

DROP VIEW IF EXISTS pending_athlete_coach_relationships;
CREATE VIEW pending_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  acr.created_at,
  acr.updated_at,
  COALESCE(p.full_name, 'Nome não informado') as athlete_name,
  COALESCE(p.email, 'Email não informado') as athlete_email,
  COALESCE(c.full_name, 'Nome não informado') as coach_name,
  COALESCE(c.email, 'Email não informado') as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status = 'pending';

-- 8. TESTAR VIEWS
SELECT 
  'Teste da view active_athlete_coach_relationships' as info,
  id,
  athlete_id,
  coach_id,
  status,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  notes,
  created_at
FROM active_athlete_coach_relationships
ORDER BY created_at DESC;

SELECT 
  'Teste da view pending_athlete_coach_relationships' as info,
  id,
  athlete_id,
  coach_id,
  status,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  notes,
  created_at
FROM pending_athlete_coach_relationships
ORDER BY created_at DESC;

-- 9. VERIFICAR POLÍTICAS RLS
SELECT 
  'Políticas RLS para athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 10. TESTAR APROVAÇÃO DE RELACIONAMENTO
UPDATE athlete_coach_relationships 
SET 
  status = 'active',
  approved_at = NOW(),
  approved_by = coach_id
WHERE status = 'pending'
LIMIT 1;

-- 11. VERIFICAR APROVAÇÃO
SELECT 
  'Relacionamento após aprovação' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.approved_at,
  acr.notes,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 12. RESULTADO FINAL
SELECT 
  '✅ Fluxo completo testado!' as status,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships,
  (SELECT COUNT(*) FROM athlete_coach_relationships WHERE status = 'pending') as pending_relationships,
  (SELECT COUNT(*) FROM athlete_coach_relationships WHERE status = 'active') as active_relationships,
  (SELECT COUNT(*) FROM active_athlete_coach_relationships) as view_active_count,
  (SELECT COUNT(*) FROM pending_athlete_coach_relationships) as view_pending_count; 