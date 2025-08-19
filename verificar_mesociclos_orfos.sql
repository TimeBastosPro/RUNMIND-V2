-- Script para verificar mesociclos órfãos e problemas de relacionamento
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar mesociclos órfãos (sem macrociclo)
SELECT 
    'Mesociclos órfãos' as tipo,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE macrociclo_id IS NULL

UNION ALL

-- 2. Verificar mesociclos com macrociclo inexistente
SELECT 
    'Mesociclos com macrociclo inexistente' as tipo,
    COUNT(*) as quantidade
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.macrociclo_id IS NOT NULL AND mc.id IS NULL

UNION ALL

-- 3. Verificar mesociclos da Aline especificamente
SELECT 
    'Total de mesociclos da Aline' as tipo,
    COUNT(*) as quantidade
FROM mesociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'aline@gmail.com';

-- 4. Listar mesociclos órfãos da Aline
SELECT 
    m.id,
    m.name,
    m.macrociclo_id,
    m.start_date,
    m.end_date,
    m.focus,
    m.created_at
FROM mesociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'aline@gmail.com' 
  AND (m.macrociclo_id IS NULL OR m.macrociclo_id NOT IN (
    SELECT id FROM macrociclos
  ))
ORDER BY m.created_at DESC;

-- 5. Verificar relacionamento entre mesociclos e macrociclos da Aline
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_nome,
    m.macrociclo_id,
    mc.name as macrociclo_nome,
    m.start_date,
    m.end_date,
    m.focus
FROM mesociclos m
JOIN profiles p ON m.user_id = p.id
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE p.email = 'aline@gmail.com'
ORDER BY m.created_at DESC
LIMIT 20;

-- 6. Verificar se há mesociclos duplicados
SELECT 
    name,
    macrociclo_id,
    COUNT(*) as quantidade,
    ARRAY_AGG(id ORDER BY created_at) as ids_mesociclos
FROM mesociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'aline@gmail.com'
GROUP BY name, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 7. Limpar mesociclos órfãos (EXECUTE APENAS SE NECESSÁRIO)
-- ⚠️ ATENÇÃO: Esta query vai excluir mesociclos órfãos!
-- Descomente apenas se quiser limpar os mesociclos órfãos

/*
DELETE FROM mesociclos 
WHERE macrociclo_id IS NULL 
  AND user_id IN (
    SELECT id FROM profiles WHERE email = 'aline@gmail.com'
  );
*/

-- 8. Verificar se há problemas de integridade
SELECT 
    'Mesociclos sem user_id' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE user_id IS NULL

UNION ALL

SELECT 
    'Mesociclos com datas inválidas' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE start_date IS NULL OR end_date IS NULL OR start_date > end_date

UNION ALL

SELECT 
    'Mesociclos sem nome' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE name IS NULL OR name = '';
