-- Script para verificar dados dos mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os mesociclos
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    created_at,
    updated_at
FROM public.mesociclos
ORDER BY start_date;

-- 2. Verificar se há mesociclos duplicados
SELECT 
    name,
    mesociclo_type,
    start_date,
    end_date,
    COUNT(*) as quantidade
FROM public.mesociclos
GROUP BY name, mesociclo_type, start_date, end_date
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 3. Verificar mesociclos por macrociclo
SELECT 
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    mc.name as macrociclo_name
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.start_date;

-- 4. Calcular semanas de cada mesociclo
SELECT 
    name,
    mesociclo_type,
    start_date,
    end_date,
    ROUND(
        (EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / (24 * 60 * 60)) / 7
    ) as semanas_calculadas
FROM public.mesociclos
ORDER BY start_date;
