-- Script simples para adicionar coluna mesociclo_type
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar a coluna (se não existir)
ALTER TABLE public.mesociclos 
ADD COLUMN IF NOT EXISTS mesociclo_type TEXT;

-- 2. Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
AND column_name = 'mesociclo_type';

-- 3. Mostrar todas as colunas da tabela
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
