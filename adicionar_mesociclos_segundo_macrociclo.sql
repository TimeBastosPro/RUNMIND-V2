-- Script para adicionar mesociclos de teste ao segundo macrociclo
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o segundo macrociclo
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.start_date,
        mc.end_date,
        mc.created_at,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
)
SELECT 
    'Segundo macrociclo encontrado' as status,
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    mc.start_date,
    mc.end_date,
    COUNT(m.id) as total_mesociclos
FROM macrociclos_ordenados mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.ordem = 2
GROUP BY mc.id, mc.name, mc.start_date, mc.end_date;

-- 2. Inserir mesociclos de teste no segundo macrociclo
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.start_date,
        mc.end_date,
        mc.created_at,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
),
segundo_macrociclo AS (
    SELECT * FROM macrociclos_ordenados WHERE ordem = 2
)
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
    'Base - 4 semanas',
    'base',
    (SELECT start_date FROM segundo_macrociclo),
    (SELECT start_date FROM segundo_macrociclo)::date + INTERVAL '28 days',
    'Mesociclo Base - Semanas 1, 2, 3, 4',
    (SELECT id FROM segundo_macrociclo),
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM segundo_macrociclo)
AND NOT EXISTS (
    SELECT 1 FROM public.mesociclos m 
    WHERE m.macrociclo_id = (SELECT id FROM segundo_macrociclo)
    AND m.name = 'Base - 4 semanas'
);

-- 3. Inserir segundo mesociclo
WITH macrociclos_ordenados AS (
    SELECT 
        mc.id,
        mc.name,
        mc.start_date,
        mc.end_date,
        mc.created_at,
        ROW_NUMBER() OVER (ORDER BY mc.created_at) as ordem
    FROM public.macrociclos mc
    WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
),
segundo_macrociclo AS (
    SELECT * FROM macrociclos_ordenados WHERE ordem = 2
)
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
    'Desenvolvimento - 3 semanas',
    'desenvolvimento',
    (SELECT start_date FROM segundo_macrociclo)::date + INTERVAL '29 days',
    (SELECT start_date FROM segundo_macrociclo)::date + INTERVAL '49 days',
    'Mesociclo Desenvolvimento - Semanas 5, 6, 7',
    (SELECT id FROM segundo_macrociclo),
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM segundo_macrociclo)
AND NOT EXISTS (
    SELECT 1 FROM public.mesociclos m 
    WHERE m.macrociclo_id = (SELECT id FROM segundo_macrociclo)
    AND m.name = 'Desenvolvimento - 3 semanas'
);

-- 4. Verificar resultado final
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
    'Resultado final' as status,
    mc.name as macrociclo_name,
    mc.ordem as ordem_macrociclo,
    COUNT(m.id) as total_mesociclos,
    STRING_AGG(m.name, ', ' ORDER BY m.start_date) as mesociclos
FROM macrociclos_ordenados mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name, mc.ordem
ORDER BY mc.ordem;
