-- Script para testar exibição de mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Limpar dados existentes (opcional)
-- DELETE FROM public.mesociclos;
-- DELETE FROM public.macrociclos;

-- 2. Inserir um macrociclo de teste
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
    'Preparação para maratona',
    '2025-12-07',
    '2026-08-07',
    'sub 3h',
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 3. Obter o ID do macrociclo criado
WITH macrociclo_teste AS (
    SELECT id FROM public.macrociclos 
    WHERE name = 'Maratona Teste' 
    LIMIT 1
)

-- 4. Inserir mesociclos de teste
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
ON CONFLICT DO NOTHING;

-- 5. Inserir mais um mesociclo
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
ON CONFLICT DO NOTHING;

-- 6. Verificar os dados inseridos
SELECT 
    'Macrociclos' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
UNION ALL
SELECT 
    'Mesociclos' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos;

-- 7. Verificar relacionamentos
SELECT 
    mc.name as macrociclo,
    m.name as mesociclo,
    m.mesociclo_type,
    m.start_date,
    m.end_date
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
ORDER BY mc.name, m.start_date;
