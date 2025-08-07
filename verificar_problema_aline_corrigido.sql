-- Script para verificar e corrigir o problema da Aline aparecendo duplicada
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR TODOS OS RELACIONAMENTOS DA ALINE
SELECT 
  'RELACIONAMENTOS DA ALINE' as info,
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

-- 2. VERIFICAR O QUE A VIEW ESTÁ RETORNANDO
SELECT 
  'VIEW ACTIVE ATHLETE COACH RELATIONSHIPS' as info,
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

-- 3. VERIFICAR SE HÁ DUPLICATAS NO BANCO (CORRIGIDO)
SELECT 
  'VERIFICAR DUPLICATAS' as info,
  acr.athlete_id,
  acr.coach_id,
  COUNT(*) as total_duplicados,
  STRING_AGG(acr.id::text, ', ') as ids,
  STRING_AGG(acr.status, ', ') as status_list,
  STRING_AGG(acr.created_at::text, ', ') as created_dates
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
GROUP BY acr.athlete_id, acr.coach_id
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC;

-- 4. VERIFICAR STATUS DOS RELACIONAMENTOS (CORRIGIDO)
SELECT 
  'STATUS DOS RELACIONAMENTOS' as info,
  acr.status,
  COUNT(*) as total
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
GROUP BY acr.status
ORDER BY total DESC;

-- 5. CORRIGIR SE HÁ DUPLICATAS (manter apenas o mais recente) - CORRIGIDO
WITH duplicates AS (
  SELECT 
    acr.athlete_id,
    acr.coach_id,
    acr.id,
    acr.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY acr.athlete_id, acr.coach_id 
      ORDER BY acr.created_at DESC
    ) as rn
  FROM athlete_coach_relationships acr
  JOIN profiles p ON acr.athlete_id = p.id
  WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
)
DELETE FROM athlete_coach_relationships
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- 6. VERIFICAR APÓS CORREÇÃO (CORRIGIDO)
SELECT 
  'APÓS CORREÇÃO' as info,
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

-- 7. VERIFICAR VIEW APÓS CORREÇÃO
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