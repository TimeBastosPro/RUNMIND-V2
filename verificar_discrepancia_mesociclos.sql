-- Script para verificar discrepância entre estrutura esperada e real da tabela mesociclos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela mesociclos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
ORDER BY ordinal_position;

-- 2. Verificar campos que a aplicação espera vs campos que existem
-- Campos esperados pela aplicação (TypeScript):
-- - id: string
-- - user_id: string  
-- - macrociclo_id: string
-- - name: string
-- - description?: string
-- - start_date: string
-- - end_date: string
-- - focus?: string
-- - intensity_level?: 'baixa' | 'moderada' | 'alta' | 'muito_alta'
-- - volume_level?: 'baixo' | 'moderado' | 'alto' | 'muito_alto'
-- - created_at: string
-- - updated_at: string

-- 3. Verificar se há campos extras na tabela que não são usados pela aplicação
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
  AND column_name NOT IN (
    'id', 'user_id', 'macrociclo_id', 'name', 'description', 
    'start_date', 'end_date', 'focus', 'intensity_level', 
    'volume_level', 'created_at', 'updated_at'
  )
ORDER BY ordinal_position;

-- 4. Verificar se há campos faltando na tabela que a aplicação espera
-- (Esta query vai mostrar campos que a aplicação espera mas não existem na tabela)
-- Campos esperados: id, user_id, macrociclo_id, name, description, start_date, end_date, focus, intensity_level, volume_level, created_at, updated_at

-- 5. Verificar dados reais na tabela para entender o formato
SELECT 
    id,
    user_id,
    macrociclo_id,
    name,
    description,
    start_date,
    end_date,
    focus,
    intensity_level,
    volume_level,
    notes,
    mesociclo_type,
    created_at,
    updated_at
FROM mesociclos 
LIMIT 5;

-- 6. Verificar se há dados com campos que a aplicação não espera
SELECT 
    id,
    name,
    mesociclo_type,
    notes,
    created_at
FROM mesociclos 
WHERE mesociclo_type IS NOT NULL 
   OR notes IS NOT NULL
LIMIT 10;

-- 7. Verificar valores únicos nos campos que podem ter problemas
SELECT 
    'intensity_level' as campo,
    intensity_level as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE intensity_level IS NOT NULL
GROUP BY intensity_level
UNION ALL
SELECT 
    'volume_level' as campo,
    volume_level as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE volume_level IS NOT NULL
GROUP BY volume_level
UNION ALL
SELECT 
    'focus' as campo,
    focus as valor,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE focus IS NOT NULL
GROUP BY focus
ORDER BY campo, quantidade DESC;

-- 8. Verificar se há mesociclos com dados inconsistentes
SELECT 
    id,
    name,
    start_date,
    end_date,
    CASE 
        WHEN start_date > end_date THEN 'Data início > Data fim'
        WHEN start_date IS NULL THEN 'Data início ausente'
        WHEN end_date IS NULL THEN 'Data fim ausente'
        WHEN name IS NULL OR name = '' THEN 'Nome ausente'
        ELSE 'OK'
    END as problema
FROM mesociclos 
WHERE 
    start_date IS NULL 
    OR end_date IS NULL 
    OR name IS NULL 
    OR name = ''
    OR start_date > end_date
ORDER BY created_at DESC;

-- 9. Verificar relacionamento com macrociclos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_nome,
    m.user_id,
    m.macrociclo_id,
    mc.name as macrociclo_nome,
    CASE 
        WHEN mc.id IS NULL THEN 'Mesociclo órfão (sem macrociclo)'
        ELSE 'OK'
    END as status_relacionamento
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.created_at DESC
LIMIT 10;
