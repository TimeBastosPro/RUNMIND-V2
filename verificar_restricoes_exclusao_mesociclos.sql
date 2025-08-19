-- Script para verificar restrições que podem impedir a exclusão de mesociclos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se há microciclos associados aos mesociclos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_nome,
    COUNT(mic.id) as microciclos_associados
FROM mesociclos m
LEFT JOIN microciclos mic ON m.id = mic.mesociclo_id
GROUP BY m.id, m.name
HAVING COUNT(mic.id) > 0
ORDER BY microciclos_associados DESC;

-- 2. Verificar se há outras tabelas que referenciam mesociclos
-- (Esta query verifica se há outras tabelas com foreign keys para mesociclos)
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'mesociclos';

-- 3. Verificar se há RLS (Row Level Security) ativo na tabela mesociclos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mesociclos';

-- 4. Verificar se há triggers na tabela mesociclos
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'mesociclos';

-- 5. Testar exclusão de um mesociclo específico (substitua o ID)
-- ⚠️ ATENÇÃO: Esta query vai realmente excluir o mesociclo!
-- Descomente apenas se quiser testar a exclusão

/*
-- Primeiro, verificar se o mesociclo existe
SELECT id, name, user_id FROM mesociclos WHERE id = 'ID_DO_MESOCICLO';

-- Depois, tentar excluir (substitua 'ID_DO_MESOCICLO' pelo ID real)
DELETE FROM mesociclos WHERE id = 'ID_DO_MESOCICLO';
*/

-- 6. Verificar se há problemas de permissão
-- Execute esta query como o usuário que está tentando excluir
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'mesociclos';

-- 7. Verificar se há mesociclos órfãos (sem macrociclo)
SELECT 
    id,
    name,
    macrociclo_id,
    user_id
FROM mesociclos 
WHERE macrociclo_id IS NULL OR macrociclo_id NOT IN (
    SELECT id FROM macrociclos
);

-- 8. Verificar integridade dos dados
SELECT 
    'Mesociclos sem user_id' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE user_id IS NULL

UNION ALL

SELECT 
    'Mesociclos sem macrociclo_id' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE macrociclo_id IS NULL

UNION ALL

SELECT 
    'Mesociclos com datas inválidas' as problema,
    COUNT(*) as quantidade
FROM mesociclos 
WHERE start_date IS NULL OR end_date IS NULL OR start_date > end_date;

-- 9. Verificar se há mesociclos duplicados
SELECT 
    name,
    macrociclo_id,
    user_id,
    COUNT(*) as quantidade
FROM mesociclos 
GROUP BY name, macrociclo_id, user_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
