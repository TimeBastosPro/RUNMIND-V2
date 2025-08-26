-- Verificar estrutura real das tabelas de ciclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela mesociclos
SELECT 
    'ESTRUTURA_MESOCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mesociclos'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela microciclos
SELECT 
    'ESTRUTURA_MICROCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'microciclos'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela macrociclos
SELECT 
    'ESTRUTURA_MACROCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'macrociclos'
ORDER BY ordinal_position;

-- 4. Verificar dados reais dos mesociclos da Aline
SELECT 
    'DADOS_REAIS_MESOCICLOS' as tipo,
    id,
    name,
    user_id,
    macrociclo_id,
    start_date,
    end_date,
    created_at,
    updated_at
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar dados reais dos microciclos da Aline
SELECT 
    'DADOS_REAIS_MICROCICLOS' as tipo,
    id,
    name,
    user_id,
    mesociclo_id,
    created_at,
    updated_at
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Contar total de registros
SELECT 
    'CONTAGEM_TOTAL' as tipo,
    'mesociclos' as tabela,
    COUNT(*) as total
FROM public.mesociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
    'CONTAGEM_TOTAL' as tipo,
    'microciclos' as tabela,
    COUNT(*) as total
FROM public.microciclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
    'CONTAGEM_TOTAL' as tipo,
    'macrociclos' as tabela,
    COUNT(*) as total
FROM public.macrociclos
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- 7. Resumo da estrutura
SELECT 
    'RESUMO_ESTRUTURA' as tipo,
    'Verificando estrutura real das tabelas' as acao,
    'Ajustar queries conforme estrutura encontrada' as proximo_passo;
