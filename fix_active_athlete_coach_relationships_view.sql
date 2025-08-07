-- Script para verificar e corrigir a view active_athlete_coach_relationships
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a view existe
SELECT 
  'Verificando view' as info,
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'active_athlete_coach_relationships';

-- 2. Verificar se há dados na tabela base
SELECT 
  'Dados na tabela base' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitados
FROM athlete_coach_relationships;

-- 3. Testar consulta da view manualmente
SELECT 
  'Teste manual da view' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.notes,
  acr.requested_at,
  acr.approved_at,
  acr.created_at,
  acr.updated_at,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 4. Recriar a view se necessário
DROP VIEW IF EXISTS active_athlete_coach_relationships;

CREATE VIEW active_athlete_coach_relationships AS
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.notes,
  acr.requested_at,
  acr.approved_at,
  acr.created_at,
  acr.updated_at,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status = 'active';

-- 5. Habilitar RLS na view
ALTER VIEW active_athlete_coach_relationships SET (security_invoker = true);

-- 6. Criar políticas RLS para a view
DROP POLICY IF EXISTS "Coaches can view their active relationships" ON active_athlete_coach_relationships;
CREATE POLICY "Coaches can view their active relationships" ON active_athlete_coach_relationships
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Athletes can view their active relationships" ON active_athlete_coach_relationships;
CREATE POLICY "Athletes can view their active relationships" ON active_athlete_coach_relationships
  FOR SELECT
  TO authenticated
  USING (
    athlete_id = auth.uid()
  );

-- 7. Verificar se a view foi criada corretamente
SELECT 
  'View recriada' as info,
  COUNT(*) as total_ativos
FROM active_athlete_coach_relationships;

-- 8. Testar consulta da view
SELECT 
  'Teste da view recriada' as info,
  aacr.id,
  aacr.athlete_id,
  aacr.coach_id,
  aacr.status,
  aacr.athlete_name,
  aacr.coach_name,
  aacr.team_name
FROM active_athlete_coach_relationships aacr
ORDER BY aacr.created_at DESC;

-- 9. Verificar políticas RLS da view
SELECT 
  'Políticas RLS da view' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'active_athlete_coach_relationships'
ORDER BY policyname; 