-- Diagnosticar problemas de login
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se os usuários existem no auth.users
SELECT 
    'USUARIOS_AUTH' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'EMAIL_CONFIRMADO'
        ELSE 'EMAIL_NAO_CONFIRMADO'
    END as status_email
FROM auth.users
WHERE email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY created_at;

-- 2. Verificar perfis dos usuários
SELECT 
    'PERFIS_USUARIOS' as tipo,
    p.id,
    p.user_id,
    p.full_name,
    p.user_type,
    p.created_at,
    u.email,
    CASE 
        WHEN p.user_type = 'coach' THEN 'TREINADOR'
        WHEN p.user_type = 'athlete' THEN 'ATLETA'
        ELSE 'TIPO_INDEFINIDO'
    END as tipo_usuario
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY p.created_at;

-- 3. Verificar se os treinadores estão registrados
SELECT 
    'TREINADORES_REGISTRADOS' as tipo,
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at,
    u.email as auth_email
FROM public.coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY c.created_at;

-- 4. Verificar relacionamentos ativos
SELECT 
    'RELACIONAMENTOS_ATIVOS' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email,
    acr.created_at
FROM public.athlete_coach_relationships acr
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN auth.users coach ON c.user_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 5. Verificar se há problemas com senhas ou confirmação
SELECT 
    'DIAGNOSTICO_LOGIN' as tipo,
    u.email,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'PROBLEMA: Email não confirmado'
        WHEN p.user_type IS NULL THEN 'PROBLEMA: Sem perfil'
        WHEN p.user_type = 'coach' AND c.id IS NULL THEN 'PROBLEMA: Treinador sem registro na tabela coaches'
        ELSE 'OK: Usuário deve conseguir fazer login'
    END as diagnostico
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.coaches c ON u.id = c.user_id
WHERE u.email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY u.created_at;

-- 6. Verificar se há usuários duplicados ou problemas
SELECT 
    'VERIFICACAO_DUPLICATAS' as tipo,
    email,
    COUNT(*) as quantidade,
    CASE 
        WHEN COUNT(*) > 1 THEN 'PROBLEMA: Email duplicado'
        ELSE 'OK: Email único'
    END as status
FROM auth.users
WHERE email IN ('timebastos@gmail.com', 'aline@gmail.com')
GROUP BY email;
