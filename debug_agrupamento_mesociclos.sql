-- Script para debugar o agrupamento de mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há mesociclos duplicados
SELECT 
    m.macrociclo_id,
    m.name,
    COUNT(*) as quantidade
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY m.macrociclo_id, m.name
HAVING COUNT(*) > 1;

-- 2. Verificar se há mesociclos com datas sobrepostas
SELECT 
    m1.name as mesociclo1,
    m1.start_date as inicio1,
    m1.end_date as fim1,
    m2.name as mesociclo2,
    m2.start_date as inicio2,
    m2.end_date as fim2
FROM public.mesociclos m1
JOIN public.mesociclos m2 ON m1.id != m2.id 
    AND m1.macrociclo_id = m2.macrociclo_id
    AND m1.macrociclo_id IS NOT NULL
    AND m1.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
    AND m2.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
    AND (
        (m1.start_date <= m2.end_date AND m1.end_date >= m2.start_date)
    )
ORDER BY m1.start_date;

-- 3. Verificar se há mesociclos com macrociclo_id inválido
SELECT 
    m.id,
    m.name,
    m.macrociclo_id,
    mc.id as macrociclo_existe
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND m.macrociclo_id IS NOT NULL
AND mc.id IS NULL;

-- 4. Verificar se há mesociclos sem macrociclo_id
SELECT 
    m.id,
    m.name,
    m.macrociclo_id,
    m.user_id
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND m.macrociclo_id IS NULL;

-- 5. Verificar se há macrociclos sem mesociclos
SELECT 
    mc.id,
    mc.name,
    COUNT(m.id) as total_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name
HAVING COUNT(m.id) = 0;

-- 6. Verificar se há problemas de relacionamento
SELECT 
    CASE 
        WHEN m.macrociclo_id IS NULL THEN 'Mesociclo sem macrociclo_id'
        WHEN mc.id IS NULL THEN 'Mesociclo com macrociclo_id inválido'
        WHEN m.user_id != mc.user_id THEN 'Mesociclo e macrociclo de usuários diferentes'
        ELSE 'Relacionamento OK'
    END as status,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY 
    CASE 
        WHEN m.macrociclo_id IS NULL THEN 'Mesociclo sem macrociclo_id'
        WHEN mc.id IS NULL THEN 'Mesociclo com macrociclo_id inválido'
        WHEN m.user_id != mc.user_id THEN 'Mesociclo e macrociclo de usuários diferentes'
        ELSE 'Relacionamento OK'
    END;

-- 7. Verificar se há mesociclos com datas inválidas
SELECT 
    m.id,
    m.name,
    m.start_date,
    m.end_date,
    CASE 
        WHEN m.start_date > m.end_date THEN 'Data de início maior que fim'
        WHEN m.start_date IS NULL THEN 'Data de início nula'
        WHEN m.end_date IS NULL THEN 'Data de fim nula'
        ELSE 'Datas OK'
    END as status
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND (
    m.start_date > m.end_date 
    OR m.start_date IS NULL 
    OR m.end_date IS NULL
);
