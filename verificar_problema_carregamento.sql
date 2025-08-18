-- Script para verificar problema de carregamento dos mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'timebastos@gmail.com';

-- 2. Verificar se há mesociclos para o usuário
SELECT 
    'Total de mesociclos' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 3. Verificar se há macrociclos para o usuário
SELECT 
    'Total de macrociclos' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 4. Verificar se os mesociclos têm macrociclo_id válido
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.id as macrociclo_existe,
    mc.name as macrociclo_name,
    m.user_id as mesociclo_user_id,
    mc.user_id as macrociclo_user_id
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY m.created_at;

-- 5. Verificar se há problemas de RLS (Row Level Security)
-- Esta query deve retornar os mesmos dados que a aplicação deveria ver
SELECT 
    'Teste RLS - Mesociclos' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 6. Verificar se há problemas de RLS - Macrociclos
SELECT 
    'Teste RLS - Macrociclos' as tipo,
    COUNT(*) as quantidade
FROM public.macrociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 7. Verificar se há mesociclos com user_id diferente
SELECT 
    'Mesociclos com user_id diferente' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.user_id != (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 8. Verificar se há mesociclos órfãos (sem macrociclo correspondente)
SELECT 
    'Mesociclos órfãos' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.id IS NULL;

-- 9. Verificar se há mesociclos com macrociclo_id nulo
SELECT 
    'Mesociclos com macrociclo_id nulo' as tipo,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND macrociclo_id IS NULL;

-- 10. Listar todos os mesociclos com detalhes completos
SELECT 
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.mesociclo_type,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    m.user_id,
    mc.name as macrociclo_name,
    mc.user_id as macrociclo_user_id,
    m.created_at,
    m.updated_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY m.created_at;
