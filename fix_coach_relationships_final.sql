-- Script FINAL para corrigir problemas de relacionamentos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados existentes
SELECT 
  'Dados atuais' as info,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships,
  (SELECT COUNT(*) FROM auth.users) as total_users;

-- 2. Verificar se há relacionamentos com dados incompletos
SELECT 
  'Relacionamentos com dados incompletos' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 3. Recriar a view com JOIN correto para incluir dados do atleta
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

-- 4. Criar uma view específica para relacionamentos pendentes com dados completos
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

-- 5. Verificar se há usuários sem perfil
SELECT 
  'Usuários sem perfil' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 6. Criar perfis para usuários que não têm (se necessário)
INSERT INTO profiles (id, full_name, email, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Usuário ' || SUBSTRING(u.id::text, 1, 8)),
  u.email,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Verificar dados após correção
SELECT 
  'Verificação após correção' as info,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM active_athlete_coach_relationships) as total_active_relationships,
  (SELECT COUNT(*) FROM pending_athlete_coach_relationships) as total_pending_relationships;

-- 8. Testar consulta da view corrigida
SELECT 
  'Teste da view corrigida' as info,
  id,
  athlete_id,
  coach_id,
  status,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  requested_at
FROM active_athlete_coach_relationships
ORDER BY created_at DESC;

-- 9. Testar consulta de relacionamentos pendentes
SELECT 
  'Teste de relacionamentos pendentes' as info,
  id,
  athlete_name,
  athlete_email,
  coach_name,
  notes,
  requested_at
FROM pending_athlete_coach_relationships
ORDER BY created_at DESC;

-- 10. Verificar políticas RLS
SELECT 
  'Políticas RLS ativas' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY tablename, policyname;

-- 11. Mensagem de sucesso
SELECT 
  '✅ Problemas de relacionamentos corrigidos!' as status,
  'View active_athlete_coach_relationships recriada' as view1,
  'View pending_athlete_coach_relationships criada' as view2,
  'Perfis de usuários verificados' as profiles,
  'Dados de atletas incluídos' as athlete_data; 