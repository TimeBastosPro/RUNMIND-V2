-- Script para verificar e corrigir o status da Aline
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR O STATUS ATUAL DA ALINE
SELECT 
  'STATUS ATUAL DA ALINE' as info,
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
  p.full_name as athlete_name,
  p.email as athlete_email
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
ORDER BY acr.created_at DESC;

-- 2. VERIFICAR SE HÁ RELACIONAMENTOS APROVADOS MAS COM STATUS INCORRETO
SELECT 
  'RELACIONAMENTOS APROVADOS COM STATUS INCORRETO' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.approved_at,
  acr.notes,
  p.full_name as athlete_name,
  p.email as athlete_email
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE (p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%')
  AND acr.approved_at IS NOT NULL 
  AND acr.status != 'active'
ORDER BY acr.created_at DESC;

-- 3. CORRIGIR STATUS DOS RELACIONAMENTOS APROVADOS
UPDATE athlete_coach_relationships 
SET 
  status = 'active',
  updated_at = NOW()
WHERE id IN (
  SELECT acr.id
  FROM athlete_coach_relationships acr
  JOIN profiles p ON acr.athlete_id = p.id
  WHERE (p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%')
    AND acr.approved_at IS NOT NULL 
    AND acr.status != 'active'
);

-- 4. VERIFICAR APÓS CORREÇÃO
SELECT 
  'APÓS CORREÇÃO - STATUS DA ALINE' as info,
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
  p.full_name as athlete_name,
  p.email as athlete_email
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
ORDER BY acr.created_at DESC;

-- 5. VERIFICAR VIEW APÓS CORREÇÃO
SELECT 
  'VIEW APÓS CORREÇÃO' as info,
  id,
  athlete_id,
  coach_id,
  team_id,
  status,
  requested_at,
  approved_at,
  notes,
  created_at,
  updated_at,
  athlete_name,
  athlete_email
FROM active_athlete_coach_relationships
WHERE athlete_name LIKE '%Aline%' OR athlete_email LIKE '%aline%'
ORDER BY created_at DESC;

-- 6. VERIFICAR TODOS OS RELACIONAMENTOS DO TREINADOR
SELECT 
  'TODOS OS RELACIONAMENTOS DO TREINADOR' as info,
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
  p.full_name as athlete_name,
  p.email as athlete_email
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.coach_id = (
  SELECT c.id 
  FROM coaches c 
  JOIN profiles p ON c.user_id = p.id 
  WHERE p.email = 'luizbastosjf@yahoo.com.br'
  LIMIT 1
)
ORDER BY acr.created_at DESC; 