-- Script para verificar problemas gerais de carregamento de dados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os usuários e seus dados
SELECT 
    'Resumo geral' as tipo,
    COUNT(DISTINCT u.id) as total_usuarios,
    COUNT(DISTINCT mc.id) as total_macrociclos,
    COUNT(DISTINCT m.id) as total_mesociclos
FROM auth.users u
LEFT JOIN public.macrociclos mc ON u.id = mc.user_id
LEFT JOIN public.mesociclos m ON u.id = m.user_id;

-- 2. Verificar dados por usuário
SELECT 
    'Dados por usuário' as tipo,
    u.email,
    COUNT(DISTINCT mc.id) as total_macrociclos,
    COUNT(DISTINCT m.id) as total_mesociclos,
    STRING_AGG(DISTINCT mc.name, ', ') as macrociclos,
    STRING_AGG(DISTINCT m.name, ', ') as mesociclos
FROM auth.users u
LEFT JOIN public.macrociclos mc ON u.id = mc.user_id
LEFT JOIN public.mesociclos m ON u.id = m.user_id
GROUP BY u.id, u.email
ORDER BY u.email;

-- 3. Verificar se há problemas de relacionamento
SELECT 
    'Verificação de relacionamentos' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN m.macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo_id,
    COUNT(CASE WHEN m.macrociclo_id IS NULL THEN 1 END) as sem_macrociclo_id,
    COUNT(CASE WHEN mc.id IS NOT NULL THEN 1 END) as com_macrociclo_valido
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id;

-- 4. Verificar se há mesociclos órfãos
SELECT 
    'Mesociclos órfãos' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    u.email as usuario,
    m.created_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE mc.id IS NULL;

-- 5. Verificar se há problemas de user_id
SELECT 
    'Problemas de user_id' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.user_id as mesociclo_user_id,
    mc.user_id as macrociclo_user_id,
    u1.email as mesociclo_usuario,
    u2.email as macrociclo_usuario
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
LEFT JOIN auth.users u1 ON m.user_id = u1.id
LEFT JOIN auth.users u2 ON mc.user_id = u2.id
WHERE m.user_id != mc.user_id;

-- 6. Verificar se há problemas de datas
SELECT 
    'Problemas de datas' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    u.email as usuario,
    CASE 
        WHEN m.start_date IS NULL THEN 'Start date nulo'
        WHEN m.end_date IS NULL THEN 'End date nulo'
        WHEN m.start_date > m.end_date THEN 'Start date > End date'
        ELSE 'OK'
    END as status_data
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE m.start_date IS NULL OR m.end_date IS NULL OR m.start_date > m.end_date;

-- 7. Verificar se há problemas de tipos
SELECT 
    'Verificação de tipos' as tipo,
    m.mesociclo_type,
    COUNT(*) as quantidade,
    STRING_AGG(m.name, ', ') as mesociclos
FROM public.mesociclos m
GROUP BY m.mesociclo_type
ORDER BY m.mesociclo_type;

-- 8. Verificar se há problemas de duplicatas
SELECT 
    'Verificação de duplicatas' as tipo,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
GROUP BY m.name, m.macrociclo_id, mc.name
HAVING COUNT(*) > 1;
