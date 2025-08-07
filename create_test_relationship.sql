-- Script para criar um relacionamento de teste entre atleta e treinador
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários disponíveis
SELECT 
  'Usuários disponíveis' as info,
  au.id,
  au.email,
  au.email_confirmed_at,
  p.full_name,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Treinador'
    WHEN p.id IS NOT NULL THEN 'Atleta'
    ELSE 'Sem perfil'
  END as tipo
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN coaches c ON au.id = c.user_id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- 2. Verificar treinadores ativos
SELECT 
  'Treinadores ativos' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  au.email_confirmed_at
FROM coaches c
JOIN auth.users au ON c.user_id = au.id
WHERE c.is_active = true
  AND au.email_confirmed_at IS NOT NULL
ORDER BY c.created_at DESC;

-- 3. Verificar atletas disponíveis (não treinadores)
SELECT 
  'Atletas disponíveis' as info,
  p.id,
  p.full_name,
  p.email,
  au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN coaches c ON p.id = c.user_id
WHERE c.id IS NULL  -- Não é treinador
  AND au.email_confirmed_at IS NOT NULL
ORDER BY p.created_at DESC;

-- 4. Criar relacionamento de teste (descomente e ajuste os IDs)
-- Substitua ATHLETE_ID e COACH_ID pelos IDs reais dos usuários
/*
INSERT INTO athlete_coach_relationships (
  athlete_id,
  coach_id,
  status,
  notes,
  created_at,
  updated_at
) VALUES (
  'ATHLETE_ID',  -- Substitua pelo ID do atleta
  'COACH_ID',    -- Substitua pelo ID do treinador
  'active',
  'Relacionamento de teste criado via SQL',
  NOW(),
  NOW()
);
*/

-- 5. Verificar se o relacionamento foi criado
SELECT 
  'Relacionamento criado' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.created_at,
  p.full_name as athlete_name,
  c.full_name as coach_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE acr.notes LIKE '%teste%'
ORDER BY acr.created_at DESC;

-- 6. Verificar se aparece na view
SELECT 
  'Na view active_athlete_coach_relationships' as info,
  aacr.id,
  aacr.athlete_id,
  aacr.coach_id,
  aacr.status,
  aacr.created_at,
  p.full_name as athlete_name,
  c.full_name as coach_name
FROM active_athlete_coach_relationships aacr
LEFT JOIN profiles p ON aacr.athlete_id = p.id
LEFT JOIN coaches c ON aacr.coach_id = c.id
WHERE aacr.notes LIKE '%teste%'
ORDER BY aacr.created_at DESC;

-- 7. Testar consulta como treinador específico
-- Substitua COACH_ID pelo ID real do treinador
/*
SELECT 
  'Teste para treinador específico' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  p.full_name as athlete_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.coach_id = 'COACH_ID'  -- Substitua pelo ID real
ORDER BY acr.created_at DESC;
*/ 