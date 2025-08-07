-- Script para debugar por que os atletas não aparecem para o treinador
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem relacionamentos na tabela
SELECT 
  'Relacionamentos existentes' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitados
FROM athlete_coach_relationships;

-- 2. Verificar relacionamentos ativos especificamente
SELECT 
  'Relacionamentos ativos' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.created_at,
  p.full_name as athlete_name,
  c.full_name as coach_name,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 3. Verificar a view active_athlete_coach_relationships
SELECT 
  'View active_athlete_coach_relationships' as info,
  COUNT(*) as total
FROM active_athlete_coach_relationships;

-- 4. Verificar dados na view
SELECT 
  'Dados na view' as info,
  aacr.*,
  p.full_name as athlete_name,
  c.full_name as coach_name,
  t.name as team_name
FROM active_athlete_coach_relationships aacr
LEFT JOIN profiles p ON aacr.athlete_id = p.id
LEFT JOIN coaches c ON aacr.coach_id = c.id
LEFT JOIN teams t ON aacr.team_id = t.id
ORDER BY aacr.created_at DESC;

-- 5. Verificar políticas RLS da tabela athlete_coach_relationships
SELECT 
  'Políticas RLS athlete_coach_relationships' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 6. Verificar políticas RLS da view active_athlete_coach_relationships
SELECT 
  'Políticas RLS active_athlete_coach_relationships' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'active_athlete_coach_relationships'
ORDER BY policyname;

-- 7. Verificar se RLS está habilitado
SELECT 
  'RLS habilitado' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('athlete_coach_relationships', 'active_athlete_coach_relationships')
ORDER BY tablename;

-- 8. Testar consulta como usuário autenticado (substitua pelo ID do treinador)
-- Substitua 'COACH_USER_ID' pelo ID real do treinador
SELECT 
  'Teste de consulta para treinador' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  p.full_name as athlete_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.coach_id = 'COACH_USER_ID'  -- Substitua pelo ID real
ORDER BY acr.created_at DESC;

-- 9. Verificar se há dados de teste válidos
SELECT 
  'Dados de teste' as info,
  'Profiles' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as com_nome
FROM profiles
UNION ALL
SELECT 
  'Dados de teste' as info,
  'Coaches' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as com_nome
FROM coaches
UNION ALL
SELECT 
  'Dados de teste' as info,
  'Teams' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as com_nome
FROM teams;

-- 10. Verificar relacionamentos por status
SELECT 
  'Relacionamentos por status' as info,
  status,
  COUNT(*) as quantidade,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as com_equipe
FROM athlete_coach_relationships
GROUP BY status
ORDER BY status; 