-- Script para limpar solicitações de vínculo duplicadas
-- ⚠️ ATENÇÃO: Este script remove solicitações duplicadas, mantendo apenas a mais recente

-- 1. Verificar solicitações duplicadas antes da limpeza
SELECT '=== VERIFICAÇÃO ANTES DA LIMPEZA ===' as status;

SELECT 
    athlete_id,
    coach_id,
    modality,
    COUNT(*) as total_solicitacoes
FROM athlete_coach_relationships 
WHERE status = 'pending'
GROUP BY athlete_id, coach_id, modality
HAVING COUNT(*) > 1
ORDER BY athlete_id, coach_id, modality;

-- 2. Identificar IDs das solicitações duplicadas para remoção
WITH duplicadas AS (
    SELECT 
        id,
        athlete_id,
        coach_id,
        modality,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY athlete_id, coach_id, modality 
            ORDER BY created_at DESC
        ) as rn
    FROM athlete_coach_relationships 
    WHERE status = 'pending'
)
SELECT '=== IDs PARA REMOÇÃO ===' as status;

SELECT 
    id,
    athlete_id,
    coach_id,
    modality,
    created_at
FROM duplicadas 
WHERE rn > 1
ORDER BY athlete_id, coach_id, modality, created_at;

-- 3. REMOVER solicitações duplicadas (manter apenas a mais recente)
-- ⚠️ EXECUTE APENAS SE ESTIVER CERTO DE QUE QUER REMOVER AS DUPLICADAS

WITH duplicadas AS (
    SELECT 
        id,
        athlete_id,
        coach_id,
        modality,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY athlete_id, coach_id, modality 
            ORDER BY created_at DESC
        ) as rn
    FROM athlete_coach_relationships 
    WHERE status = 'pending'
)
DELETE FROM athlete_coach_relationships 
WHERE id IN (
    SELECT id 
    FROM duplicadas 
    WHERE rn > 1
);

-- 4. Verificar resultado após a limpeza
SELECT '=== VERIFICAÇÃO APÓS A LIMPEZA ===' as status;

SELECT 
    athlete_id,
    coach_id,
    modality,
    COUNT(*) as total_solicitacoes
FROM athlete_coach_relationships 
WHERE status = 'pending'
GROUP BY athlete_id, coach_id, modality
HAVING COUNT(*) > 1
ORDER BY athlete_id, coach_id, modality;

-- 5. Contar solicitações pendentes restantes
SELECT '=== SOLICITAÇÕES PENDENTES RESTANTES ===' as status;

SELECT 
    status,
    COUNT(*) as total
FROM athlete_coach_relationships 
GROUP BY status
ORDER BY status;

-- 6. Verificar solicitações pendentes com detalhes
SELECT '=== DETALHES DAS SOLICITAÇÕES PENDENTES ===' as status;

SELECT 
    acr.id,
    p.full_name as nome_atleta,
    p.email as email_atleta,
    c.full_name as nome_treinador,
    c.email as email_treinador,
    acr.modality,
    acr.created_at,
    acr.notes
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
JOIN coaches c ON acr.coach_id = c.user_id
WHERE acr.status = 'pending'
ORDER BY acr.created_at DESC;
