-- Corrigir erro PGRST116 - Mesociclos retornando múltiplas linhas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantos mesociclos existem para a Aline
SELECT 
    'CONTAGEM_MESOCICLOS' as tipo,
    COUNT(*) as total_mesociclos,
    COUNT(DISTINCT macrociclo_id) as macrociclos_diferentes
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- 2. Verificar se há mesociclos duplicados
SELECT 
    'MESOCICLOS_DUPLICADOS' as tipo,
    name,
    macrociclo_id,
    COUNT(*) as quantidade
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
GROUP BY name, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 3. Verificar se há microciclos para esses mesociclos
SELECT 
    'MICROCICLOS_POR_MESOCICLO' as tipo,
    mesociclo_id,
    COUNT(*) as total_microciclos
FROM public.microciclos
WHERE mesociclo_id IN (
    SELECT id FROM public.mesociclos 
    WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
)
GROUP BY mesociclo_id
ORDER BY total_microciclos DESC;

-- 4. Verificar se há dados importantes nos mesociclos
SELECT 
    'DADOS_IMPORTANTES_MESOCICLOS' as tipo,
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    created_at
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- 5. Verificar se há microciclos com dados importantes
SELECT 
    'DADOS_IMPORTANTES_MICROCICLOS' as tipo,
    id,
    name,
    microciclo_type,
    focus,
    mesociclo_id,
    created_at
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Resumo do problema
SELECT 
    'RESUMO_PROBLEMA' as tipo,
    'PGRST116 causado por múltiplos mesociclos' as problema,
    'Aplicação usa .single() mas há 15 mesociclos' as causa,
    'Remover .single() ou filtrar por macrociclo_id' as solucao;
