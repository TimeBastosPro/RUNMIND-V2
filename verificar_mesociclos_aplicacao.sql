-- Script para verificar dados de mesociclos que estão sendo carregados na aplicação
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela mesociclos (campos que a aplicação usa)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
ORDER BY ordinal_position;

-- 2. Verificar todos os mesociclos com os campos que a aplicação carrega
SELECT 
    id,
    user_id,
    macrociclo_id,
    name as nome,
    mesociclo_type as tipo,
    start_date as data_inicio,
    end_date as data_fim,
    created_at,
    updated_at
FROM mesociclos 
ORDER BY created_at DESC;

-- 3. Verificar mesociclos por usuário específico (como a aplicação faz)
-- Substitua 'USER_ID_AQUI' pelo ID do usuário que você quer verificar
SELECT 
    m.id,
    m.user_id,
    m.macrociclo_id,
    m.name as nome,
    m.mesociclo_type as tipo,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.created_at,
    m.updated_at,
    mc.name as macrociclo_nome
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'USER_ID_AQUI'
ORDER BY m.start_date ASC;

-- 4. Verificar mesociclos para aline@gmail.com
-- Primeiro, encontrar o user_id da Aline
SELECT 
    id as user_id,
    email,
    full_name
FROM profiles 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;

-- Depois, verificar os mesociclos da Aline (substitua USER_ID_DA_ALINE pelo ID encontrado)
SELECT 
    m.id,
    m.user_id,
    m.macrociclo_id,
    m.name as nome,
    m.mesociclo_type as tipo,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.created_at,
    m.updated_at,
    mc.name as macrociclo_nome
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'USER_ID_DA_ALINE'
ORDER BY m.start_date ASC;

-- 5. Verificar mesociclos com problemas (datas inválidas, etc.)
SELECT 
    id,
    user_id,
    name as nome,
    start_date as data_inicio,
    end_date as data_fim,
    mesociclo_type as tipo,
    created_at,
    CASE 
        WHEN start_date IS NULL THEN 'Data início ausente'
        WHEN end_date IS NULL THEN 'Data fim ausente'
        WHEN name IS NULL OR name = '' THEN 'Nome ausente'
        WHEN start_date > end_date THEN 'Data início maior que fim'
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

-- 6. Verificar contagem de mesociclos por usuário
SELECT 
    p.email,
    p.full_name,
    COUNT(m.id) as total_mesociclos,
    COUNT(CASE WHEN m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE THEN 1 END) as mesociclos_ativos_hoje
FROM profiles p
LEFT JOIN mesociclos m ON p.id = m.user_id
GROUP BY p.id, p.email, p.full_name
HAVING COUNT(m.id) > 0
ORDER BY total_mesociclos DESC;

-- 7. Verificar mesociclos ativos (que incluem a data atual)
SELECT 
    p.email,
    p.full_name,
    m.id as mesociclo_id,
    m.name as nome,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.mesociclo_type as tipo,
    mc.name as macrociclo_nome
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE
ORDER BY m.start_date DESC;

-- 8. Verificar mesociclos criados recentemente (últimos 7 dias)
SELECT 
    p.email,
    p.full_name,
    m.id as mesociclo_id,
    m.name as nome,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.created_at
FROM profiles p
JOIN mesociclos m ON p.id = m.user_id
WHERE m.created_at >= NOW() - INTERVAL '7 days'
ORDER BY m.created_at DESC;

-- 9. Verificar RLS (Row Level Security) da tabela mesociclos
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'mesociclos'
ORDER BY policyname;

-- 10. Verificar se há mesociclos duplicados
SELECT 
    user_id,
    macrociclo_id,
    name,
    COUNT(*) as quantidade,
    ARRAY_AGG(id ORDER BY created_at) as ids_mesociclos
FROM mesociclos 
GROUP BY user_id, macrociclo_id, name
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 11. Verificar mesociclos órfãos (sem macrociclo)
SELECT 
    m.id,
    m.user_id,
    m.name as nome,
    m.macrociclo_id,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.created_at
FROM mesociclos m
WHERE m.macrociclo_id IS NULL
ORDER BY m.created_at DESC;

-- 12. Verificar relacionamento completo entre macrociclos e mesociclos
SELECT 
    mc.id as macrociclo_id,
    mc.name as macrociclo_nome,
    mc.user_id,
    COUNT(m.id) as total_mesociclos,
    ARRAY_AGG(m.name ORDER BY m.start_date) as nomes_mesociclos
FROM macrociclos mc
LEFT JOIN mesociclos m ON mc.id = m.macrociclo_id
GROUP BY mc.id, mc.name, mc.user_id
ORDER BY mc.created_at DESC;
