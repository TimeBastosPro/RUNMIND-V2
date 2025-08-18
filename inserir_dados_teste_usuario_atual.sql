-- Script para inserir dados de teste para o usuário atual
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário tem dados
SELECT 
    'Verificação inicial' as status,
    COUNT(*) as total_macrociclos,
    (SELECT COUNT(*) FROM public.mesociclos WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)) as total_mesociclos
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 2. Inserir macrociclo de teste para o usuário atual
INSERT INTO public.macrociclos (
    id,
    name,
    description,
    start_date,
    end_date,
    goal,
    user_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Maratona Teste - Usuário Atual',
    'Preparação para maratona de teste do usuário atual',
    '2025-12-07',
    '2026-08-07',
    'sub 3h',
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING
RETURNING id, name;

-- 3. Inserir mesociclos de teste para o usuário atual
WITH macrociclo_teste AS (
    SELECT id FROM public.macrociclos 
    WHERE name = 'Maratona Teste - Usuário Atual' 
    AND user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
    LIMIT 1
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
    'Base - 5 semanas',
    'base',
    '2025-12-08',
    '2026-01-11',
    'Mesociclo Base - Semanas 1, 2, 3, 4, 5',
    mt.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM macrociclo_teste mt
WHERE mt.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Inserir mais um mesociclo
WITH macrociclo_teste AS (
    SELECT id FROM public.macrociclos 
    WHERE name = 'Maratona Teste - Usuário Atual' 
    AND user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
    LIMIT 1
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
    'Desenvolvimento - 4 semanas',
    'desenvolvimento',
    '2026-01-12',
    '2026-02-08',
    'Mesociclo de Desenvolvimento - Semanas 6, 7, 8, 9',
    mt.id,
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1),
    NOW(),
    NOW()
FROM macrociclo_teste mt
WHERE mt.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Verificar dados após inserção
SELECT 
    'Após inserção' as status,
    COUNT(*) as total_macrociclos,
    (SELECT COUNT(*) FROM public.mesociclos WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)) as total_mesociclos
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 6. Verificar relacionamentos após inserção
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
