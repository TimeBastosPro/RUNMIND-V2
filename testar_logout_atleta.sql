-- Script para testar e verificar problemas de logout de atletas
-- Este script identifica possíveis causas do botão de logout não funcionar

-- 1. Verificar atletas existentes e seus estados
SELECT '=== VERIFICAÇÃO DE ATLETAS ===' as status;

SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'Email não confirmado'
        ELSE 'Email confirmado'
    END as status_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.user_type = 'athlete' OR p.user_type IS NULL
ORDER BY p.created_at DESC;

-- 2. Verificar atletas com problemas de perfil
SELECT '=== ATLETAS COM PROBLEMAS DE PERFIL ===' as status;

SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.onboarding_completed,
    CASE 
        WHEN p.full_name IS NULL OR p.full_name = '' THEN 'Sem nome'
        ELSE 'Com nome'
    END as status_nome,
    CASE 
        WHEN p.date_of_birth IS NULL THEN 'Sem data de nascimento'
        ELSE 'Com data de nascimento'
    END as status_nascimento,
    CASE 
        WHEN p.weight_kg IS NULL THEN 'Sem peso'
        ELSE 'Com peso'
    END as status_peso,
    CASE 
        WHEN p.height_cm IS NULL THEN 'Sem altura'
        ELSE 'Com altura'
    END as status_altura
FROM profiles p
WHERE p.user_type = 'athlete' OR p.user_type IS NULL
ORDER BY p.created_at DESC;

-- 3. Verificar atletas sem user_type definido
SELECT '=== ATLETAS SEM USER_TYPE ===' as status;

SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    created_at
FROM profiles 
WHERE user_type IS NULL OR user_type = ''
ORDER BY created_at DESC;

-- 4. Verificar usuários auth que não têm perfil
SELECT '=== USUÁRIOS AUTH SEM PERFIL ===' as status;

SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Tem perfil'
        ELSE 'Sem perfil'
    END as status_perfil
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 5. Verificar inconsistências entre auth.users e profiles
SELECT '=== INCONSISTÊNCIAS AUTH/PROFILES ===' as status;

SELECT 
    'Usuários auth sem perfil' as tipo,
    COUNT(*) as total
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'Perfis sem usuário auth' as tipo,
    COUNT(*) as total
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 6. Verificar atletas com onboarding incompleto
SELECT '=== ATLETAS COM ONBOARDING INCOMPLETO ===' as status;

SELECT 
    id,
    email,
    full_name,
    onboarding_completed,
    created_at
FROM profiles 
WHERE (user_type = 'athlete' OR user_type IS NULL)
AND (onboarding_completed IS NULL OR onboarding_completed = false)
ORDER BY created_at DESC;

-- 7. Contar atletas por status
SELECT '=== CONTAGEM DE ATLETAS POR STATUS ===' as status;

SELECT 
    'Total de atletas' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE user_type = 'athlete' OR user_type IS NULL
UNION ALL
SELECT 
    'Atletas com onboarding completo' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE (user_type = 'athlete' OR user_type IS NULL)
AND onboarding_completed = true
UNION ALL
SELECT 
    'Atletas com onboarding incompleto' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE (user_type = 'athlete' OR user_type IS NULL)
AND (onboarding_completed IS NULL OR onboarding_completed = false)
UNION ALL
SELECT 
    'Atletas com email confirmado' as tipo,
    COUNT(*) as total
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE (p.user_type = 'athlete' OR p.user_type IS NULL)
AND u.email_confirmed_at IS NOT NULL;
