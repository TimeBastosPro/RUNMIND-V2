-- Corrigir atleta duplicada - Manter apenas o relacionamento mais recente
-- Execute este script no Supabase SQL Editor

-- 1. Verificar relacionamentos da Aline antes da limpeza
SELECT 
    'ANTES_LIMPEZA' as tipo,
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
AND p.email = 'aline@gmail.com'
AND acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 2. Identificar o relacionamento mais antigo para deletar
WITH relacionamentos_aline AS (
    SELECT 
        acr.id,
        acr.created_at,
        ROW_NUMBER() OVER (ORDER BY acr.created_at DESC) as rn
    FROM public.athlete_coach_relationships acr
    JOIN public.coaches c ON acr.coach_id = c.id
    JOIN public.profiles p ON acr.athlete_id = p.id
    WHERE c.email = 'timebastos@gmail.com'
    AND p.email = 'aline@gmail.com'
    AND acr.status = 'active'
)
SELECT 
    'RELACIONAMENTO_PARA_DELETAR' as tipo,
    id,
    created_at,
    'Este será deletado (mais antigo)' as acao
FROM relacionamentos_aline
WHERE rn > 1;  -- Manter apenas o primeiro (mais recente)

-- 3. Deletar relacionamentos duplicados (manter apenas o mais recente)
WITH relacionamentos_aline AS (
    SELECT 
        acr.id,
        acr.created_at,
        ROW_NUMBER() OVER (ORDER BY acr.created_at DESC) as rn
    FROM public.athlete_coach_relationships acr
    JOIN public.coaches c ON acr.coach_id = c.id
    JOIN public.profiles p ON acr.athlete_id = p.id
    WHERE c.email = 'timebastos@gmail.com'
    AND p.email = 'aline@gmail.com'
    AND acr.status = 'active'
)
DELETE FROM public.athlete_coach_relationships
WHERE id IN (
    SELECT id 
    FROM relacionamentos_aline 
    WHERE rn > 1
);

-- 4. Verificar relacionamentos da Aline após a limpeza
SELECT 
    'APOS_LIMPEZA' as tipo,
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
AND p.email = 'aline@gmail.com'
AND acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 5. Verificar contagem final
SELECT 
    'CONTAGEM_FINAL' as tipo,
    COUNT(*) as total_relacionamentos_ativos,
    COUNT(DISTINCT acr.athlete_id) as atletas_unicos
FROM public.athlete_coach_relationships acr
JOIN public.coaches c ON acr.coach_id = c.id
WHERE c.email = 'timebastos@gmail.com'
AND acr.status = 'active';

-- 6. Resumo da correção
SELECT 
    'RESUMO_CORRECAO' as tipo,
    'Atleta duplicada corrigida com sucesso!' as status,
    'Agora teste a tela "Meus Atletas"' as proximo_passo;
