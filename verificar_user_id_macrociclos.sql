-- Verificar qual usuário possui os macrociclos
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar todos os macrociclos e seus usuários
SELECT 
    '=== TODOS OS MACROCICLOS ===' as info,
    m.id,
    m.name as nome_macrociclo,
    m.user_id,
    p.email,
    p.full_name,
    p.user_type,
    m.created_at
FROM macrociclos m
LEFT JOIN profiles p ON m.user_id = p.id
ORDER BY m.created_at DESC;

-- 2. Verificar se o user_id dos macrociclos corresponde à Aline
SELECT 
    '=== VERIFICAÇÃO ALINE ===' as info,
    CASE 
        WHEN p.email = 'aline@gmail.com' THEN 'SIM - É a Aline'
        ELSE 'NÃO - Não é a Aline'
    END as eh_aline,
    m.name as macrociclo,
    p.email,
    p.full_name
FROM macrociclos m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE m.name IN ('Maratona de Berlim', 'Maratona de Lisbon', 'Maratona de Lisboa', 'Maratona de Porto');

-- 3. Verificar se há outros usuários com macrociclos
SELECT 
    '=== TODOS OS USUÁRIOS COM MACROCICLOS ===' as info,
    p.email,
    p.full_name,
    p.user_type,
    COUNT(m.id) as total_macrociclos
FROM profiles p
LEFT JOIN macrociclos m ON p.id = m.user_id
WHERE m.id IS NOT NULL
GROUP BY p.id, p.email, p.full_name, p.user_type
ORDER BY total_macrociclos DESC;

-- 4. Verificar se a Aline existe na tabela profiles
SELECT 
    '=== DADOS DA ALINE NO PROFILES ===' as info,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM profiles 
WHERE email = 'aline@gmail.com';
