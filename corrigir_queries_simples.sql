-- Corrigir Queries Simples - Teste
-- Execute este script no Supabase SQL Editor

-- 1. Testar query simples para macrociclos
SELECT 
    'TESTE_MACROCICLOS_SIMPLES' as tipo,
    'Testando query simples para macrociclos' as descricao;

-- Query simples para macrociclos da Aline
SELECT 
    'MACROCICLOS_ALINE' as tipo,
    id,
    name,
    user_id,
    start_date,
    end_date,
    created_at
FROM public.macrociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- 2. Testar query simples para mesociclos
SELECT 
    'TESTE_MESOCICLOS_SIMPLES' as tipo,
    'Testando query simples para mesociclos' as descricao;

-- Query simples para mesociclos da Aline
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
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- 3. Testar query simples para microciclos
SELECT 
    'TESTE_MICROCICLOS_SIMPLES' as tipo,
    'Testando query simples para microciclos' as descricao;

-- Query simples para microciclos da Aline
SELECT 
    'MICROCICLOS_ALINE' as tipo,
    id,
    name,
    user_id,
    mesociclo_id,
    start_date,
    end_date,
    created_at
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- 4. Testar relacionamentos de treinador
SELECT 
    'TESTE_RELACIONAMENTOS_TREINADOR' as tipo,
    'Testando relacionamentos do treinador' as descricao;

-- Relacionamentos ativos do treinador
SELECT 
    'RELACIONAMENTOS_ATIVOS' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.user_id
JOIN public.profiles p ON acr.athlete_id = p.id
WHERE c.email = 'timebastos@gmail.com'
AND acr.status IN ('active', 'approved')
ORDER BY acr.created_at DESC;

-- 5. Testar query com JOIN simples
SELECT 
    'TESTE_JOIN_SIMPLES' as tipo,
    'Testando JOIN simples sem quebras de linha' as descricao;

-- JOIN simples para mesociclos
SELECT 
    'JOIN_MESOCICLOS_SIMPLES' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.user_id,
    u.email as user_email,
    p.full_name as user_name
FROM public.mesociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY m.created_at DESC
LIMIT 5;

-- 6. Resumo dos testes
SELECT 
    'RESUMO_TESTES' as tipo,
    'Queries simples testadas:' as descricao,
    '1. Macrociclos simples' as teste1,
    '2. Mesociclos simples' as teste2,
    '3. Microciclos simples' as teste3,
    '4. Relacionamentos treinador' as teste4,
    '5. JOIN simples' as teste5,
    'Agora teste a aplicação novamente' as proximo_passo;
