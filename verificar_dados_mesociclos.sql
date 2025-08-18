-- Script para verificar dados dos mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os mesociclos com detalhes
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

-- 2. Verificar se há problemas de dados
SELECT 
    name,
    mesociclo_type,
    start_date,
    end_date,
    CASE 
        WHEN start_date > end_date THEN 'ERRO: Data início > Data fim'
        WHEN start_date = end_date THEN 'ERRO: Mesmas datas'
        ELSE 'OK'
    END as status_datas
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
