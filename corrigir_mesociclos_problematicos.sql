-- Script para corrigir problemas com mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar situação atual
SELECT 
    'Antes da correção' as status,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo,
    COUNT(CASE WHEN macrociclo_id IS NULL THEN 1 END) as sem_macrociclo
FROM public.mesociclos;

-- 2. Remover mesociclos órfãos (sem macrociclo_id)
DELETE FROM public.mesociclos 
WHERE macrociclo_id IS NULL;

-- 3. Remover mesociclos com macrociclo_id inválido
DELETE FROM public.mesociclos 
WHERE macrociclo_id NOT IN (SELECT id FROM public.macrociclos);

-- 4. Remover mesociclos duplicados (manter apenas o mais recente)
DELETE FROM public.mesociclos 
WHERE id NOT IN (
    SELECT DISTINCT ON (name, mesociclo_type, start_date, end_date, macrociclo_id) 
        id 
    FROM public.mesociclos 
    ORDER BY name, mesociclo_type, start_date, end_date, macrociclo_id, created_at DESC
);

-- 5. Verificar situação após correção
SELECT 
    'Após a correção' as status,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN macrociclo_id IS NOT NULL THEN 1 END) as com_macrociclo,
    COUNT(CASE WHEN macrociclo_id IS NULL THEN 1 END) as sem_macrociclo
FROM public.mesociclos;

-- 6. Verificar relacionamentos válidos
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name ORDER BY m.start_date) as nomes_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name
ORDER BY mc.created_at;

-- 7. Verificar se há sobreposições restantes
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

-- 8. Verificar estrutura final
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
ORDER BY created_at;
