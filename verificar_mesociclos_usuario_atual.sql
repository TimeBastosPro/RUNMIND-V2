-- Script para verificar mesociclos do usuário atual
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os mesociclos do usuário atual
SELECT 
    'TODOS os mesociclos do usuário' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 2. Listar detalhes de TODOS os mesociclos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    m.user_id,
    m.created_at,
    m.updated_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY m.created_at;

-- 3. Verificar macrociclos do usuário atual
SELECT 
    'Macrociclos do usuário' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 4. Listar detalhes dos macrociclos
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.start_date,
    mc.end_date,
    mc.goal,
    mc.user_id,
    mc.created_at,
    mc.updated_at
FROM public.macrociclos mc
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY mc.created_at;

-- 5. Verificar relacionamentos entre macrociclos e mesociclos
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name ORDER BY m.start_date) as nomes_mesociclos,
    ARRAY_AGG(m.id ORDER BY m.start_date) as ids_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name
ORDER BY mc.created_at;

-- 6. Verificar se há mesociclos órfãos (sem macrociclo_id)
SELECT 
    'Mesociclos sem macrociclo_id' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND macrociclo_id IS NULL;

-- 7. Listar mesociclos órfãos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    m.created_at
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND m.macrociclo_id IS NULL
ORDER BY m.created_at;

-- 8. Verificar se há mesociclos com macrociclo_id inválido
SELECT 
    'Mesociclos com macrociclo_id inválido' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND m.macrociclo_id IS NOT NULL
AND mc.id IS NULL;

-- 9. Listar mesociclos com macrociclo_id inválido
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    m.created_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND m.macrociclo_id IS NOT NULL
AND mc.id IS NULL
ORDER BY m.created_at;
