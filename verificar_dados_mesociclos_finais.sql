-- Script final para verificar dados de mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar situação atual dos dados
SELECT 
    'Resumo Atual' as tipo,
    COUNT(*) as total_macrociclos,
    (SELECT COUNT(*) FROM public.mesociclos) as total_mesociclos
FROM public.macrociclos;

-- 2. Verificar todos os macrociclos com seus mesociclos
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    mc.start_date as macrociclo_inicio,
    mc.end_date as macrociclo_fim,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name ORDER BY m.start_date) as nomes_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name, mc.start_date, mc.end_date
ORDER BY mc.created_at;

-- 3. Verificar detalhes de todos os mesociclos
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
ORDER BY m.created_at;

-- 4. Verificar se há problemas de relacionamento
SELECT 
    CASE 
        WHEN m.macrociclo_id IS NULL THEN 'Mesociclo sem macrociclo_id'
        WHEN mc.id IS NULL THEN 'Mesociclo com macrociclo_id inválido'
        ELSE 'Relacionamento OK'
    END as status,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
GROUP BY 
    CASE 
        WHEN m.macrociclo_id IS NULL THEN 'Mesociclo sem macrociclo_id'
        WHEN mc.id IS NULL THEN 'Mesociclo com macrociclo_id inválido'
        ELSE 'Relacionamento OK'
    END;

-- 5. Verificar se há sobreposições de datas
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

-- 6. Verificar usuários que têm dados
SELECT 
    p.email,
    COUNT(DISTINCT mc.id) as total_macrociclos,
    COUNT(DISTINCT m.id) as total_mesociclos
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.macrociclos mc ON u.id = mc.user_id
LEFT JOIN public.mesociclos m ON u.id = m.user_id
GROUP BY p.email
ORDER BY total_macrociclos DESC, total_mesociclos DESC;
