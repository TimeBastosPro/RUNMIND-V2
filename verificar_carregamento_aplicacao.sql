-- Script para verificar problemas de carregamento na aplicação
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há problemas de cache ou sincronização
SELECT 
    'Verificação de sincronização' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(CASE WHEN m.updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as atualizados_ultima_hora,
    COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as criados_ultima_hora
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1);

-- 2. Verificar se há mesociclos com problemas de ordenação
SELECT 
    'Verificação de ordenação' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.start_date,
    m.end_date,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    ROW_NUMBER() OVER (PARTITION BY m.macrociclo_id ORDER BY m.start_date) as ordem_por_data
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
ORDER BY mc.created_at, m.start_date;

-- 3. Verificar se há mesociclos com problemas de tipo
SELECT 
    'Verificação de tipos' as tipo,
    m.mesociclo_type,
    COUNT(*) as quantidade,
    STRING_AGG(m.name, ', ') as mesociclos
FROM public.mesociclos m
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY m.mesociclo_type
ORDER BY m.mesociclo_type;

-- 4. Verificar se há mesociclos com problemas de descrição
SELECT 
    'Verificação de descrições' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.description,
    m.macrociclo_id,
    mc.name as macrociclo_name,
    CASE 
        WHEN m.description IS NULL THEN 'Descrição nula'
        WHEN m.description = '' THEN 'Descrição vazia'
        ELSE 'OK'
    END as status_descricao
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND (m.description IS NULL OR m.description = '');

-- 5. Verificar se há mesociclos com problemas de relacionamento
SELECT 
    'Verificação de relacionamentos completos' as tipo,
    mc.id as macrociclo_id,
    mc.name as macrociclo_name,
    mc.created_at as macrociclo_created,
    COUNT(m.id) as total_mesociclos,
    COUNT(CASE WHEN m.macrociclo_id = mc.id THEN 1 END) as mesociclos_corretos,
    COUNT(CASE WHEN m.macrociclo_id != mc.id THEN 1 END) as mesociclos_incorretos
FROM public.macrociclos mc
LEFT JOIN public.mesociclos m ON mc.id = m.macrociclo_id
WHERE mc.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
GROUP BY mc.id, mc.name, mc.created_at
ORDER BY mc.created_at;

-- 6. Verificar se há mesociclos órfãos
SELECT 
    'Mesociclos órfãos' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    m.user_id,
    m.created_at,
    m.updated_at
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com' LIMIT 1)
AND mc.id IS NULL;
