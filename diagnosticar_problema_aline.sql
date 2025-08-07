-- Script de diagnóstico específico para o problema da Aline
-- Execute este script no Supabase SQL Editor

-- 1. DIAGNÓSTICO INICIAL - VERIFICAR TODOS OS RELACIONAMENTOS
SELECT 
  'DIAGNÓSTICO INICIAL' as info,
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
  p.email as athlete_email,
  CASE 
    WHEN acr.approved_at IS NOT NULL AND acr.status != 'active' THEN '❌ PROBLEMA: Aprovado mas status incorreto'
    WHEN acr.approved_at IS NULL AND acr.status = 'active' THEN '❌ PROBLEMA: Status ativo mas não aprovado'
    WHEN acr.approved_at IS NOT NULL AND acr.status = 'active' THEN '✅ CORRETO: Aprovado e ativo'
    WHEN acr.approved_at IS NULL AND acr.status = 'pending' THEN '✅ CORRETO: Pendente'
    ELSE '❓ ESTADO INESPERADO'
  END as diagnostico
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'
ORDER BY acr.created_at DESC;

-- 2. VERIFICAR SE HÁ PROBLEMAS DE SINCRONIZAÇÃO
SELECT 
  'VERIFICAÇÃO DE SINCRONIZAÇÃO' as info,
  COUNT(*) as total_relacionamentos,
  COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as total_aprovados,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as total_ativos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pendentes,
  COUNT(CASE WHEN approved_at IS NOT NULL AND status != 'active' THEN 1 END) as problemas_encontrados
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%';

-- 3. CORREÇÃO AUTOMÁTICA - APLICAR REGRAS DE NEGÓCIO
-- Regra 1: Se tem approved_at, deve ter status 'active'
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

-- Regra 2: Se tem status 'active', deve ter approved_at
UPDATE athlete_coach_relationships 
SET 
  approved_at = COALESCE(approved_at, NOW()),
  updated_at = NOW()
WHERE id IN (
  SELECT acr.id
  FROM athlete_coach_relationships acr
  JOIN profiles p ON acr.athlete_id = p.id
  WHERE (p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%')
    AND acr.status = 'active'
    AND acr.approved_at IS NULL
);

-- 4. VERIFICAÇÃO APÓS CORREÇÃO
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
  p.email as athlete_email,
  CASE 
    WHEN acr.approved_at IS NOT NULL AND acr.status = 'active' THEN '✅ CORRIGIDO: Aprovado e ativo'
    WHEN acr.approved_at IS NULL AND acr.status = 'pending' THEN '✅ CORRETO: Pendente'
    ELSE '❓ ESTADO INESPERADO'
  END as status_final
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

-- 6. RESUMO FINAL
SELECT 
  'RESUMO FINAL' as info,
  COUNT(*) as total_relacionamentos,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as aprovados
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE p.full_name LIKE '%Aline%' OR p.email LIKE '%aline%'; 