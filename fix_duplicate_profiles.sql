-- Script para verificar e corrigir perfis duplicados
-- Este script identifica e corrige problemas de perfis duplicados para o mesmo email

-- 1. Verificar se há perfis duplicados
SELECT 
  email,
  COUNT(*) as total_profiles,
  array_agg(id) as profile_ids,
  array_agg(full_name) as names,
  array_agg(created_at) as created_dates
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total_profiles DESC;

-- 2. Verificar se há coaches duplicados
SELECT 
  email,
  COUNT(*) as total_coaches,
  array_agg(user_id) as user_ids,
  array_agg(full_name) as names,
  array_agg(created_at) as created_dates
FROM coaches 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total_coaches DESC;

-- 3. Verificar se há usuários com ambos os perfis (atleta e treinador)
SELECT 
  p.email,
  p.id as profile_id,
  p.full_name as profile_name,
  c.user_id as coach_user_id,
  c.full_name as coach_name,
  p.created_at as profile_created,
  c.created_at as coach_created
FROM profiles p
LEFT JOIN coaches c ON p.email = c.email
WHERE c.user_id IS NOT NULL
ORDER BY p.email;

-- 4. Verificar se há usuários auth sem perfis correspondentes
SELECT 
  au.email,
  au.id as auth_user_id,
  au.created_at as auth_created,
  CASE WHEN p.id IS NOT NULL THEN 'Tem perfil' ELSE 'Sem perfil' END as has_profile,
  CASE WHEN c.user_id IS NOT NULL THEN 'Tem coach' ELSE 'Sem coach' END as has_coach
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN coaches c ON au.id = c.user_id
WHERE au.email IS NOT NULL
ORDER BY au.email;

-- 5. Script para limpar perfis duplicados (EXECUTAR COM CUIDADO)
-- Manter apenas o perfil mais recente para cada email

-- Para profiles:
WITH duplicate_profiles AS (
  SELECT 
    email,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE email IN (
    SELECT email 
    FROM profiles 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM profiles 
WHERE id IN (
  SELECT id 
  FROM duplicate_profiles 
  WHERE rn > 1
);

-- Para coaches:
WITH duplicate_coaches AS (
  SELECT 
    email,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM coaches
  WHERE email IN (
    SELECT email 
    FROM coaches 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM coaches 
WHERE user_id IN (
  SELECT user_id 
  FROM duplicate_coaches 
  WHERE rn > 1
);

-- 6. Verificar se há usuários que deveriam ser apenas treinadores mas têm perfil de atleta
SELECT 
  c.email,
  c.user_id,
  c.full_name as coach_name,
  p.id as profile_id,
  p.full_name as profile_name
FROM coaches c
JOIN profiles p ON c.user_id = p.id
ORDER BY c.email;

-- 7. Remover perfis de atleta para usuários que são apenas treinadores
-- (EXECUTAR APENAS SE NECESSÁRIO)
DELETE FROM profiles 
WHERE id IN (
  SELECT p.id
  FROM coaches c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.user_id = p.id
);

-- 8. Verificar resultado final
SELECT 
  'profiles' as table_name,
  email,
  COUNT(*) as count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
UNION ALL
SELECT 
  'coaches' as table_name,
  email,
  COUNT(*) as count
FROM coaches 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY table_name, email;
