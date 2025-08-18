-- Script para verificar TODOS os mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Contar total de mesociclos
SELECT COUNT(*) as total_mesociclos FROM public.mesociclos;

-- 2. Verificar TODOS os mesociclos com detalhes
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    created_at,
    -- Calcular semanas corretamente
    ROUND(
        (EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / (24 * 60 * 60)) / 7
    ) as semanas_calculadas
FROM public.mesociclos
ORDER BY start_date;

-- 3. Verificar mesociclos por macrociclo
SELECT 
    mc.name as macrociclo_name,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    ROUND(
        (EXTRACT(EPOCH FROM (m.end_date::timestamp - m.start_date::timestamp)) / (24 * 60 * 60)) / 7
    ) as semanas
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.start_date;

-- 4. Verificar se há mesociclos com datas idênticas
SELECT 
    start_date,
    end_date,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes
FROM public.mesociclos
GROUP BY start_date, end_date
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
