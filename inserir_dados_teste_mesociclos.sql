-- Script para inserir dados de teste de mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários existentes
SELECT id, email FROM auth.users LIMIT 5;

-- 2. Inserir macrociclo de teste (substitua o user_id pelo ID real do usuário)
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
    'Maratona Teste',
    'Preparação para maratona de teste',
    '2025-12-07',
    '2026-08-07',
    'sub 3h',
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING
RETURNING id, name;

-- 3. Inserir mesociclos de teste
WITH macrociclo_teste AS (
    SELECT id FROM public.macrociclos 
    WHERE name = 'Maratona Teste' 
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
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW()
FROM macrociclo_teste mt
WHERE mt.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Inserir mais um mesociclo
WITH macrociclo_teste AS (
    SELECT id FROM public.macrociclos 
    WHERE name = 'Maratona Teste' 
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
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW()
FROM macrociclo_teste mt
WHERE mt.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Verificar os dados inseridos
SELECT 
    'Macrociclos' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
UNION ALL
SELECT 
    'Mesociclos' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos;

-- 6. Verificar relacionamentos
SELECT 
    mc.name as macrociclo,
    mc.id as macrociclo_id,
    m.name as mesociclo,
    m.id as mesociclo_id,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id as mesociclo_macrociclo_id
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
ORDER BY mc.name, m.start_date;

-- 7. Verificar se há mesociclos sem macrociclo_id
SELECT 
    id,
    name,
    mesociclo_type,
    macrociclo_id,
    user_id
FROM public.mesociclos
WHERE macrociclo_id IS NULL;
