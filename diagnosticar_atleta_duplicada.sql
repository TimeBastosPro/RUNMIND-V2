-- Diagnosticar e corrigir atleta duplicada
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os relacionamentos existentes
SELECT 
    'RELACIONAMENTOS_EXISTENTES' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.requested_at,
    acr.created_at,
    acr.updated_at,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN public.profiles p ON acr.athlete_id = p.id
ORDER BY acr.created_at DESC;

-- 2. Verificar relacionamentos específicos da Aline
SELECT 
    'RELACIONAMENTOS_ALINE' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.requested_at,
    acr.created_at,
    acr.updated_at,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN public.profiles p ON acr.athlete_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY acr.created_at DESC;

-- 3. Verificar relacionamentos do treinador timebastos
SELECT 
    'RELACIONAMENTOS_TIMESBASTOS' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.requested_at,
    acr.created_at,
    acr.updated_at,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN public.profiles p ON acr.athlete_id = p.id
WHERE c.email = 'timebastos@gmail.com'
ORDER BY acr.created_at DESC;

-- 4. Identificar duplicatas (mesmo coach + mesmo athlete)
SELECT 
    'DUPLICATAS_IDENTIFICADAS' as tipo,
    acr.coach_id,
    acr.athlete_id,
    COUNT(*) as quantidade_relacionamentos,
    STRING_AGG(acr.id::text, ', ') as ids_relacionamentos,
    STRING_AGG(acr.status, ', ') as status_relacionamentos,
    STRING_AGG(acr.created_at::text, ', ') as datas_criacao,
    c.email as coach_email,
    p.email as athlete_email,
    p.full_name as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN public.profiles p ON acr.athlete_id = p.id
GROUP BY acr.coach_id, acr.athlete_id, c.email, p.email, p.full_name
HAVING COUNT(*) > 1
ORDER BY quantidade_relacionamentos DESC;

-- 5. Mostrar dados para limpeza
SELECT 
    'DADOS_PARA_LIMPEZA' as tipo,
    'Para cada duplicata, manter apenas o relacionamento mais recente' as instrucao,
    'Deletar relacionamentos mais antigos' as acao;
