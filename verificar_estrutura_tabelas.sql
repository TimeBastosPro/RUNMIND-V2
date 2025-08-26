-- Verificar estrutura real das tabelas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela profiles
SELECT 
    'ESTRUTURA_PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela coaches
SELECT 
    'ESTRUTURA_COACHES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'coaches'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela auth.users
SELECT 
    'ESTRUTURA_AUTH_USERS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar dados na tabela profiles (sem JOIN)
SELECT 
    'DADOS_PROFILES' as tipo,
    *
FROM public.profiles
LIMIT 5;

-- 5. Verificar dados na tabela coaches (sem JOIN)
SELECT 
    'DADOS_COACHES' as tipo,
    *
FROM public.coaches
LIMIT 5;

-- 6. Verificar usuários no auth.users
SELECT 
    'DADOS_AUTH_USERS' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY created_at;
