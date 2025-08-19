-- Script específico para corrigir o problema da Aline
-- Baseado nas imagens do Supabase, há múltiplos registros para aline@gmail.com

-- 1. Verificar o problema atual
SELECT 
  'profiles' as table_name,
  email,
  id,
  full_name,
  created_at
FROM profiles 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;

SELECT 
  'coaches' as table_name,
  email,
  user_id,
  full_name,
  created_at
FROM coaches 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;

-- 2. Verificar se há usuário auth para aline@gmail.com
SELECT 
  email,
  id as auth_user_id,
  created_at as auth_created,
  user_metadata
FROM auth.users 
WHERE email = 'aline@gmail.com';

-- 3. Determinar qual perfil manter
-- Vamos manter o perfil mais recente e remover os duplicados

-- 4. Limpar perfis duplicados da Aline (manter apenas o mais recente)
WITH aline_profiles AS (
  SELECT 
    id,
    email,
    full_name,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE email = 'aline@gmail.com'
)
DELETE FROM profiles 
WHERE id IN (
  SELECT id 
  FROM aline_profiles 
  WHERE rn > 1
);

-- 5. Limpar coaches duplicados da Aline (se houver)
WITH aline_coaches AS (
  SELECT 
    user_id,
    email,
    full_name,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM coaches
  WHERE email = 'aline@gmail.com'
)
DELETE FROM coaches 
WHERE user_id IN (
  SELECT user_id 
  FROM aline_coaches 
  WHERE rn > 1
);

-- 6. Verificar se há usuário que deveria ser apenas treinador mas tem perfil de atleta
-- Se a Aline for treinadora, remover o perfil de atleta
DELETE FROM profiles 
WHERE id IN (
  SELECT p.id
  FROM coaches c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.email = 'aline@gmail.com'
);

-- 7. Verificar resultado final
SELECT 
  'profiles' as table_name,
  email,
  id,
  full_name,
  created_at
FROM profiles 
WHERE email = 'aline@gmail.com';

SELECT 
  'coaches' as table_name,
  email,
  user_id,
  full_name,
  created_at
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 8. Verificar se há outros emails com problemas similares
SELECT 
  email,
  COUNT(*) as total_profiles
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total_profiles DESC;

SELECT 
  email,
  COUNT(*) as total_coaches
FROM coaches 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total_coaches DESC;
