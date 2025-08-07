-- Script para verificar passo a passo o fluxo de relacionamentos
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Verificar se as tabelas existem
SELECT 
  'PASSO 1: Verificação das tabelas' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships', 'profiles')
ORDER BY tablename;

-- PASSO 2: Verificar estrutura da tabela athlete_coach_relationships
SELECT 
  'PASSO 2: Estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- PASSO 3: Verificar se há dados nas tabelas
SELECT 
  'PASSO 3: Contagem de dados' as info,
  'auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'PASSO 3: Contagem de dados' as info,
  'profiles' as tabela,
  COUNT(*) as total
FROM profiles
UNION ALL
SELECT 
  'PASSO 3: Contagem de dados' as info,
  'coaches' as tabela,
  COUNT(*) as total
FROM coaches
UNION ALL
SELECT 
  'PASSO 3: Contagem de dados' as info,
  'athlete_coach_relationships' as tabela,
  COUNT(*) as total
FROM athlete_coach_relationships;

-- PASSO 4: Verificar dados específicos dos usuários
SELECT 
  'PASSO 4: Dados dos usuários' as info,
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.email as profile_email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- PASSO 5: Verificar dados dos treinadores
SELECT 
  'PASSO 5: Dados dos treinadores' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  u.email as auth_email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- PASSO 6: Verificar relacionamentos existentes
SELECT 
  'PASSO 6: Relacionamentos existentes' as info,
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

-- PASSO 7: Verificar se há relacionamentos pendentes
SELECT 
  'PASSO 7: Relacionamentos pendentes' as info,
  COUNT(*) as total_pending,
  COUNT(CASE WHEN athlete_id IS NOT NULL THEN 1 END) as com_athlete_id,
  COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as com_coach_id,
  COUNT(CASE WHEN notes IS NOT NULL THEN 1 END) as com_notes
FROM athlete_coach_relationships
WHERE status = 'pending';

-- PASSO 8: Verificar políticas RLS
SELECT 
  'PASSO 8: Políticas RLS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY tablename, policyname;

-- PASSO 9: Testar inserção de relacionamento (se não existir)
INSERT INTO athlete_coach_relationships (athlete_id, coach_id, status, notes)
SELECT 
  u.id as athlete_id,
  c.id as coach_id,
  'pending' as status,
  'Teste de relacionamento - ' || NOW()::text as notes
FROM auth.users u
CROSS JOIN coaches c
WHERE u.email != c.email
  AND NOT EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr 
    WHERE acr.athlete_id = u.id AND acr.coach_id = c.id
  )
LIMIT 1
ON CONFLICT (athlete_id, coach_id) DO NOTHING;

-- PASSO 10: Verificar relacionamento após inserção
SELECT 
  'PASSO 10: Relacionamento após inserção' as info,
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

-- PASSO 11: Verificar se as views existem
SELECT 
  'PASSO 11: Verificação das views' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname IN ('active_athlete_coach_relationships', 'pending_athlete_coach_relationships')
ORDER BY viewname;

-- PASSO 12: Testar consulta das views (se existirem)
SELECT 
  'PASSO 12: Teste da view active_athlete_coach_relationships' as info,
  COUNT(*) as total_rows
FROM active_athlete_coach_relationships;

SELECT 
  'PASSO 12: Teste da view pending_athlete_coach_relationships' as info,
  COUNT(*) as total_rows
FROM pending_athlete_coach_relationships;

-- PASSO 13: Resumo final
SELECT 
  'PASSO 13: Resumo final' as info,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships,
  (SELECT COUNT(*) FROM athlete_coach_relationships WHERE status = 'pending') as pending_relationships,
  (SELECT COUNT(*) FROM athlete_coach_relationships WHERE status = 'active') as active_relationships; 