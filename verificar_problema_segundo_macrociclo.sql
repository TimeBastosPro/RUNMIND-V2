-- Script para verificar problemas específicos com o segundo macrociclo
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há problemas com o segundo macrociclo
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.start_date,
        mc.end_date,
        mc.created_at,
        mc.updated_at,
        mc.user_id,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
)
SELECT 
    'Segundo macrociclo - Detalhes' as tipo,
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    mc.start_date,
    mc.end_date,
    mc.created_at,
    mc.updated_at,
    mc.user_id,
    mc.ordem
FROM macrociclos_ordenados mc
WHERE mc.ordem = 2;

-- 2. Verificar mesociclos do segundo macrociclo com detalhes
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.created_at,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
)
SELECT 
    'Mesociclos do segundo macrociclo' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    m.created_at,
    m.updated_at,
    mc.name as macrociclo_name,
    mc.ordem as ordem_macrociclo
FROM public.mesociclos m
JOIN macrociclos_ordenados mc ON m.macrociclo_id = mc.id
WHERE mc.ordem = 2
ORDER BY m.start_date;

-- 3. Verificar se há problemas de RLS (Row Level Security) para o segundo macrociclo
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.created_at,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
)
SELECT 
    'Teste RLS - Segundo macrociclo' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN m.macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo_id,
    COUNT(CASE WHEN mc.id IS NOT NULL THEN 1 END) as com_macrociclo_valido
FROM public.mesociclos m
LEFT JOIN macrociclos_ordenados mc ON m.macrociclo_id = mc.id
WHERE mc.ordem = 2
AND m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 4. Verificar se há mesociclos órfãos ou com problemas
SELECT 
    'Verificação de problemas' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    mc.user_id as macrociclo_user_id,
    m.user_id as mesociclo_user_id,
    CASE 
        WHEN mc.id IS NULL THEN 'Mesociclo órfão'
        WHEN mc.user_id != m.user_id THEN 'User ID diferente'
        ELSE 'OK'
    END as status
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND (mc.id IS NULL OR mc.user_id != m.user_id);

-- 5. Verificar se há mesociclos com datas inválidas
SELECT 
    'Verificação de datas' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    CASE 
        WHEN m.start_date IS NULL THEN 'Start date nulo'
        WHEN m.end_date IS NULL THEN 'End date nulo'
        WHEN m.start_date > m.end_date THEN 'Start date > End date'
        ELSE 'OK'
    END as status_data
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND (m.start_date IS NULL OR m.end_date IS NULL OR m.start_date > m.end_date);
