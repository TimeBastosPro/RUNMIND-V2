-- Diagnosticar situação dos treinadores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário timebastos@gmail.com existe
SELECT 
    'USUARIO_TIMESBASTOS' as tipo,
    id,
    email,
    created_at,
    'Verificar se este usuário existe' as observacao
FROM auth.users
WHERE email = 'timebastos@gmail.com';

-- 2. Verificar se existe registro na tabela coaches
SELECT 
    'TREINADOR_TIMESBASTOS' as tipo,
    id,
    user_id,
    cref,
    created_at,
    'Verificar se está registrado como treinador' as observacao
FROM public.coaches
WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- 3. Verificar se existe perfil
SELECT 
    'PERFIL_TIMESBASTOS' as tipo,
    id,
    user_id,
    full_name,
    user_type,
    created_at,
    'Verificar se tem perfil' as observacao
FROM public.profiles
WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- 4. Verificar todos os treinadores existentes
SELECT 
    'TODOS_TREINADORES' as tipo,
    c.id,
    c.user_id,
    c.cref,
    p.full_name,
    u.email,
    c.created_at
FROM public.coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN public.profiles p ON c.user_id = p.user_id
ORDER BY c.created_at DESC;

-- 5. Verificar todos os usuários com seus tipos
SELECT 
    'USUARIOS_E_TIPOS' as tipo,
    u.id,
    u.email,
    p.user_type,
    p.full_name,
    CASE 
        WHEN c.id IS NOT NULL THEN 'TREINADOR_REGISTRADO'
        WHEN p.user_type = 'coach' THEN 'TREINADOR_SEM_REGISTRO'
        WHEN p.user_type = 'athlete' THEN 'ATLETA'
        ELSE 'TIPO_INDEFINIDO'
    END as status,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.coaches c ON u.id = c.user_id
WHERE u.email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY u.created_at;

-- 6. Verificar relacionamentos existentes
SELECT 
    'RELACIONAMENTOS_EXISTENTES' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email,
    coach_profile.user_type as coach_type,
    athlete_profile.user_type as athlete_type
FROM public.athlete_coach_relationships acr
LEFT JOIN auth.users coach ON acr.coach_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
LEFT JOIN public.profiles coach_profile ON acr.coach_id = coach_profile.user_id
LEFT JOIN public.profiles athlete_profile ON acr.athlete_id = athlete_profile.user_id
WHERE acr.status = 'active';
