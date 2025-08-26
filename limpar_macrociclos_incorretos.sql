-- Script para limpar macrociclos criados incorretamente
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar quais macrociclos foram criados pelo treinador
SELECT 
    '=== MACROCICLOS DO TREINADOR ===' as info,
    m.id,
    m.name as nome_macrociclo,
    m.user_id,
    p.email,
    p.full_name,
    p.user_type,
    m.created_at
FROM macrociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'timebastos@gmail.com'
ORDER BY m.created_at DESC;

-- 2. Verificar se há mesociclos relacionados aos macrociclos do treinador
SELECT 
    '=== MESOCICLOS RELACIONADOS ===' as info,
    COUNT(*) as total_mesociclos
FROM mesociclos mes
JOIN macrociclos mac ON mes.macrociclo_id = mac.id
JOIN profiles p ON mac.user_id = p.id
WHERE p.email = 'timebastos@gmail.com';

-- 3. Verificar se há microciclos relacionados aos macrociclos do treinador
SELECT 
    '=== MICROCICLOS RELACIONADOS ===' as info,
    COUNT(*) as total_microciclos
FROM microciclos mic
JOIN mesociclos mes ON mic.mesociclo_id = mes.id
JOIN macrociclos mac ON mes.macrociclo_id = mac.id
JOIN profiles p ON mac.user_id = p.id
WHERE p.email = 'timebastos@gmail.com';

-- 4. DELETAR microciclos relacionados (cascata)
DELETE FROM microciclos 
WHERE mesociclo_id IN (
    SELECT mes.id 
    FROM mesociclos mes
    JOIN macrociclos mac ON mes.macrociclo_id = mac.id
    JOIN profiles p ON mac.user_id = p.id
    WHERE p.email = 'timebastos@gmail.com'
);

-- 5. DELETAR mesociclos relacionados
DELETE FROM mesociclos 
WHERE macrociclo_id IN (
    SELECT mac.id 
    FROM macrociclos mac
    JOIN profiles p ON mac.user_id = p.id
    WHERE p.email = 'timebastos@gmail.com'
);

-- 6. DELETAR macrociclos do treinador
DELETE FROM macrociclos 
WHERE user_id IN (
    SELECT p.id 
    FROM profiles p
    WHERE p.email = 'timebastos@gmail.com'
);

-- 7. Verificar se a limpeza foi bem-sucedida
SELECT 
    '=== VERIFICAÇÃO PÓS-LIMPEZA ===' as info,
    (SELECT COUNT(*) FROM macrociclos m JOIN profiles p ON m.user_id = p.id WHERE p.email = 'timebastos@gmail.com') as macrociclos_treinador,
    (SELECT COUNT(*) FROM mesociclos mes JOIN macrociclos mac ON mes.macrociclo_id = mac.id JOIN profiles p ON mac.user_id = p.id WHERE p.email = 'timebastos@gmail.com') as mesociclos_treinador,
    (SELECT COUNT(*) FROM microciclos mic JOIN mesociclos mes ON mic.mesociclo_id = mes.id JOIN macrociclos mac ON mes.macrociclo_id = mac.id JOIN profiles p ON mac.user_id = p.id WHERE p.email = 'timebastos@gmail.com') as microciclos_treinador;
