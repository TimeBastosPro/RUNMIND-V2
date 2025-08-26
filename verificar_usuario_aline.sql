-- Script para verificar e limpar o usuário aline@gmail.com
-- Este script resolve o problema de "User already registered"

-- 1. Verificar se o usuário existe no auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'aline@gmail.com';

-- 2. Verificar se existe perfil na tabela profiles
SELECT 
    id,
    email,
    full_name,
    user_type,
    created_at
FROM profiles 
WHERE email = 'aline@gmail.com';

-- 3. Verificar se existe registro na tabela coaches
SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 4. Verificar se existe registro na tabela coaches por user_id
SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at,
    u.email as auth_email
FROM coaches c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'aline@gmail.com';

-- 5. Contar quantos registros existem para este email
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 6. ⚠️ ATENÇÃO: Remover usuário do auth.users (isso remove automaticamente das outras tabelas)
-- Execute apenas se quiser remover completamente o usuário
-- DELETE FROM auth.users WHERE email = 'aline@gmail.com';

-- 7. ⚠️ ATENÇÃO: Remover apenas perfis duplicados (mais seguro)
-- DELETE FROM profiles WHERE email = 'aline@gmail.com' AND id NOT IN (
--     SELECT user_id FROM coaches WHERE email = 'aline@gmail.com'
-- );

-- 8. Verificar se a limpeza foi bem-sucedida
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
WHERE email = 'aline@gmail.com';
