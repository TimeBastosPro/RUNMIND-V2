-- Corrigir erro PGRST116 - Diagnosticar e resolver problema de múltiplas linhas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há dados duplicados na tabela profiles
SELECT 
    'DUPLICATAS_PROFILES' as tipo,
    email,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 2. Verificar relacionamentos duplicados que podem estar causando o problema
SELECT 
    'DUPLICATAS_RELACIONAMENTOS' as tipo,
    coach_id,
    athlete_id,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids_relacionamentos
FROM public.athlete_coach_relationships
GROUP BY coach_id, athlete_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 3. Verificar se há macrociclos duplicados
SELECT 
    'DUPLICATAS_MACROCICLOS' as tipo,
    user_id,
    name,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids_macrociclos
FROM public.macrociclos
GROUP BY user_id, name
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 4. Verificar se há mesociclos duplicados
SELECT 
    'DUPLICATAS_MESOCICLOS' as tipo,
    user_id,
    macrociclo_id,
    name,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids_mesociclos
FROM public.mesociclos
GROUP BY user_id, macrociclo_id, name
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. Testar a query problemática que está causando PGRST116
SELECT 
    'TESTE_QUERY_PROBLEMATICA' as tipo,
    'Testando query que está causando PGRST116' as descricao;

-- Testar a query que está falhando
WITH test_query AS (
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
    LIMIT 5
)
SELECT 
    'RESULTADO_TESTE' as tipo,
    COUNT(*) as total_linhas,
    COUNT(DISTINCT id) as macrociclos_unicos,
    COUNT(DISTINCT user_id_from_join) as usuarios_unicos,
    COUNT(DISTINCT profile_id) as perfis_unicos
FROM test_query;

-- 6. Verificar estrutura das tabelas relacionadas
SELECT 
    'ESTRUTURA_TABELAS' as tipo,
    'Verificando se há problemas na estrutura' as descricao;

-- Verificar se profiles tem user_id ou se usa id diretamente
SELECT 
    'PROFILES_STRUCTURE' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('id', 'user_id', 'email')
ORDER BY ordinal_position;

-- 7. Verificar dados específicos da Aline
SELECT 
    'DADOS_ALINE' as tipo,
    'Verificando dados específicos da atleta Aline' as descricao;

-- Dados da Aline em auth.users
SELECT 
    'AUTH_USERS_ALINE' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'aline@gmail.com';

-- Dados da Aline em profiles
SELECT 
    'PROFILES_ALINE' as tipo,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM public.profiles
WHERE email = 'aline@gmail.com';

-- Macrociclos da Aline
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

-- 8. Resumo do diagnóstico
SELECT 
    'RESUMO_DIAGNOSTICO' as tipo,
    'PGRST116 indica múltiplas linhas retornadas' as problema,
    'Verificar duplicatas e estrutura das tabelas' as solucao;
