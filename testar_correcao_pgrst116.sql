-- Testar Correção PGRST116
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se os dados estão corretos
SELECT 
    'VERIFICACAO_DADOS' as tipo,
    'Verificando se os dados estão corretos após correção' as descricao;

-- Contar registros por usuário
SELECT 
    'CONTAGEM_POR_USUARIO' as tipo,
    user_id,
    COUNT(*) as total_mesociclos
FROM public.mesociclos
GROUP BY user_id
ORDER BY total_mesociclos DESC;

-- 2. Verificar relacionamentos
SELECT 
    'RELACIONAMENTOS_MESOCICLOS' as tipo,
    'Verificando relacionamentos mesociclos -> macrociclos' as descricao;

-- Relacionamentos mesociclos -> macrociclos
SELECT 
    'MESOCICLOS_MACROCICLOS' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    m.user_id
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY m.created_at DESC
LIMIT 5;

-- 3. Verificar se há problemas de JOIN
SELECT 
    'VERIFICAR_JOIN_PROBLEMS' as tipo,
    'Verificando se há problemas de JOIN que causam PGRST116' as descricao;

-- Testar JOIN que pode causar PGRST116
SELECT 
    'TESTE_JOIN_MESOCICLOS' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.full_name,
    p.user_type
FROM public.mesociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY m.created_at DESC
LIMIT 5;

-- 4. Verificar se há duplicatas que podem causar problemas
SELECT 
    'VERIFICAR_DUPLICATAS' as tipo,
    'Verificando se há duplicatas que podem causar PGRST116' as descricao;

-- Verificar duplicatas por nome e macrociclo
SELECT 
    'DUPLICATAS_MESOCICLOS' as tipo,
    name,
    macrociclo_id,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
GROUP BY name, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. Resumo da correção
SELECT 
    'RESUMO_CORRECAO' as tipo,
    'Correções aplicadas no código:' as correcoes,
    '1. Removido .single() e usado .maybeSingle()' as passo1,
    '2. Removido profiles!inner e usado profiles' as passo2,
    '3. Mantido JOIN LEFT para evitar PGRST116' as passo3,
    'Agora teste criar novos mesociclos/microciclos' as proximo_passo;
