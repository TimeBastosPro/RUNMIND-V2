-- Script SIMPLES para criar apenas a view que está faltando
-- Problema: "active_athlete_coach_relationships" is not a table

-- Criar a view active_athlete_coach_relationships
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

-- Verificar se foi criada
SELECT
  'View criada com sucesso' as status,
  schemaname,
  viewname
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships'; 