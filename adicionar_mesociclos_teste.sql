-- Script para adicionar mais mesociclos de teste
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o macrociclo existente
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.start_date,
    mc.end_date,
    COUNT(m.id) as total_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name, mc.start_date, mc.end_date;

-- 2. Inserir mesociclo "Desenvolvimento"
INSERT INTO public.mesociclos (
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    description,
    macrociclo_id,
    user_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Desenvolvimento - 4 semanas',
    'desenvolvimento',
    '2025-09-22',
    '2025-10-19',
    'Mesociclo de Desenvolvimento - Semanas 7, 8, 9, 10',
    mc.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM public.macrociclos mc
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.name LIKE '%Berlim%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Inserir mesociclo "Específico"
INSERT INTO public.mesociclos (
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    description,
    macrociclo_id,
    user_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Específico - 3 semanas',
    'especifico',
    '2025-10-20',
    '2025-11-09',
    'Mesociclo Específico - Semanas 11, 12, 13',
    mc.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM public.macrociclos mc
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.name LIKE '%Berlim%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Inserir mesociclo "Polimento"
INSERT INTO public.mesociclos (
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    description,
    macrociclo_id,
    user_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Polimento - 2 semanas',
    'polimento',
    '2025-11-10',
    '2025-11-23',
    'Mesociclo de Polimento - Semanas 14, 15',
    mc.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM public.macrociclos mc
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.name LIKE '%Berlim%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Inserir mesociclo "Competitivo"
INSERT INTO public.mesociclos (
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    description,
    macrociclo_id,
    user_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Competitivo - 1 semana',
    'competitivo',
    '2025-11-24',
    '2025-11-30',
    'Mesociclo Competitivo - Semana 16',
    mc.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM public.macrociclos mc
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.name LIKE '%Berlim%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 6. Verificar resultado final
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

-- 7. Listar todos os mesociclos em ordem cronológica
SELECT 
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.description,
    mc.name as macrociclo_name
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY m.start_date;
