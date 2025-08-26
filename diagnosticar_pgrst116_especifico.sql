-- Diagnosticar PGRST116 - Script Específico
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há perfis duplicados (causa mais comum do PGRST116)
SELECT 
    'VERIFICAR_PERFIS_DUPLICADOS' as tipo,
    email,
    COUNT(*) as quantidade
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. Se houver duplicatas, mostrar detalhes
SELECT 
    'DETALHES_PERFIS_DUPLICADOS' as tipo,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM public.profiles
WHERE email IN (
    SELECT email 
    FROM public.profiles 
    GROUP BY email 
    HAVING COUNT(*) > 1
)
ORDER BY email, created_at;

-- 3. Testar a query exata que está falhando (fetchMacrociclos)
SELECT 
    'TESTE_FETCH_MACROCICLOS' as tipo,
    'Testando query fetchMacrociclos que está falhando' as descricao;

-- Simular a query do fetchMacrociclos
WITH test_fetch_macrociclos AS (
    SELECT 
        m.*,
        u.id as user_id_from_join,
        u.email as user_email_from_join,
        p.id as profile_id,
        p.full_name,
        p.user_type
    FROM public.macrociclos m
    LEFT JOIN auth.users u ON m.user_id = u.id
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'  -- ID da Aline
)
SELECT 
    'RESULTADO_FETCH_MACROCICLOS' as tipo,
    COUNT(*) as total_linhas,
    COUNT(DISTINCT m.id) as macrociclos_unicos,
    COUNT(DISTINCT u.id) as usuarios_unicos,
    COUNT(DISTINCT p.id) as perfis_unicos
FROM test_fetch_macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id;

-- 4. Testar a query do fetchMesociclos
SELECT 
    'TESTE_FETCH_MESOCICLOS' as tipo,
    'Testando query fetchMesociclos que está falhando' as descricao;

-- Simular a query do fetchMesociclos
WITH test_fetch_mesociclos AS (
    SELECT 
        mes.*,
        u.id as user_id_from_join,
        u.email as user_email_from_join,
        p.id as profile_id,
        p.full_name,
        p.user_type
    FROM public.mesociclos mes
    LEFT JOIN auth.users u ON mes.user_id = u.id
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE mes.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'  -- ID da Aline
)
SELECT 
    'RESULTADO_FETCH_MESOCICLOS' as tipo,
    COUNT(*) as total_linhas,
    COUNT(DISTINCT mes.id) as mesociclos_unicos,
    COUNT(DISTINCT u.id) as usuarios_unicos,
    COUNT(DISTINCT p.id) as perfis_unicos
FROM test_fetch_mesociclos mes
LEFT JOIN auth.users u ON mes.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id;

-- 5. Verificar se o problema está no JOIN com profiles
SELECT 
    'TESTE_JOIN_PROFILES' as tipo,
    'Testando se o JOIN com profiles está causando múltiplas linhas' as descricao;

-- Testar JOIN simples
SELECT 
    'JOIN_SIMPLES' as tipo,
    u.id as user_id,
    u.email as user_email,
    COUNT(p.id) as perfis_count,
    STRING_AGG(p.id::text, ', ') as perfis_ids
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'aline@gmail.com'
GROUP BY u.id, u.email;

-- 6. Verificar se há problemas na estrutura da tabela profiles
SELECT 
    'ESTRUTURA_PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Verificar dados específicos da Aline
SELECT 
    'DADOS_ALINE_COMPLETOS' as tipo,
    'Verificando todos os dados da Aline' as descricao;

-- Auth users
SELECT 
    'AUTH_USERS_ALINE' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'aline@gmail.com';

-- Profiles
SELECT 
    'PROFILES_ALINE' as tipo,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM public.profiles
WHERE email = 'aline@gmail.com';

-- Macrociclos
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

-- Mesociclos
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

-- 8. Resumo do diagnóstico
SELECT 
    'RESUMO_PGRST116' as tipo,
    'PGRST116 = múltiplas linhas em JOIN' as problema,
    'Verificar duplicatas em profiles' as solucao;
