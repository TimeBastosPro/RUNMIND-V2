-- Script para verificar solicitações de vínculo duplicadas
-- Este script identifica e resolve o problema de solicitações duplicadas

-- 1. Verificar todas as solicitações pendentes
SELECT '=== TODAS AS SOLICITAÇÕES PENDENTES ===' as status;

SELECT 
    id,
    athlete_id,
    coach_id,
    modality,
    status,
    created_at,
    updated_at,
    notes
FROM athlete_coach_relationships 
WHERE status = 'pending'
ORDER BY athlete_id, coach_id, modality, created_at;

-- 2. Identificar solicitações duplicadas por atleta, treinador e modalidade
SELECT '=== SOLICITAÇÕES DUPLICADAS ===' as status;

SELECT 
    athlete_id,
    coach_id,
    modality,
    COUNT(*) as total_solicitacoes,
    MIN(created_at) as primeira_solicitacao,
    MAX(created_at) as ultima_solicitacao,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as ids_solicitacoes
FROM athlete_coach_relationships 
WHERE status = 'pending'
GROUP BY athlete_id, coach_id, modality
HAVING COUNT(*) > 1
ORDER BY athlete_id, coach_id, modality;

-- 3. Verificar solicitações duplicadas com detalhes dos usuários
SELECT '=== DETALHES DAS SOLICITAÇÕES DUPLICADAS ===' as status;

WITH duplicadas AS (
    SELECT 
        athlete_id,
        coach_id,
        modality,
        COUNT(*) as total
    FROM athlete_coach_relationships 
    WHERE status = 'pending'
    GROUP BY athlete_id, coach_id, modality
    HAVING COUNT(*) > 1
)
SELECT 
    d.athlete_id,
    p.full_name as nome_atleta,
    p.email as email_atleta,
    d.coach_id,
    c.full_name as nome_treinador,
    c.email as email_treinador,
    d.modality,
    d.total as solicitacoes_duplicadas,
    acr.created_at,
    acr.id as relationship_id
FROM duplicadas d
JOIN athlete_coach_relationships acr ON 
    d.athlete_id = acr.athlete_id AND 
    d.coach_id = acr.coach_id AND 
    d.modality = acr.modality AND
    acr.status = 'pending'
JOIN profiles p ON d.athlete_id = p.id
JOIN coaches c ON d.coach_id = c.user_id
ORDER BY d.athlete_id, d.coach_id, d.modality, acr.created_at;

-- 4. Contar solicitações por status
SELECT '=== CONTAGEM POR STATUS ===' as status;

SELECT 
    status,
    COUNT(*) as total
FROM athlete_coach_relationships 
GROUP BY status
ORDER BY status;

-- 5. Verificar solicitações pendentes por atleta
SELECT '=== SOLICITAÇÕES PENDENTES POR ATLETA ===' as status;

SELECT 
    acr.athlete_id,
    p.full_name as nome_atleta,
    p.email as email_atleta,
    COUNT(*) as total_pendentes,
    STRING_AGG(acr.modality, ', ' ORDER BY acr.modality) as modalidades
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.status = 'pending'
GROUP BY acr.athlete_id, p.full_name, p.email
ORDER BY total_pendentes DESC;

-- 6. Verificar solicitações pendentes por treinador
SELECT '=== SOLICITAÇÕES PENDENTES POR TREINADOR ===' as status;

SELECT 
    acr.coach_id,
    c.full_name as nome_treinador,
    c.email as email_treinador,
    COUNT(*) as total_pendentes,
    STRING_AGG(acr.modality, ', ' ORDER BY acr.modality) as modalidades
FROM athlete_coach_relationships acr
JOIN coaches c ON acr.coach_id = c.user_id
WHERE acr.status = 'pending'
GROUP BY acr.coach_id, c.full_name, c.email
ORDER BY total_pendentes DESC;

-- 7. Verificar relacionamentos ativos para comparação
SELECT '=== RELACIONAMENTOS ATIVOS ===' as status;

SELECT 
    acr.athlete_id,
    p.full_name as nome_atleta,
    acr.coach_id,
    c.full_name as nome_treinador,
    acr.modality,
    acr.created_at,
    acr.approved_at
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
JOIN coaches c ON acr.coach_id = c.user_id
WHERE acr.status = 'active'
ORDER BY acr.created_at DESC;
