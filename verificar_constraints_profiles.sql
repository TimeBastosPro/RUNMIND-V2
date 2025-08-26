-- Verificar constraints da tabela profiles
-- Execute este script no Supabase SQL Editor

-- 1. Verificar constraints da tabela profiles
SELECT 
    'CONSTRAINTS_PROFILES' as tipo,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c';  -- check constraints

-- 2. Verificar valores existentes na coluna context_type
SELECT 
    'VALORES_CONTEXT_TYPE' as tipo,
    context_type,
    COUNT(*) as quantidade
FROM public.profiles
WHERE context_type IS NOT NULL
GROUP BY context_type
ORDER BY quantidade DESC;

-- 3. Verificar valores existentes na coluna user_type
SELECT 
    'VALORES_USER_TYPE' as tipo,
    user_type,
    COUNT(*) as quantidade
FROM public.profiles
WHERE user_type IS NOT NULL
GROUP BY user_type
ORDER BY quantidade DESC;

-- 4. Verificar valores existentes na coluna experience_level
SELECT 
    'VALORES_EXPERIENCE_LEVEL' as tipo,
    experience_level,
    COUNT(*) as quantidade
FROM public.profiles
WHERE experience_level IS NOT NULL
GROUP BY experience_level
ORDER BY quantidade DESC;

-- 5. Verificar valores existentes na coluna main_goal
SELECT 
    'VALORES_MAIN_GOAL' as tipo,
    main_goal,
    COUNT(*) as quantidade
FROM public.profiles
WHERE main_goal IS NOT NULL
GROUP BY main_goal
ORDER BY quantidade DESC;

-- 6. Verificar perfil da Aline para usar como referência
SELECT 
    'PERFIL_ALINE_REFERENCIA' as tipo,
    id,
    email,
    full_name,
    user_type,
    experience_level,
    main_goal,
    context_type,
    onboarding_completed
FROM public.profiles
WHERE email = 'aline@gmail.com';
