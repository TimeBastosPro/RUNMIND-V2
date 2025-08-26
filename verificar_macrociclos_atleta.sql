-- Script para verificar macrociclos da atleta Aline
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Primeiro, vamos encontrar o ID da atleta Aline
SELECT 
    '=== DADOS DA ATLETA ALINE ===' as info,
    id,
    email,
    full_name,
    user_type,
    created_at
FROM profiles 
WHERE email = 'aline@gmail.com';

-- 2. Verificar quantos macrociclos existem para a atleta
SELECT 
    '=== MACROCICLOS DA ATLETA ===' as info,
    COUNT(*) as total_macrociclos
FROM macrociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'aline@gmail.com';

-- 3. Listar todos os macrociclos da atleta com detalhes
SELECT 
    '=== DETALHES DOS MACROCICLOS ===' as info,
    m.id,
    m.name as nome_macrociclo,
    m.objective as objetivo,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.duration_weeks as duracao_semanas,
    m.created_at as criado_em,
    p.full_name as atleta
FROM macrociclos m
JOIN profiles p ON m.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY m.created_at DESC;

-- 4. Verificar se há mesociclos relacionados
SELECT 
    '=== MESOCICLOS RELACIONADOS ===' as info,
    COUNT(*) as total_mesociclos
FROM mesociclos mes
JOIN macrociclos mac ON mes.macrociclo_id = mac.id
JOIN profiles p ON mac.user_id = p.id
WHERE p.email = 'aline@gmail.com';

-- 5. Verificar se há microciclos relacionados
SELECT 
    '=== MICROCICLOS RELACIONADOS ===' as info,
    COUNT(*) as total_microciclos
FROM microciclos mic
JOIN mesociclos mes ON mic.mesociclo_id = mes.id
JOIN macrociclos mac ON mes.macrociclo_id = mac.id
JOIN profiles p ON mac.user_id = p.id
WHERE p.email = 'aline@gmail.com';

-- 6. Resumo completo
SELECT 
    '=== RESUMO COMPLETO ===' as info,
    (SELECT COUNT(*) FROM macrociclos m JOIN profiles p ON m.user_id = p.id WHERE p.email = 'aline@gmail.com') as macrociclos,
    (SELECT COUNT(*) FROM mesociclos mes JOIN macrociclos mac ON mes.macrociclo_id = mac.id JOIN profiles p ON mac.user_id = p.id WHERE p.email = 'aline@gmail.com') as mesociclos,
    (SELECT COUNT(*) FROM microciclos mic JOIN mesociclos mes ON mic.mesociclo_id = mes.id JOIN macrociclos mac ON mes.macrociclo_id = mac.id JOIN profiles p ON mac.user_id = p.id WHERE p.email = 'aline@gmail.com') as microciclos;
