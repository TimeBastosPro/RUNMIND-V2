-- Script para verificar mesociclos da Aline (CORRIGIDO)
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, encontrar o user_id da Aline
SELECT 
    id as user_id,
    email,
    full_name,
    created_at
FROM profiles 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;

-- 2. Verificar mesociclos da Aline (execute esta query após encontrar o user_id)
-- Substitua 'UUID_DA_ALINE' pelo ID encontrado na query anterior
SELECT 
    id,
    name,
    start_date,
    end_date,
    focus,
    intensity_level,
    volume_level,
    notes,
    mesociclo_type,
    created_at
FROM mesociclos 
WHERE user_id = 'UUID_DA_ALINE'  -- ⚠️ SUBSTITUA pelo UUID real encontrado na query 1
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar todos os mesociclos mais recentes (para comparação)
SELECT 
    id,
    name,
    user_id,
    macrociclo_id,
    start_date,
    end_date,
    focus,
    intensity_level,
    volume_level,
    notes,
    mesociclo_type,
    created_at
FROM mesociclos 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há mesociclos com campos vazios ou NULL
SELECT 
    id,
    name,
    start_date,
    end_date,
    focus,
    intensity_level,
    volume_level,
    CASE 
        WHEN name IS NULL OR name = '' THEN 'Nome vazio'
        WHEN start_date IS NULL THEN 'Data início vazia'
        WHEN end_date IS NULL THEN 'Data fim vazia'
        WHEN focus IS NULL OR focus = '' THEN 'Focus vazio'
        WHEN intensity_level IS NULL THEN 'Intensidade vazia'
        WHEN volume_level IS NULL THEN 'Volume vazio'
        ELSE 'OK'
    END as problema
FROM mesociclos 
WHERE 
    name IS NULL OR name = ''
    OR start_date IS NULL
    OR end_date IS NULL
    OR focus IS NULL OR focus = ''
    OR intensity_level IS NULL
    OR volume_level IS NULL
ORDER BY created_at DESC;

-- 5. Verificar valores únicos nos campos de intensidade e volume
SELECT 
    'intensity_level' as campo,
    intensity_level as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE intensity_level IS NOT NULL
GROUP BY intensity_level
ORDER BY quantidade DESC;

SELECT 
    'volume_level' as campo,
    volume_level as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE volume_level IS NOT NULL
GROUP BY volume_level
ORDER BY quantidade DESC;

-- 6. Verificar valores únicos no campo focus
SELECT 
    'focus' as campo,
    focus as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE focus IS NOT NULL AND focus != ''
GROUP BY focus
ORDER BY quantidade DESC;

-- 7. Verificar mesociclos criados hoje
SELECT 
    id,
    name,
    start_date,
    end_date,
    focus,
    intensity_level,
    volume_level,
    created_at
FROM mesociclos 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 8. Verificar relacionamento com macrociclos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_nome,
    m.focus,
    m.intensity_level,
    m.volume_level,
    mc.name as macrociclo_nome,
    m.created_at
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 9. Verificar se há mesociclos duplicados (mesmo nome, mesmo macrociclo)
SELECT 
    name,
    macrociclo_id,
    COUNT(*) as quantidade,
    ARRAY_AGG(id ORDER BY created_at) as ids_mesociclos
FROM mesociclos 
GROUP BY name, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
