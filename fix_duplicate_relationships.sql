-- Script para identificar e corrigir relacionamentos duplicados
-- Execute este script no Supabase SQL Editor

-- 1. IDENTIFICAR RELACIONAMENTOS DUPLICADOS
SELECT 
  'RELACIONAMENTOS DUPLICADOS' as info,
  athlete_id,
  coach_id,
  COUNT(*) as total_duplicados,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(status, ', ') as status_list,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM athlete_coach_relationships
GROUP BY athlete_id, coach_id
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC;

-- 2. VERIFICAR RELACIONAMENTOS DA ALINE ESPECIFICAMENTE
SELECT 
  'RELACIONAMENTOS DA ALINE' as info,
  id,
  athlete_id,
  coach_id,
  team_id,
  status,
  requested_at,
  approved_at,
  notes,
  created_at,
  updated_at
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%'
ORDER BY created_at DESC;

-- 3. CORRIGIR DUPLICADOS (manter apenas o mais recente)
WITH duplicates AS (
  SELECT 
    athlete_id,
    coach_id,
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY athlete_id, coach_id 
      ORDER BY created_at DESC
    ) as rn
  FROM athlete_coach_relationships
)
DELETE FROM athlete_coach_relationships
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- 4. VERIFICAR SE A CORREÇÃO FUNCIONOU
SELECT 
  'VERIFICAÇÃO APÓS CORREÇÃO' as info,
  athlete_id,
  coach_id,
  COUNT(*) as total_apos_correcao
FROM athlete_coach_relationships
GROUP BY athlete_id, coach_id
HAVING COUNT(*) > 1;

-- 5. VERIFICAR RELACIONAMENTOS DA ALINE APÓS CORREÇÃO
SELECT 
  'ALINE APÓS CORREÇÃO' as info,
  id,
  athlete_id,
  coach_id,
  team_id,
  status,
  requested_at,
  approved_at,
  notes,
  created_at,
  updated_at
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%'
ORDER BY created_at DESC; 