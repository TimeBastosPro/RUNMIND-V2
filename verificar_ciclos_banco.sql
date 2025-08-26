-- Script para verificar ciclos de treinamento no banco de dados
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existem macrociclos
SELECT 
    'macrociclos' as tabela,
    COUNT(*) as total_registros
FROM macrociclos;

-- 2. Verificar se existem mesociclos
SELECT 
    'mesociclos' as tabela,
    COUNT(*) as total_registros
FROM mesociclos;

-- 3. Verificar se existem microciclos
SELECT 
    'microciclos' as tabela,
    COUNT(*) as total_registros
FROM microciclos;

-- 4. Verificar macrociclos com detalhes
SELECT 
    m.id,
    m.user_id,
    m.name,
    m.start_date,
    m.end_date,
    m.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM macrociclos m
LEFT JOIN profiles p ON m.user_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Verificar mesociclos com detalhes
SELECT 
    mes.id,
    mes.user_id,
    mes.macrociclo_id,
    mes.name,
    mes.start_date,
    mes.end_date,
    mes.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email,
    mac.name as macrociclo_name
FROM mesociclos mes
LEFT JOIN profiles p ON mes.user_id = p.id
LEFT JOIN macrociclos mac ON mes.macrociclo_id = mac.id
ORDER BY mes.created_at DESC
LIMIT 10;

-- 6. Verificar microciclos com detalhes
SELECT 
    mic.id,
    mic.user_id,
    mic.mesociclo_id,
    mic.name,
    mic.start_date,
    mic.end_date,
    mic.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email,
    mes.name as mesociclo_name,
    mac.name as macrociclo_name
FROM microciclos mic
LEFT JOIN profiles p ON mic.user_id = p.id
LEFT JOIN mesociclos mes ON mic.mesociclo_id = mes.id
LEFT JOIN macrociclos mac ON mes.macrociclo_id = mac.id
ORDER BY mic.created_at DESC
LIMIT 10;

-- 7. Verificar relacionamentos coach-atleta
SELECT 
    acr.id as relationship_id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.created_at,
    c.full_name as coach_name,
    c.email as coach_email,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.user_id
LEFT JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.status = 'accepted'
ORDER BY acr.created_at DESC;

-- 8. Verificar se existem ciclos para atletas vinculados
SELECT 
    'macrociclos' as tipo_ciclo,
    COUNT(*) as total
FROM macrociclos m
WHERE m.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
)
UNION ALL
SELECT 
    'mesociclos' as tipo_ciclo,
    COUNT(*) as total
FROM mesociclos mes
WHERE mes.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
)
UNION ALL
SELECT 
    'microciclos' as tipo_ciclo,
    COUNT(*) as total
FROM microciclos mic
WHERE mic.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
);

-- 9. Verificar políticas RLS para tabelas de ciclos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('macrociclos', 'mesociclos', 'microciclos')
ORDER BY tablename, policyname;

-- 10. Verificar se RLS está habilitado nas tabelas de ciclos
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('macrociclos', 'mesociclos', 'microciclos')
ORDER BY tablename;
