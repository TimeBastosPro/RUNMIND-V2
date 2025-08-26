-- Script para corrigir os tipos de mesociclos no Supabase
-- Este script mapeia os tipos atuais para os tipos válidos do banco

-- 1. Verificar situação atual
SELECT '=== SITUAÇÃO ATUAL ===' as status;

SELECT 
    focus as tipo_atual,
    COUNT(*) as total
FROM mesociclos 
WHERE focus IS NOT NULL
GROUP BY focus
ORDER BY total DESC;

-- 2. Mapeamento dos tipos
SELECT '=== MAPEAMENTO PROPOSTO ===' as status;

SELECT 
    'Ordinário' as tipo_atual,
    'base' as tipo_correto,
    'Mesociclo base/ordinário' as descricao
UNION ALL
SELECT 
    'Estabilizador' as tipo_atual,
    'estabilizador' as tipo_correto,
    'Mesociclo estabilizador' as descricao
UNION ALL
SELECT 
    'Choque' as tipo_atual,
    'desenvolvimento' as tipo_correto,
    'Mesociclo de desenvolvimento/choque' as descricao
UNION ALL
SELECT 
    'Regenerativo' as tipo_atual,
    'recuperativo' as tipo_correto,
    'Mesociclo recuperativo/regenerativo' as descricao
UNION ALL
SELECT 
    'Pré-competitivo' as tipo_atual,
    'pre_competitivo' as tipo_correto,
    'Mesociclo pré-competitivo' as descricao
UNION ALL
SELECT 
    'Competitivo' as tipo_atual,
    'competitivo' as tipo_correto,
    'Mesociclo competitivo' as descricao;

-- 3. Atualizar os tipos de mesociclos
SELECT '=== ATUALIZANDO TIPOS ===' as status;

-- Atualizar campo mesociclo_type baseado no focus
UPDATE mesociclos 
SET mesociclo_type = 
    CASE focus
        WHEN 'Ordinário' THEN 'base'
        WHEN 'Estabilizador' THEN 'estabilizador'
        WHEN 'Choque' THEN 'desenvolvimento'
        WHEN 'Regenerativo' THEN 'recuperativo'
        WHEN 'Pré-competitivo' THEN 'pre_competitivo'
        WHEN 'Competitivo' THEN 'competitivo'
        ELSE focus -- Manter o valor original se não encontrar mapeamento
    END
WHERE focus IS NOT NULL;

-- 4. Verificar resultado da atualização
SELECT '=== RESULTADO APÓS ATUALIZAÇÃO ===' as status;

SELECT 
    focus as tipo_original,
    mesociclo_type as tipo_corrigido,
    COUNT(*) as total
FROM mesociclos 
WHERE focus IS NOT NULL
GROUP BY focus, mesociclo_type
ORDER BY total DESC;

-- 5. Verificar se há inconsistências restantes
SELECT '=== VERIFICANDO INCONSISTÊNCIAS ===' as status;

SELECT 
    id,
    name,
    focus,
    mesociclo_type,
    CASE 
        WHEN focus IS NULL AND mesociclo_type IS NULL THEN 'AMBOS NULOS'
        WHEN focus IS NULL THEN 'FOCUS NULO'
        WHEN mesociclo_type IS NULL THEN 'MESOCICLO_TYPE NULO'
        WHEN focus != mesociclo_type THEN 'DIFERENTES'
        ELSE 'IGUAIS'
    END as status
FROM mesociclos 
WHERE focus IS NULL 
   OR mesociclo_type IS NULL 
   OR focus != mesociclo_type
ORDER BY created_at DESC;

-- 6. Verificar se todos os tipos estão válidos
SELECT '=== TIPOS VÁLIDOS NO BANCO ===' as status;

SELECT 
    'mesociclo_type' as campo,
    mesociclo_type as valor,
    COUNT(*) as total
FROM mesociclos 
WHERE mesociclo_type IS NOT NULL
GROUP BY mesociclo_type
ORDER BY total DESC;

-- 7. Resumo final
SELECT '=== RESUMO FINAL ===' as status;

SELECT 
    'Total de mesociclos' as metric,
    COUNT(*) as valor
FROM mesociclos

UNION ALL

SELECT 
    'Com focus definido' as metric,
    COUNT(*) as valor
FROM mesociclos 
WHERE focus IS NOT NULL

UNION ALL

SELECT 
    'Com mesociclo_type definido' as metric,
    COUNT(*) as valor
FROM mesociclos 
WHERE mesociclo_type IS NOT NULL

UNION ALL

SELECT 
    'Tipos válidos no banco' as metric,
    COUNT(*) as valor
FROM mesociclos 
WHERE mesociclo_type IN ('base', 'desenvolvimento', 'estabilizador', 'especifico', 'pre_competitivo', 'polimento', 'competitivo', 'transicao', 'recuperativo');
