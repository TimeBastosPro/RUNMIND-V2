-- Script para verificar dados de mesociclos no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela mesociclos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
ORDER BY ordinal_position;

-- 2. Verificar todos os mesociclos existentes
SELECT 
    id,
    user_id,
    macrociclo_id,
    nome,
    descricao,
    data_inicio,
    data_fim,
    objetivo,
    carga_treino,
    intensidade,
    volume,
    status,
    created_at,
    updated_at
FROM mesociclos 
ORDER BY created_at DESC;

-- 3. Verificar mesociclos por usuário específico (substitua o user_id)
SELECT 
    m.id,
    m.user_id,
    m.macrociclo_id,
    m.nome,
    m.descricao,
    m.data_inicio,
    m.data_fim,
    m.objetivo,
    m.carga_treino,
    m.intensidade,
    m.volume,
    m.status,
    m.created_at,
    m.updated_at,
    mc.nome as macrociclo_nome
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'SUBSTITUA_PELO_USER_ID_AQUI'
ORDER BY m.created_at DESC;

-- 4. Verificar contagem de mesociclos por usuário
SELECT 
    user_id,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as mesociclos_ativos,
    COUNT(CASE WHEN status = 'concluido' THEN 1 END) as mesociclos_concluidos,
    MIN(created_at) as primeiro_mesociclo,
    MAX(created_at) as ultimo_mesociclo
FROM mesociclos 
GROUP BY user_id
ORDER BY total_mesociclos DESC;

-- 5. Verificar mesociclos com problemas (datas inválidas, etc.)
SELECT 
    id,
    user_id,
    nome,
    data_inicio,
    data_fim,
    status,
    created_at
FROM mesociclos 
WHERE 
    data_inicio IS NULL 
    OR data_fim IS NULL 
    OR data_inicio > data_fim
    OR status IS NULL
ORDER BY created_at DESC;

-- 6. Verificar relacionamento com macrociclos
SELECT 
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.user_id,
    mc.id as macrociclo_id,
    mc.nome as macrociclo_nome,
    m.status,
    m.created_at
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.created_at DESC;

-- 7. Verificar RLS (Row Level Security) da tabela mesociclos
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

-- 8. Verificar permissões da tabela mesociclos
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'mesociclos';

-- 9. Verificar se há dados duplicados ou inconsistentes
SELECT 
    user_id,
    macrociclo_id,
    nome,
    COUNT(*) as quantidade
FROM mesociclos 
GROUP BY user_id, macrociclo_id, nome
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 10. Verificar dados de mesociclos para o email específico (aline@gmail.com)
-- Primeiro, encontrar o user_id do email
SELECT 
    id as user_id,
    email,
    full_name
FROM profiles 
WHERE email = 'aline@gmail.com';

-- Depois, usar o user_id encontrado para verificar os mesociclos
-- (Substitua 'USER_ID_DA_ALINE' pelo ID encontrado na query acima)
SELECT 
    m.id,
    m.user_id,
    m.macrociclo_id,
    m.nome,
    m.descricao,
    m.data_inicio,
    m.data_fim,
    m.objetivo,
    m.carga_treino,
    m.intensidade,
    m.volume,
    m.status,
    m.created_at,
    m.updated_at,
    mc.nome as macrociclo_nome
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'USER_ID_DA_ALINE'
ORDER BY m.created_at DESC;
