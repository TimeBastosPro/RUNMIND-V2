-- Script para corrigir problemas de atualização de relacionamentos
-- Problemas identificados: Erro 406 e PGRST116

-- 1. Verificar estrutura da tabela athlete_coach_relationships
SELECT
  'Verificação da estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 2. Verificar se há registros com dados inconsistentes
SELECT
  'Verificação de registros inconsistentes' as info,
  id,
  athlete_id,
  coach_id,
  status,
  approved_at,
  approved_by,
  team_id,
  notes,
  created_at,
  updated_at
FROM athlete_coach_relationships
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 3. Verificar se o relacionamento específico existe
-- (substitua o ID pelo ID real do relacionamento que está falhando)
SELECT
  'Verificação de relacionamento específico' as info,
  id,
  athlete_id,
  coach_id,
  status,
  notes
FROM athlete_coach_relationships
WHERE status = 'pending'
LIMIT 5;

-- 4. Verificar RLS policies para athlete_coach_relationships
SELECT
  'Verificação de RLS policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships';

-- 5. Verificar se RLS está habilitado
SELECT
  'Verificação de RLS habilitado' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 6. Corrigir possíveis problemas de RLS - recriar políticas
DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can view relationships with them" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can update relationships with them" ON athlete_coach_relationships;

-- Política para atletas gerenciarem seus próprios relacionamentos
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (auth.uid() = athlete_id);

-- Política para treinadores visualizarem relacionamentos com eles
CREATE POLICY "Coaches can view relationships with them" ON athlete_coach_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- Política para treinadores atualizarem relacionamentos com eles
CREATE POLICY "Coaches can update relationships with them" ON athlete_coach_relationships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 7. Verificar se a view active_athlete_coach_relationships existe e está correta
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships';

-- 8. Recriar a view se necessário
CREATE OR REPLACE VIEW active_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');

-- 9. Verificar se há problemas de foreign keys
SELECT
  'Verificação de foreign keys' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'athlete_coach_relationships';

-- 10. Teste de atualização manual (comentado - descomente para testar)
/*
-- Teste de atualização de um relacionamento pendente
UPDATE athlete_coach_relationships 
SET 
  status = 'active',
  approved_at = NOW(),
  notes = 'Teste de atualização'
WHERE status = 'pending' 
LIMIT 1
RETURNING id, status, approved_at, notes;
*/

-- 11. Verificar logs de erro mais recentes
SELECT
  'Últimos relacionamentos criados' as info,
  id,
  athlete_id,
  coach_id,
  status,
  created_at
FROM athlete_coach_relationships
ORDER BY created_at DESC
LIMIT 10; 