-- Testar queries individualmente para identificar PGRST116
-- Execute cada query separadamente no Supabase SQL Editor

-- QUERY 1: Verificar perfis duplicados
SELECT 
    'PERFIS_DUPLICADOS' as tipo,
    email,
    COUNT(*) as quantidade
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- QUERY 2: Verificar dados da Aline em auth.users
SELECT 
    'AUTH_USERS_ALINE' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'aline@gmail.com';

-- QUERY 3: Verificar dados da Aline em profiles
SELECT 
    'PROFILES_ALINE' as tipo,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM public.profiles
WHERE email = 'aline@gmail.com';

-- QUERY 4: Verificar macrociclos da Aline
SELECT 
    'MACROCICLOS_ALINE' as tipo,
    id,
    name,
    user_id,
    start_date,
    end_date,
    created_at
FROM public.macrociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- QUERY 5: Verificar mesociclos da Aline
SELECT 
    'MESOCICLOS_ALINE' as tipo,
    id,
    name,
    user_id,
    macrociclo_id,
    start_date,
    end_date,
    created_at
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- QUERY 6: Testar JOIN simples auth.users + profiles
SELECT 
    'JOIN_SIMPLES' as tipo,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.full_name,
    p.user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'aline@gmail.com';

-- QUERY 7: Testar JOIN macrociclos + auth.users + profiles
SELECT 
    'JOIN_MACROCICLOS' as tipo,
    m.id as macrociclo_id,
    m.name as macrociclo_name,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.full_name,
    p.user_type
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- QUERY 8: Testar JOIN mesociclos + auth.users + profiles
SELECT 
    'JOIN_MESOCICLOS' as tipo,
    mes.id as mesociclo_id,
    mes.name as mesociclo_name,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.full_name,
    p.user_type
FROM public.mesociclos mes
LEFT JOIN auth.users u ON mes.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE mes.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- QUERY 9: Contar total de linhas em cada JOIN
SELECT 
    'CONTAGEM_JOINS' as tipo,
    'Macrociclos + Users + Profiles' as join_type,
    COUNT(*) as total_linhas
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
    'CONTAGEM_JOINS' as tipo,
    'Mesociclos + Users + Profiles' as join_type,
    COUNT(*) as total_linhas
FROM public.mesociclos mes
LEFT JOIN auth.users u ON mes.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE mes.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';
