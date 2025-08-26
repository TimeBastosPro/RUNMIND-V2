-- Script para verificar os tipos de mesociclos no Supabase
-- Este script mostra como os mesociclos estão sendo salvos e quais tipos estão sendo usados

-- 1. Verificar a estrutura da tabela mesociclos
SELECT '=== ESTRUTURA DA TABELA MESOCICLOS ===' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar os tipos de mesociclo definidos no banco
SELECT '=== TIPOS DE MESOCICLO DEFINIDOS NO BANCO ===' as status;

SELECT 
    'mesociclo_type' as campo,
    'base, desenvolvimento, estabilizador, especifico, pre_competitivo, polimento, competitivo, transicao, recuperativo' as tipos_permitidos
UNION ALL
SELECT 
    'focus' as campo,
    'TEXT (livre - sem restrições)' as tipos_permitidos;

-- 3. Verificar os tipos de mesociclo definidos no código
SELECT '=== TIPOS DE MESOCICLO DEFINIDOS NO CÓDIGO ===' as status;

SELECT 
    'MESOCICLO_TYPES' as fonte,
    'Ordinário, Estabilizador, Choque, Regenerativo, Pré-competitivo, Competitivo' as tipos_definidos;

-- 4. Verificar dados reais salvos na tabela
SELECT '=== DADOS REAIS SALVOS NA TABELA ===' as status;

SELECT 
    id,
    name,
    focus,
    mesociclo_type,
    start_date,
    end_date,
    created_at
FROM mesociclos 
ORDER BY created_at DESC
LIMIT 20;

-- 5. Contar quantos mesociclos de cada tipo
SELECT '=== CONTAGEM POR TIPO ===' as status;

SELECT 
    COALESCE(focus, 'NÃO DEFINIDO') as tipo_focus,
    COALESCE(mesociclo_type, 'NÃO DEFINIDO') as tipo_mesociclo,
    COUNT(*) as total
FROM mesociclos 
GROUP BY focus, mesociclo_type
ORDER BY total DESC;

-- 6. Verificar inconsistências entre focus e mesociclo_type
SELECT '=== INCONSISTÊNCIAS ENTRE FOCUS E MESOCICLO_TYPE ===' as status;

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

-- 7. Verificar se os tipos usados estão dentro dos permitidos
SELECT '=== TIPOS FORA DOS PERMITIDOS ===' as status;

SELECT 
    'focus' as campo,
    focus as valor,
    COUNT(*) as total
FROM mesociclos 
WHERE focus NOT IN ('base', 'desenvolvimento', 'estabilizador', 'especifico', 'pre_competitivo', 'polimento', 'competitivo', 'transicao', 'recuperativo')
  AND focus IS NOT NULL
GROUP BY focus

UNION ALL

SELECT 
    'mesociclo_type' as campo,
    mesociclo_type as valor,
    COUNT(*) as total
FROM mesociclos 
WHERE mesociclo_type NOT IN ('base', 'desenvolvimento', 'estabilizador', 'especifico', 'pre_competitivo', 'polimento', 'competitivo', 'transicao', 'recuperativo')
  AND mesociclo_type IS NOT NULL
GROUP BY mesociclo_type

ORDER BY total DESC;
