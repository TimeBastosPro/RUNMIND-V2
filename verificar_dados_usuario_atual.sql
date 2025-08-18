-- Script para verificar dados do usuário atual
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuário atual (substitua pelo email correto)
-- SELECT id, email FROM auth.users WHERE email = 'timebastos@gmail.com';

-- 2. Verificar macrociclos do usuário atual
SELECT 
    'Macrociclos do usuário' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
UNION ALL
SELECT 
    'Mesociclos do usuário' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 3. Verificar detalhes dos macrociclos do usuário
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.start_date,
    mc.end_date,
    mc.goal,
    mc.user_id,
    COUNT(m.id) as total_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name, mc.start_date, mc.end_date, mc.goal, mc.user_id
ORDER BY mc.created_at;

-- 4. Verificar detalhes dos mesociclos do usuário
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    m.user_id,
    m.created_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY m.created_at;

-- 5. Verificar relacionamentos válidos do usuário
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name ORDER BY m.start_date) as nomes_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name
ORDER BY mc.created_at;

-- 6. Verificar se há problemas específicos do usuário
SELECT 
    CASE 
        WHEN m.macrociclo_id IS NULL THEN 'Mesociclo sem macrociclo_id'
        WHEN mc.id IS NULL THEN 'Mesociclo com macrociclo_id inválido'
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
        ELSE 'Relacionamento OK'
    END;
