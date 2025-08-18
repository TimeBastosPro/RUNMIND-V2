-- Script para limpar e recriar mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados atuais
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    created_at
FROM public.mesociclos
ORDER BY created_at;

-- 2. Deletar todos os mesociclos existentes
DELETE FROM public.mesociclos;

-- 3. Verificar se a tabela está limpa
SELECT COUNT(*) as total_mesociclos FROM public.mesociclos;

-- 4. Verificar macrociclos disponíveis
SELECT 
    id,
    name,
    start_date,
    end_date
FROM public.macrociclos
ORDER BY created_at;

-- 5. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'mesociclos'
AND table_schema = 'public'
ORDER BY ordinal_position;
