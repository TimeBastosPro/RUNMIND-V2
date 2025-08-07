-- Script para corrigir problemas específicos de dados nos relacionamentos
-- Baseado nos erros identificados: 406 e PGRST116

-- 1. Verificar relacionamentos com dados inconsistentes
SELECT
  'Relacionamentos com dados inconsistentes' as info,
  id,
  athlete_id,
  coach_id,
  status,
  approved_at,
  approved_by,
  team_id,
  notes,
  created_at
FROM athlete_coach_relationships
WHERE 
  (athlete_id IS NULL OR coach_id IS NULL) OR
  (status = 'pending' AND approved_at IS NOT NULL) OR
  (status = 'active' AND approved_at IS NULL) OR
  (status = 'rejected' AND approved_at IS NOT NULL);

-- 2. Verificar se há relacionamentos duplicados
SELECT
  'Possíveis relacionamentos duplicados' as info,
  athlete_id,
  coach_id,
  COUNT(*) as count,
  array_agg(id) as relationship_ids,
  array_agg(status) as statuses
FROM athlete_coach_relationships
GROUP BY athlete_id, coach_id
HAVING COUNT(*) > 1;

-- 3. Verificar relacionamentos com coach_id inválido
SELECT
  'Relacionamentos com coach_id inválido' as info,
  acr.id,
  acr.coach_id,
  acr.status,
  c.id as coach_exists
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE c.id IS NULL;

-- 4. Verificar relacionamentos com athlete_id inválido
SELECT
  'Relacionamentos com athlete_id inválido' as info,
  acr.id,
  acr.athlete_id,
  acr.status,
  p.id as profile_exists
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
WHERE p.id IS NULL;

-- 5. Corrigir relacionamentos com status inconsistente
-- (comentado - descomente para executar)
/*
UPDATE athlete_coach_relationships 
SET 
  approved_at = NULL,
  approved_by = NULL
WHERE status = 'pending' AND approved_at IS NOT NULL;

UPDATE athlete_coach_relationships 
SET 
  approved_at = COALESCE(approved_at, created_at),
  approved_by = COALESCE(approved_by, coach_id)
WHERE status = 'active' AND approved_at IS NULL;
*/

-- 6. Verificar se há relacionamentos órfãos (sem coach ou athlete)
SELECT
  'Relacionamentos órfãos' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  CASE 
    WHEN p.id IS NULL THEN 'Athlete não existe'
    WHEN c.id IS NULL THEN 'Coach não existe'
    ELSE 'OK'
  END as issue
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE p.id IS NULL OR c.id IS NULL;

-- 7. Limpar relacionamentos órfãos (comentado - descomente para executar)
/*
DELETE FROM athlete_coach_relationships 
WHERE id IN (
  SELECT acr.id
  FROM athlete_coach_relationships acr
  LEFT JOIN profiles p ON acr.athlete_id = p.id
  LEFT JOIN coaches c ON acr.coach_id = c.id
  WHERE p.id IS NULL OR c.id IS NULL
);
*/

-- 8. Verificar relacionamentos pendentes específicos
SELECT
  'Relacionamentos pendentes detalhados' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.notes,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  acr.created_at
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE acr.status = 'pending'
ORDER BY acr.created_at DESC;

-- 9. Verificar se há problemas de timezone em approved_at
SELECT
  'Problemas de timezone em approved_at' as info,
  id,
  approved_at,
  created_at,
  EXTRACT(EPOCH FROM (approved_at::timestamp - created_at::timestamp)) as time_diff_seconds
FROM athlete_coach_relationships
WHERE approved_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (approved_at::timestamp - created_at::timestamp)) < 0;

-- 10. Corrigir timezone em approved_at (comentado - descomente para executar)
/*
UPDATE athlete_coach_relationships 
SET approved_at = created_at
WHERE approved_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (approved_at::timestamp - created_at::timestamp)) < 0;
*/

-- 11. Verificar se há relacionamentos com team_id inválido
SELECT
  'Relacionamentos com team_id inválido' as info,
  acr.id,
  acr.team_id,
  acr.coach_id,
  t.id as team_exists,
  t.coach_id as team_coach_id
FROM athlete_coach_relationships acr
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.team_id IS NOT NULL AND t.id IS NULL;

-- 12. Corrigir team_id inválido (comentado - descomente para executar)
/*
UPDATE athlete_coach_relationships 
SET team_id = NULL
WHERE team_id IS NOT NULL 
  AND team_id NOT IN (SELECT id FROM teams);
*/

-- 13. Verificar relacionamentos recentes para debug
SELECT
  'Relacionamentos criados nas últimas 24h' as info,
  id,
  athlete_id,
  coach_id,
  status,
  notes,
  created_at
FROM athlete_coach_relationships
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC; 