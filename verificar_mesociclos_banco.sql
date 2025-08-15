-- Script para verificar mesociclos no banco
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela mesociclos existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'mesociclos';

-- 2. Verificar estrutura da tabela mesociclos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'mesociclos'
ORDER BY ordinal_position;

-- 3. Verificar todos os mesociclos existentes
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

-- 4. Verificar macrociclos existentes
SELECT 
    id,
    name,
    start_date,
    end_date,
    user_id,
    created_at
FROM public.macrociclos
ORDER BY created_at;

-- 5. Verificar relacionamentos entre macrociclos e mesociclos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.created_at;

-- 6. Contar mesociclos por macrociclo
SELECT 
    mc.name as macrociclo_name,
    mc.id as macrociclo_id,
    COUNT(m.id) as total_mesociclos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name
ORDER BY mc.created_at;
