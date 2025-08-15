-- Script para limpar mesociclos incorretos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados atuais (problemáticos)
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    created_at
FROM public.mesociclos
ORDER BY created_at;

-- 2. Verificar sobreposições
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
    AND (
        (m1.start_date <= m2.end_date AND m1.end_date >= m2.start_date)
    )
ORDER BY m1.start_date;

-- 3. DELETAR TODOS os mesociclos incorretos
DELETE FROM public.mesociclos;

-- 4. Verificar se a tabela está limpa
SELECT COUNT(*) as total_mesociclos FROM public.mesociclos;

-- 5. Verificar macrociclos disponíveis
SELECT 
    id,
    name,
    start_date,
    end_date,
    ROUND(
        (EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / (24 * 60 * 60)) / 7
    ) as semanas_totais
FROM public.macrociclos
ORDER BY created_at;
