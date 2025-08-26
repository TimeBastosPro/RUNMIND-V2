-- Limpar atleta duplicada - Script Simples e Direto
-- Execute este script no Supabase SQL Editor

-- 1. Verificar relacionamentos ativos do timebastos
SELECT 
    'RELACIONAMENTOS_ATIVOS' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.created_at,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.id
JOIN public.profiles p ON acr.athlete_id = p.id
WHERE c.email = 'timebastos@gmail.com'
AND acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 2. Verificar se há duplicatas para a Aline
SELECT 
    'DUPLICATAS_ALINE' as tipo,
    COUNT(*) as total_relacionamentos,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.id
JOIN public.profiles p ON acr.athlete_id = p.id
WHERE c.email = 'timebastos@gmail.com'
AND p.email = 'aline@gmail.com'
AND acr.status = 'active'
GROUP BY p.email, p.full_name;

-- 3. Mostrar IDs dos relacionamentos da Aline para limpeza
SELECT 
    'IDS_PARA_LIMPEZA' as tipo,
    acr.id,
    acr.created_at,
    'Manter apenas o mais recente' as acao
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.id
JOIN public.profiles p ON acr.athlete_id = p.id
WHERE c.email = 'timebastos@gmail.com'
AND p.email = 'aline@gmail.com'
AND acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 4. Contar total de relacionamentos ativos
SELECT 
    'TOTAL_RELACIONAMENTOS' as tipo,
    COUNT(*) as total_ativos,
    COUNT(DISTINCT acr.athlete_id) as atletas_unicos
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.id
WHERE c.email = 'timebastos@gmail.com'
AND acr.status = 'active';
