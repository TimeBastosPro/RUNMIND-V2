-- Script para verificar problemas com mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há mesociclos órfãos (sem macrociclo_id)
SELECT 
    'Mesociclos órfãos' as problema,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE macrociclo_id IS NULL
UNION ALL
SELECT 
    'Mesociclos com macrociclo_id inválido' as problema,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.macrociclo_id IS NOT NULL AND mc.id IS NULL;

-- 2. Verificar mesociclos órfãos em detalhes
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    user_id,
    created_at
FROM public.mesociclos
WHERE macrociclo_id IS NULL
ORDER BY created_at;

-- 3. Verificar mesociclos com macrociclo_id inválido
SELECT 
    m.id,
    m.name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    m.created_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.macrociclo_id IS NOT NULL AND mc.id IS NULL
ORDER BY m.created_at;

-- 4. Verificar relacionamentos válidos
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name) as nomes_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name
ORDER BY mc.created_at;

-- 5. Verificar se há mesociclos duplicados
SELECT 
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    COUNT(*) as quantidade
FROM public.mesociclos
GROUP BY name, mesociclo_type, start_date, end_date, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 6. Verificar se há sobreposições de datas
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
    AND (
        (m1.start_date <= m2.end_date AND m1.end_date >= m2.start_date)
    )
ORDER BY m1.start_date;

-- 7. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'mesociclos'
ORDER BY ordinal_position;

-- 8. Verificar constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'mesociclos';
