-- Script para corrigir as políticas RLS da tabela athlete_coach_relationships
-- Problema: Tabela existe mas não tem políticas RLS, causando erro 404

-- 1. Verificar se a tabela existe
SELECT
  'Verificação da tabela athlete_coach_relationships' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 2. Verificar se RLS está habilitado
SELECT
  'Verificação RLS' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 3. Habilitar RLS se não estiver habilitado
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Athletes can view own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can insert own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can update own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can delete own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can view relationships with them" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can update relationships with them" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;

-- 5. Criar políticas RLS corretas

-- Política para atletas verem seus próprios relacionamentos
CREATE POLICY "Athletes can view own relationships" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = athlete_id);

-- Política para atletas criarem relacionamentos
CREATE POLICY "Athletes can insert own relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- Política para atletas atualizarem seus relacionamentos
CREATE POLICY "Athletes can update own relationships" ON athlete_coach_relationships
  FOR UPDATE USING (auth.uid() = athlete_id);

-- Política para atletas cancelarem seus relacionamentos
CREATE POLICY "Athletes can delete own relationships" ON athlete_coach_relationships
  FOR DELETE USING (auth.uid() = athlete_id);

-- Política para treinadores verem relacionamentos com eles
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

-- 6. Verificar políticas RLS criadas
SELECT
  'Políticas RLS da tabela athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 7. Verificar se a view active_athlete_coach_relationships existe
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships';

-- 8. Se a view não existir, criá-la
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

-- 9. Criar política RLS para a view
DROP POLICY IF EXISTS "Users can view active relationships" ON active_athlete_coach_relationships;
CREATE POLICY "Users can view active relationships" ON active_athlete_coach_relationships
  FOR SELECT USING (
    auth.uid() = athlete_id OR
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 10. Verificar se há relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relacionamentos
FROM athlete_coach_relationships;

-- 11. Verificar relacionamentos com detalhes
SELECT
  'Relacionamentos com detalhes' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.requested_at,
  acr.notes,
  c.full_name as coach_name,
  c.email as coach_email
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 12. Testar acesso com RLS
SELECT
  'Teste de acesso com RLS' as info,
  COUNT(*) as total_relacionamentos_visiveis
FROM athlete_coach_relationships;

-- 13. Verificação final
SELECT
  'Verificação final' as info,
  'Políticas RLS aplicadas com sucesso' as status,
  'Tabela athlete_coach_relationships configurada' as table_status,
  'View active_athlete_coach_relationships criada' as view_status,
  'Sistema pronto para solicitações de vínculo' as final_status; 