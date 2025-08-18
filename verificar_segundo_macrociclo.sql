-- Script para verificar o segundo macrociclo e seus mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os macrociclos do usuário
SELECT 
    'Todos os macrociclos' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 2. Listar todos os macrociclos com detalhes
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.start_date,
    mc.end_date,
    mc.created_at,
    COUNT(m.id) as total_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name, mc.start_date, mc.end_date, mc.created_at
ORDER BY mc.created_at;

-- 3. Verificar mesociclos do segundo macrociclo
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
    'Segundo macrociclo' as tipo,
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos
FROM macrociclos_ordenados mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.ordem = 2
GROUP BY mc.id, mc.name;

-- 4. Listar todos os mesociclos do segundo macrociclo
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
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    mc.ordem as ordem_macrociclo
FROM public.mesociclos m
JOIN macrociclos_ordenados mc ON m.macrociclo_id = mc.id
WHERE mc.ordem = 2
ORDER BY m.start_date;

-- 5. Verificar se há problemas de relacionamento
SELECT 
    'Verificação de relacionamentos' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN m.macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo_id,
    COUNT(CASE WHEN m.macrociclo_id IS NULL THEN 1 END) as sem_macrociclo_id
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 6. Verificar se há mesociclos órfãos
SELECT 
    'Mesociclos órfãos' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND (mc.id IS NULL OR mc.user_id != m.user_id);
