-- Corrigir PGRST116 - Solução Final
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se há dados importantes para preservar
SELECT 
    'DADOS_IMPORTANTES_PRESERVAR' as tipo,
    'Verificando dados que devem ser preservados' as descricao;

-- Mesociclos com dados importantes
SELECT 
    'MESOCICLOS_IMPORTANTES' as tipo,
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    created_at
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- Microciclos com dados importantes
SELECT 
    'MICROCICLOS_IMPORTANTES' as tipo,
    id,
    name,
    focus,
    start_date,
    end_date,
    created_at
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC;

-- 2. Verificar se há relacionamentos importantes
SELECT 
    'RELACIONAMENTOS_IMPORTANTES' as tipo,
    'Verificando relacionamentos entre ciclos' as descricao;

-- Relacionamentos mesociclos -> macrociclos
SELECT 
    'MESOCICLOS_MACROCICLOS' as tipo,
    m.id as mesociclo_id,
    m.name as mesociclo_name,
    m.macrociclo_id,
    mc.name as macrociclo_name
FROM public.mesociclos m
LEFT JOIN public.macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY m.created_at DESC;

-- Relacionamentos microciclos -> mesociclos
SELECT 
    'MICROCICLOS_MESOCICLOS' as tipo,
    mic.id as microciclo_id,
    mic.name as microciclo_name,
    mic.mesociclo_id,
    mes.name as mesociclo_name
FROM public.microciclos mic
LEFT JOIN public.mesociclos mes ON mic.mesociclo_id = mes.id
WHERE mic.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY mic.created_at DESC;

-- 3. Resumo do problema e solução
SELECT 
    'RESUMO_PROBLEMA_PGRST116' as tipo,
    'PGRST116 causado por múltiplos mesociclos' as problema,
    '15 mesociclos retornam múltiplas linhas em JOIN' as causa,
    'Aplicação usa .single() mas há 15 registros' as detalhe,
    'Remover .single() das queries de ciclos' as solucao;

-- 4. Verificar se há dados duplicados que precisam ser limpos
SELECT 
    'VERIFICAR_DUPLICATAS' as tipo,
    'Verificando se há dados duplicados' as descricao;

-- Mesociclos duplicados por nome e macrociclo
SELECT 
    'MESOCICLOS_DUPLICADOS' as tipo,
    name,
    macrociclo_id,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
GROUP BY name, macrociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Microciclos duplicados por nome e mesociclo
SELECT 
    'MICROCICLOS_DUPLICADOS' as tipo,
    name,
    mesociclo_id,
    COUNT(*) as quantidade,
    STRING_AGG(id::text, ', ') as ids
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
GROUP BY name, mesociclo_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. Instruções para correção
SELECT 
    'INSTRUCOES_CORRECAO' as tipo,
    '1. Remover .single() das funções fetchMesociclos e fetchMicrociclos' as passo1,
    '2. Usar .select() em vez de .select().single()' as passo2,
    '3. Tratar múltiplos registros no frontend' as passo3,
    '4. Verificar se há duplicatas para limpeza' as passo4;
