-- Script para verificar como os mesociclos estão sendo carregados na aplicação
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os usuários que têm mesociclos
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COUNT(m.id) as total_mesociclos
FROM profiles p
LEFT JOIN mesociclos m ON p.id = m.user_id
GROUP BY p.id, p.email, p.full_name
HAVING COUNT(m.id) > 0
ORDER BY total_mesociclos DESC;

-- 2. Verificar mesociclos ativos por usuário
SELECT 
    p.email,
    p.full_name,
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.status,
    m.data_inicio,
    m.data_fim,
    m.created_at
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
WHERE m.status = 'ativo'
ORDER BY m.created_at DESC;

-- 3. Verificar mesociclos por período (últimos 30 dias)
SELECT 
    p.email,
    p.full_name,
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.status,
    m.data_inicio,
    m.data_fim,
    m.created_at
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
WHERE m.created_at >= NOW() - INTERVAL '30 days'
ORDER BY m.created_at DESC;

-- 4. Verificar mesociclos com macrociclos
SELECT 
    p.email,
    p.full_name,
    mc.nome as macrociclo_nome,
    m.nome as mesociclo_nome,
    m.status,
    m.data_inicio,
    m.data_fim,
    m.created_at
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
ORDER BY m.created_at DESC;

-- 5. Verificar dados específicos para aline@gmail.com
-- Primeiro, encontrar todos os perfis da Aline
SELECT 
    id as user_id,
    email,
    full_name,
    created_at
FROM profiles 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;

-- 6. Verificar mesociclos da Aline (substitua USER_ID_DA_ALINE pelo ID encontrado)
SELECT 
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
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
    mc.nome as macrociclo_nome,
    mc.id as macrociclo_id
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'USER_ID_DA_ALINE'
ORDER BY m.created_at DESC;

-- 7. Verificar se há mesociclos órfãos (sem macrociclo)
SELECT 
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.user_id,
    m.macrociclo_id,
    m.status,
    m.created_at
FROM mesociclos m
WHERE m.macrociclo_id IS NULL
ORDER BY m.created_at DESC;

-- 8. Verificar mesociclos com dados incompletos
SELECT 
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.user_id,
    m.data_inicio,
    m.data_fim,
    m.status,
    m.created_at,
    CASE 
        WHEN m.data_inicio IS NULL THEN 'Data início ausente'
        WHEN m.data_fim IS NULL THEN 'Data fim ausente'
        WHEN m.nome IS NULL OR m.nome = '' THEN 'Nome ausente'
        WHEN m.status IS NULL THEN 'Status ausente'
        ELSE 'OK'
    END as problema
FROM mesociclos m
WHERE 
    m.data_inicio IS NULL 
    OR m.data_fim IS NULL 
    OR m.nome IS NULL 
    OR m.nome = ''
    OR m.status IS NULL
ORDER BY m.created_at DESC;

-- 9. Verificar contagem de mesociclos por status
SELECT 
    status,
    COUNT(*) as quantidade
FROM mesociclos 
GROUP BY status
ORDER BY quantidade DESC;

-- 10. Verificar mesociclos criados hoje
SELECT 
    p.email,
    p.full_name,
    m.id as mesociclo_id,
    m.nome as mesociclo_nome,
    m.status,
    m.created_at
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
WHERE DATE(m.created_at) = CURRENT_DATE
ORDER BY m.created_at DESC;

-- 11. Verificar RLS (Row Level Security) para mesociclos
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'mesociclos'
ORDER BY policyname;

-- 12. Verificar se há mesociclos duplicados
SELECT 
    user_id,
    macrociclo_id,
    nome,
    COUNT(*) as quantidade,
    ARRAY_AGG(id ORDER BY created_at) as ids_mesociclos
FROM mesociclos 
GROUP BY user_id, macrociclo_id, nome
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
