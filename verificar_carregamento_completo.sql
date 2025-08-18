-- Script para verificar carregamento completo dos dados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os dados do usuário
SELECT 
    'Resumo completo' as tipo,
    (SELECT COUNT(*) FROM public.macrociclos WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)) as total_macrociclos,
    (SELECT COUNT(*) FROM public.mesociclos WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)) as total_mesociclos;

-- 2. Verificar se todos os mesociclos têm macrociclo_id válido
SELECT 
    'Verificação de relacionamentos' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN m.macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo_id,
    COUNT(CASE WHEN m.macrociclo_id IS NULL THEN 1 END) as sem_macrociclo_id,
    COUNT(CASE WHEN mc.id IS NOT NULL THEN 1 END) as com_macrociclo_valido
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 3. Listar todos os macrociclos com seus mesociclos
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.created_at as macrociclo_created,
    COUNT(m.id) as total_mesociclos,
    STRING_AGG(m.name, ', ' ORDER BY m.start_date) as mesociclos_lista
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name, mc.created_at
ORDER BY mc.created_at;

-- 4. Verificar se há mesociclos duplicados
SELECT 
    'Verificação de duplicatas' as tipo,
    m.name as mesociclo_name,
    m.macrociclo_id,
    COUNT(*) as quantidade
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY m.name, m.macrociclo_id
HAVING COUNT(*) > 1;

-- 5. Verificar se há mesociclos com datas sobrepostas
SELECT 
    'Verificação de datas sobrepostas' as tipo,
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
WHERE (m1.start_date <= m2.end_date AND m1.end_date >= m2.start_date)
ORDER BY m1.start_date;

-- 6. Listar todos os mesociclos com detalhes completos
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
ORDER BY mc.created_at, m.start_date;
