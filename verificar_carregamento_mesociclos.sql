-- Script para verificar problemas específicos de carregamento de mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os mesociclos com detalhes completos
SELECT 
    'Todos os mesociclos' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    mc.name as macrociclo_name,
    u.email as usuario,
    m.created_at,
    m.updated_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
LEFT JOIN auth.users u ON m.user_id = u.id
ORDER BY u.email, mc.created_at, m.start_date;

-- 2. Verificar agrupamento por macrociclo
SELECT 
    'Agrupamento por macrociclo' as tipo,
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.created_at as macrociclo_created,
    u.email as usuario,
    COUNT(m.id) as total_mesociclos,
    STRING_AGG(m.name, ', ' ORDER BY m.start_date) as mesociclos_lista,
    STRING_AGG(m.mesociclo_type, ', ' ORDER BY m.start_date) as tipos_lista
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
LEFT JOIN auth.users u ON mc.user_id = u.id
GROUP BY mc.id, mc.name, mc.created_at, u.email
ORDER BY u.email, mc.created_at;

-- 3. Verificar se há mesociclos sem macrociclo_id
SELECT 
    'Mesociclos sem macrociclo_id' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.user_id,
    u.email as usuario,
    m.created_at
FROM public.mesociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE m.macrociclo_id IS NULL;

-- 4. Verificar se há mesociclos com macrociclo_id inválido
SELECT 
    'Mesociclos com macrociclo_id inválido' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    m.user_id,
    u.email as usuario,
    mc.name as macrociclo_name,
    mc.user_id as macrociclo_user_id
FROM public.mesociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.macrociclo_id IS NOT NULL AND mc.id IS NULL;

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

-- 6. Verificar se há mesociclos duplicados
SELECT 
    'Mesociclos duplicados' as tipo,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    COUNT(*) as quantidade,
    STRING_AGG(m.id::text, ', ') as ids_mesociclos
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
GROUP BY m.name, m.macrociclo_id, mc.name
HAVING COUNT(*) > 1;

-- 7. Verificar se há mesociclos com datas sobrepostas
SELECT 
    'Mesociclos com datas sobrepostas' as tipo,
    m1.name as mesociclo1,
    m1.start_date as inicio1,
    m1.end_date as fim1,
    m2.name as mesociclo2,
    m2.start_date as inicio2,
    m2.end_date as fim2,
    mc.name as macrociclo_name
FROM public.mesociclos m1
JOIN public.mesociclos m2 ON m1.id != m2.id 
    AND m1.macrociclo_id = m2.macrociclo_id
    AND m1.macrociclo_id IS NOT NULL
LEFT JOIN public.macrociclos mc ON m1.macrociclo_id = mc.id
WHERE (m1.start_date <= m2.end_date AND m1.end_date >= m2.start_date)
ORDER BY mc.created_at, m1.start_date;
